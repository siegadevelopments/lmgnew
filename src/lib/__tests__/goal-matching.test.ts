import { describe, it, expect } from "vitest";
import { matchGoal, guideForCategory, GOAL_TERMS } from "@/lib/goal-matching";
import { categoryConfig } from "@/lib/category-config";

describe("matchGoal", () => {
  it("matches clear topics (real article titles)", () => {
    expect(matchGoal("How to Create a Sound Sleep Routine (Naturally & Holistically)", "")).toBe("sleep-recovery");
    expect(matchGoal("Constipation: A Simple, Science-Based Look at a Common Problem", "")).toBe("gut-health");
    expect(matchGoal("Understanding and Reducing Hot Flushes: A Whole-Body Approach", "")).toBe("menopause-support");
    expect(matchGoal("Brain Fog and the Foods That May Be Making It Worse", "")).toBe("brain-health");
  });

  it("lets a goal in the title beat body mentions of another (regression)", () => {
    const body = "stress ".repeat(12) + "Hormones shift during this stage of life.";
    expect(matchGoal("Menopause Support: Natural Ways to Balance Hormones", body)).toBe("menopause-support");
  });

  it("doesn't misfire on everyday words (regression: 'rest', 'recovery')", () => {
    expect(matchGoal("Red Eyes and Dry Eyes", "Rest your eyes for the rest of the day during recovery from a cold.")).toBeNull();
  });

  it("returns nothing for unrelated content and respects eligible categories", () => {
    expect(matchGoal("Greek Yogurt Cake", "flour, sugar, yoghurt, lemon zest")).toBeNull();
    expect(matchGoal("Better sleep tonight", "sleep sleep", ["gut-health"])).toBeNull();
  });

  it("has topic terms for every category, and guides resolve", () => {
    for (const slug of Object.keys(categoryConfig)) expect(GOAL_TERMS[slug]?.length).toBeGreaterThan(0);
    expect(guideForCategory("menopause-support")?.slug).toBe("best-menopause-products-australia");
  });
});
