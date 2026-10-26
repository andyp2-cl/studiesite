import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Minimal stand-in for the Supabase query builder used by lib/ai.ts.
const db = vi.hoisted(() => ({
  budget: 5 as unknown,
  costs: [] as number[],
  inserted: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "settings") {
        const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { value: db.budget } }) };
        return q;
      }
      return {
        select: () => ({ gte: async () => ({ data: db.costs.map((cost_usd) => ({ cost_usd })), error: null }) }),
        insert: (row: Record<string, unknown>) => {
          db.inserted.push(row);
          return { select: () => ({ single: async () => ({ data: { id: "call-1" }, error: null }) }) };
        },
      };
    },
  }),
}));

const create = vi.hoisted(() => vi.fn());
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));

import { askClaude, aiStatus, estimateCostUsd, isWithinBudget, modelFor, startOfStockholmMonth } from "./ai";

const request = {
  purpose: "test",
  userId: "user-1",
  tier: "cheap" as const,
  system: "Svara kort.",
  prompt: "Hej",
  maxTokens: 200,
};

function reply(overrides: Record<string, unknown> = {}) {
  return {
    model: "claude-haiku-5-5",
    stop_reason: "end_turn",
    content: [{ type: "text", text: "Hej!" }],
    usage: { input_tokens: 1000, output_tokens: 200 },
    ...overrides,
  };
}

describe("estimateCostUsd", () => {
  it("prices Haiku 5.5 per million tokens", () => {
    expect(estimateCostUsd("claude-haiku-5-5", { input_tokens: 100_000, output_tokens: 100_000 })).toBeCloseTo(0.06);
  });

  it("prices cache writes at 1.25x and cache reads at 0.1x", () => {
    const cost = estimateCostUsd("claude-sonnet-5-5", {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 1_000_000,
      cache_read_input_tokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(2 * 1.25 + 2 * 0.1);
  });

  it("charges Haiku 5.5 5x for prompts over 100K tokens", () => {
    expect(estimateCostUsd("claude-haiku-5-5", { input_tokens: 200_000, output_tokens: 0 })).toBeCloseTo(0.1);
  });

  it("prices unknown models conservatively", () => {
    expect(estimateCostUsd("claude-something-new", { input_tokens: 1_000_000, output_tokens: 0 })).toBe(10);
  });
});

describe("modelFor", () => {
  it("needs both a key and a model", () => {
    expect(modelFor("cheap", { AI_MODEL_CHEAP: "claude-haiku-5-5" })).toBeNull();
    expect(modelFor("cheap", { ANTHROPIC_API_KEY: "k" })).toBeNull();
    expect(modelFor("smart", { ANTHROPIC_API_KEY: "k", AI_MODEL_SMART: "claude-sonnet-5-5" })).toBe("claude-sonnet-5-5");
  });
});

describe("isWithinBudget", () => {
  it("blocks at the budget and when no budget is set", () => {
    expect(isWithinBudget(4.99, 5)).toBe(true);
    expect(isWithinBudget(5, 5)).toBe(false);
    expect(isWithinBudget(0, 0)).toBe(false);
  });
});

describe("startOfStockholmMonth", () => {
  it("starts at Swedish midnight on the 1st", () => {
    expect(startOfStockholmMonth(new Date("2026-10-26T10:00:00Z")).toISOString()).toBe("2026-09-30T22:00:00.000Z");
    expect(startOfStockholmMonth(new Date("2026-12-15T10:00:00Z")).toISOString()).toBe("2026-11-30T23:00:00.000Z");
  });

  it("counts the first hours of a month in Swedish time to the new month", () => {
    expect(startOfStockholmMonth(new Date("2026-10-31T23:30:00Z")).toISOString()).toBe("2026-10-31T23:00:00.000Z");
  });
});

describe("askClaude", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL_CHEAP", "claude-haiku-5-5");
    db.budget = 5;
    db.costs = [];
    db.inserted = [];
    create.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("does nothing without an API key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(await aiStatus()).toEqual({ available: false, reason: "not_configured" });
    expect(await askClaude(request)).toEqual({ ok: false, reason: "not_configured" });
    expect(create).not.toHaveBeenCalled();
  });

  it("stops when the monthly budget is used up", async () => {
    db.costs = [3, 2];
    expect(await askClaude(request)).toEqual({ ok: false, reason: "budget_reached" });
    expect(create).not.toHaveBeenCalled();
  });

  it("calls the cheap model with low effort and logs the cost", async () => {
    create.mockResolvedValue(reply());
    const result = await askClaude(request);
    expect(result).toMatchObject({ ok: true, text: "Hej!", callId: "call-1" });
    expect(create.mock.calls[0][0]).toMatchObject({ model: "claude-haiku-5-5", max_tokens: 200, output_config: { effort: "low" } });
    expect(db.inserted[0]).toMatchObject({ user_id: "user-1", purpose: "test", input_tokens: 1000, output_tokens: 200 });
    expect(db.inserted[0].cost_usd).toBeCloseTo(0.0002);
  });

  it("parses JSON when a schema is given", async () => {
    create.mockResolvedValue(reply({ content: [{ type: "text", text: '{"verdict":"approved"}' }] }));
    const result = await askClaude({ ...request, jsonSchema: { type: "object" } });
    expect(result).toMatchObject({ ok: true, json: { verdict: "approved" } });
    expect(create.mock.calls[0][0].output_config.format).toEqual({ type: "json_schema", schema: { type: "object" } });
  });

  it("logs refused and truncated answers but reports them as failures", async () => {
    create.mockResolvedValueOnce(reply({ stop_reason: "refusal" }));
    expect(await askClaude(request)).toEqual({ ok: false, reason: "refused" });
    create.mockResolvedValueOnce(reply({ stop_reason: "max_tokens" }));
    expect(await askClaude(request)).toEqual({ ok: false, reason: "truncated" });
    expect(db.inserted).toHaveLength(2);
  });

  it("reports API errors without throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    create.mockRejectedValue(new Error("network"));
    expect(await askClaude(request)).toEqual({ ok: false, reason: "error" });
    expect(db.inserted).toHaveLength(0);
  });
});
