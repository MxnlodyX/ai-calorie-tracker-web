import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

import type {
  CreateFoodPayload,
  CreateMenulistPayload,
  FoodItem,
  MenulistItem,
  UpdateFoodPayload,
  UpdateMenulistPayload,
} from "./types";

const dashboardEndpoints = {
  foods: "/foods",
  food: (mealId: string) => `/foods/${encodeURIComponent(mealId)}`,
  foodLists: "/food-lists",
  foodList: (mealId: string) => `/food-lists/${encodeURIComponent(mealId)}`,
};

type LegacyMeal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  eatenAt: string;
};

function isLegacyMeal(item: FoodItem | LegacyMeal): item is LegacyMeal {
  return "calories" in item;
}

function toFoodItem(item: FoodItem | LegacyMeal): FoodItem {
  if (!isLegacyMeal(item)) {
    return item;
  }

  return {
    id: item.id,
    name: item.name,
    mealType: null,
    kcal: item.calories,
    proteinG: item.protein,
    carbG: item.carbs,
    fatG: item.fat,
    eatenAt: item.eatenAt,
  };
}

export async function getFoods(): Promise<FoodItem[]> {
  const foods = await apiGet<Array<FoodItem | LegacyMeal>>(
    dashboardEndpoints.foods,
  );

  return foods.map(toFoodItem);
}

export function createFood(payload: CreateFoodPayload) {
  return apiPost<FoodItem | LegacyMeal, CreateFoodPayload>(
    "/foods",
    payload,
  ).then(toFoodItem);
}

export function updateFood(mealId: string, payload: UpdateFoodPayload) {
  return apiPatch<FoodItem | LegacyMeal, UpdateFoodPayload>(
    dashboardEndpoints.food(mealId),
    payload,
  ).then(toFoodItem);
}

export function deleteFood(mealId: string) {
  return apiDelete(dashboardEndpoints.food(mealId));
}

export function getMenulists() {
  return apiGet<MenulistItem[]>(dashboardEndpoints.foodLists);
}

export function createMenulist(payload: CreateMenulistPayload) {
  return apiPost<MenulistItem, CreateMenulistPayload>(
    "/food-lists",
    payload,
  );
}

export function updateMenulist(
  mealId: string,
  payload: UpdateMenulistPayload,
) {
  return apiPatch<MenulistItem, UpdateMenulistPayload>(
    dashboardEndpoints.foodList(mealId),
    payload,
  );
}

export function deleteMenulist(mealId: string) {
  return apiDelete(dashboardEndpoints.foodList(mealId));
}
