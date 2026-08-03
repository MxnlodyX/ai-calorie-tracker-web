import type {
  CreateFoodPayload,
  CreateMenulistPayload,
  DashboardMeal,
  FoodItem,
  MealType,
  MenulistItem,
} from "./types";

const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Additional"];

export function normalizeMealType(mealType: string | null | undefined): MealType {
  const matchedMealType = mealTypes.find(
    (knownType) => knownType.toLowerCase() === mealType?.toLowerCase(),
  );

  return matchedMealType ?? "Additional";
}

export function menulistToDashboardMeal(item: MenulistItem): DashboardMeal {
  return {
    id: item.id,
    name: item.name,
    mealType: normalizeMealType(item.mealType),
    description: item.description ?? "",
    calories: item.kcal,
    protein: item.proteinG ?? 0,
    carbs: item.carbG ?? 0,
    fat: item.fatG ?? 0,
    color: "bg-[#dbe8a7]",
  };
}

export function foodToDashboardMeal(item: FoodItem): DashboardMeal {
  return {
    id: item.id,
    name: item.name,
    mealType: normalizeMealType(item.mealType),
    description: "",
    calories: item.kcal,
    protein: item.proteinG,
    carbs: item.carbG,
    fat: item.fatG,
    color: "bg-[#ffdf5d]",
  };
}

export function dashboardMealToMenulistPayload(
  meal: DashboardMeal,
  userId: string,
): CreateMenulistPayload {
  return {
    userId,
    name: meal.name,
    mealType: meal.mealType,
    description: meal.description || undefined,
    kcal: meal.calories,
    proteinG: meal.protein,
    carbG: meal.carbs,
    fatG: meal.fat,
  };
}

export function dashboardMealToFoodPayload(
  meal: DashboardMeal,
  userId: string,
): CreateFoodPayload {
  return {
    userId,
    name: meal.name,
    mealType: meal.mealType.toLowerCase(),
    kcal: meal.calories,
    proteinG: meal.protein,
    carbG: meal.carbs,
    fatG: meal.fat,
    eatenAt: new Date().toISOString(),
  };
}

export function isTodayFoodItem(item: FoodItem) {
  const eatenDate = new Date(item.eatenAt);

  if (Number.isNaN(eatenDate.getTime())) {
    return false;
  }

  return eatenDate.toDateString() === new Date().toDateString();
}
