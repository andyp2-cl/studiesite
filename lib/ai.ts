import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfStockholmDay, stockholmParts } from "@/lib/time";

// The only way the app talks to Claude. Server-side only. Every call is checked
// against the monthly budget (settings.ai_monthly_budget_usd) before it is
// made and logged in ai_calls afterwards. Without ANTHROPIC_API_KEY the site
// keeps working and AI features report "not_configured".

export type AiTier = "cheap" | "smart";
export type AiFailure = "not_configured" | "budget_reached" | "refused" | "truncated" | "error";
export type AiStatus = { available: true } | { available: false; reason: "not_configured" | "budget_reached" };

export type AiRequest = {
  /** Short label stored in ai_calls, e.g. "writing_feedback". */
  purpose: string;
  /** The student or admin the call is made for (null for system jobs). */
  userId: string | null;
  tier: AiTier;
  system: string;
  prompt: string;
  /** Hard cap on output tokens. Keep it low: output is what costs. */
  maxTokens: number;
  /** Ask for JSON matching this schema; the parsed value is returned in `json`. */
  jsonSchema?: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
  /** Long drafts take a while; defaults to 60 s. */
  timeoutMs?: number;
};

export type AiResult =
  | { ok: true; text: string; json: unknown; costUsd: number; callId: string | null }
  | { ok: false; reason: AiFailure };

// USD per million tokens. Unknown models are priced as the most expensive
// one so the budget check errs on the safe side.
type Price = { input: number; output: number };
const PRICES: Record<string, Price> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-5-5": { input: 4, output: 20 },
};
const FALLBACK_PRICE: Price = { input: 10, output: 50 };
// Haiku 5.5 costs 5x more for prompts above 100K tokens.
const HAIKU_LONG_PROMPT_TOKENS = 100_000;

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const price = PRICES[model] ?? FALLBACK_PRICE;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const promptTokens = usage.input_tokens + cacheWrite + cacheRead;
  const multiplier = model === "claude-haiku-5-5" && promptTokens > HAIKU_LONG_PROMPT_TOKENS ? 5 : 1;
  const inputCost = usage.input_tokens + cacheWrite * 1.25 + cacheRead * 0.1;
  return ((inputCost * price.input + usage.output_tokens * price.output) * multiplier) / 1_000_000;
}

export function modelFor(tier: AiTier, env: Record<string, string | undefined> = process.env): string | null {
  const model = tier === "cheap" ? env.AI_MODEL_CHEAP : env.AI_MODEL_SMART;
  return env.ANTHROPIC_API_KEY && model ? model : null;
}

/** The instant the current month started in Swedish time. */
export function startOfStockholmMonth(date: Date = new Date()): Date {
  const { year, month } = stockholmParts(date);
  return startOfStockholmDay(new Date(Date.UTC(year, month - 1, 1, 12)));
}

export function isWithinBudget(spentUsd: number, budgetUsd: number): boolean {
  return budgetUsd > 0 && spentUsd < budgetUsd;
}

export async function monthlyBudgetUsd(): Promise<number> {
  const { data } = await createAdminClient()
    .from("settings")
    .select("value")
    .eq("key", "ai_monthly_budget_usd")
    .maybeSingle();
  const value = Number(data?.value);
  return Number.isFinite(value) ? value : 0;
}

export async function monthSpendUsd(now: Date = new Date()): Promise<number> {
  const { data, error } = await createAdminClient()
    .from("ai_calls")
    .select("cost_usd")
    .gte("created_at", startOfStockholmMonth(now).toISOString());
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.cost_usd), 0);
}

export async function aiStatus(tier: AiTier = "cheap"): Promise<AiStatus> {
  if (!modelFor(tier)) return { available: false, reason: "not_configured" };
  const [budget, spent] = await Promise.all([monthlyBudgetUsd(), monthSpendUsd()]);
  return isWithinBudget(spent, budget) ? { available: true } : { available: false, reason: "budget_reached" };
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 60_000, maxRetries: 2 });
  return client;
}

async function logCall(req: AiRequest, model: string, usage: TokenUsage, costUsd: number): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("ai_calls")
    .insert({
      user_id: req.userId,
      purpose: req.purpose,
      model,
      input_tokens: usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0),
      output_tokens: usage.output_tokens,
      cost_usd: costUsd,
    })
    .select("id")
    .single();
  if (error) {
    console.error("ai: could not log call", error);
    return null;
  }
  return data.id;
}

export async function askClaude(req: AiRequest): Promise<AiResult> {
  const status = await aiStatus(req.tier);
  if (!status.available) return { ok: false, reason: status.reason };
  const model = modelFor(req.tier)!;

  let response: Anthropic.Message;
  try {
    response = await getClient().messages.create(
      {
        model,
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: "user", content: req.prompt }],
        output_config: {
          effort: req.effort ?? (req.tier === "cheap" ? "low" : "medium"),
          ...(req.jsonSchema ? { format: { type: "json_schema", schema: req.jsonSchema } } : {}),
        },
      },
      req.timeoutMs ? { timeout: req.timeoutMs } : undefined,
    );
  } catch (error) {
    console.error(`ai: ${req.purpose} failed`, error);
    return { ok: false, reason: "error" };
  }

  // Price by the model that actually answered, and log even failed answers:
  // they cost money too.
  const costUsd = estimateCostUsd(response.model, response.usage);
  const callId = await logCall(req, response.model, response.usage, costUsd);

  if (response.stop_reason === "refusal") return { ok: false, reason: "refused" };
  if (response.stop_reason === "max_tokens") return { ok: false, reason: "truncated" };

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  let json: unknown = null;
  if (req.jsonSchema) {
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, reason: "error" };
    }
  }
  return { ok: true, text, json, costUsd, callId };
}
