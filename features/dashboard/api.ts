import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";

import type {
  CreateFoodPayload,
  CreateMenulistPayload,
  FoodItem,
  MenulistItem,
  UpdateMenulistPayload,
} from "./types";

const dashboardEndpoints = {
  foods: (userId: string) => `/api/meals?userId=${encodeURIComponent(userId)}`,
  menulists: (userId: string) =>
    `/api/menulists?userId=${encodeURIComponent(userId)}`,
  menulist: (mealId: string) => `/api/menulists/${encodeURIComponent(mealId)}`,
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

export async function getFoods(userId: string): Promise<FoodItem[]> {
  const foods = await apiGet<Array<FoodItem | LegacyMeal>>(
    dashboardEndpoints.foods(userId),
  );

  return foods.map(toFoodItem);
}

export function createFood(payload: CreateFoodPayload) {
  return apiPost<FoodItem | LegacyMeal, CreateFoodPayload>(
    "/api/meals",
    payload,
  ).then(toFoodItem);
}

export function getMenulists(userId: string) {
  return apiGet<MenulistItem[]>(dashboardEndpoints.menulists(userId));
}

export function createMenulist(payload: CreateMenulistPayload) {
  return apiPost<MenulistItem, CreateMenulistPayload>(
    "/api/menulists",
    payload,
  );
}

export function updateMenulist(
  mealId: string,
  payload: UpdateMenulistPayload,
) {
  return apiPut<MenulistItem, UpdateMenulistPayload>(
    dashboardEndpoints.menulist(mealId),
    payload,
  );
}

export function deleteMenulist(mealId: string) {
  return apiDelete(dashboardEndpoints.menulist(mealId));
}
