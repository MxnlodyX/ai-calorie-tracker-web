import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  dashboardMealToFoodPayload,
  dashboardMealToMenulistPayload,
  foodToDashboardMeal,
  isTodayFoodItem,
  menulistToDashboardMeal,
  normalizeMealType,
} from "@/features/dashboard/mappers";
import type { DashboardMeal, FoodItem } from "@/features/dashboard/types";

const meal: DashboardMeal = {
  id: "meal-1",
  name: "Chicken rice",
  mealType: "Lunch",
  description: "High protein",
  calories: 520,
  protein: 35,
  carbs: 58,
  fat: 14,
  color: "bg-test",
};

describe("dashboard mappers", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("normalizes known meal types case-insensitively", () => {
    expect(normalizeMealType("BREAKFAST")).toBe("Breakfast");
    expect(normalizeMealType("lunch")).toBe("Lunch");
    expect(normalizeMealType(null)).toBe("Additional");
    expect(normalizeMealType("unknown")).toBe("Additional");
  });

  it("maps nullable menu macros to safe dashboard values", () => {
    expect(
      menulistToDashboardMeal({
        id: "saved-1",
        name: "Soup",
        mealType: null,
        kcal: 180,
        proteinG: null,
        carbG: null,
        fatG: null,
      }),
    ).toMatchObject({
      id: "saved-1",
      mealType: "Additional",
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it("maps food records to dashboard meals", () => {
    const food: FoodItem = {
      id: "food-1",
      name: "Omelette",
      mealType: "breakfast",
      kcal: 250,
      proteinG: 18,
      carbG: 4,
      fatG: 17,
      eatenAt: "2026-08-05T08:00:00",
    };

    expect(foodToDashboardMeal(food)).toMatchObject({
      id: "food-1",
      mealType: "Breakfast",
      calories: 250,
      protein: 18,
    });
  });

  it("creates backend payloads with normalized fields", () => {
    vi.setSystemTime(new Date(2026, 7, 5, 12, 34, 56));

    expect(dashboardMealToMenulistPayload(meal, "user-1")).toEqual({
      userId: "user-1",
      name: "Chicken rice",
      mealType: "Lunch",
      description: "High protein",
      kcal: 520,
      proteinG: 35,
      carbG: 58,
      fatG: 14,
    });
    expect(dashboardMealToFoodPayload(meal, "user-1")).toMatchObject({
      userId: "user-1",
      mealType: "lunch",
      eatenAt: "2026-08-05T12:34:56",
    });
  });

  it("recognizes today and rejects invalid timestamps", () => {
    vi.setSystemTime(new Date(2026, 7, 5, 12));
    const baseFood: FoodItem = {
      id: "food-1",
      name: "Meal",
      mealType: "lunch",
      kcal: 100,
      proteinG: 1,
      carbG: 1,
      fatG: 1,
      eatenAt: "2026-08-05T08:00:00",
    };

    expect(isTodayFoodItem(baseFood)).toBe(true);
    expect(isTodayFoodItem({ ...baseFood, eatenAt: "not-a-date" })).toBe(false);
    expect(isTodayFoodItem({ ...baseFood, eatenAt: "2026-08-04T23:59:00" })).toBe(false);
  });
});
