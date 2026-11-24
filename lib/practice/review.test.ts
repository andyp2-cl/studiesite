import { describe, expect, it } from "vitest";
import { latestResults, pickReviewTask } from "./review";

const tasks = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("pickReviewTask", () => {
  it("takes questions answered wrong first", () => {
    const last = new Map([
      ["a", true],
      ["b", false],
      ["c", true],
    ]);
    expect(pickReviewTask(tasks, last, new Set(), 0.99)?.id).toBe("b");
  });

  it("treats unanswered questions as missed", () => {
    expect(pickReviewTask(tasks, new Map([["a", true], ["b", true]]), new Set(), 0.5)?.id).toBe("c");
  });

  it("falls back to any question not yet in this round", () => {
    const allRight = new Map(tasks.map((t) => [t.id, true]));
    expect(pickReviewTask(tasks, allRight, new Set(["a", "b"]), 0)?.id).toBe("c");
    expect(pickReviewTask(tasks, allRight, new Set(["a", "b", "c"]), 0)).toBeNull();
  });
});

describe("latestResults", () => {
  it("keeps the newest answer per task", () => {
    const latest = latestResults([
      { task_id: "a", correct: true },
      { task_id: "a", correct: false },
      { task_id: null, correct: true },
      { task_id: "b", correct: false },
    ]);
    expect(latest).toEqual(new Map([["a", true], ["b", false]]));
  });
});
