export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Additional";

export type DashboardMeal = {
  id: string;
  name: string;
  mealType: MealType;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  color: string;
};

export type FoodItem = {
  id: string;
  userId?: string;
  name: string;
  mealType: string | null;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  eatenAt: string;
};

export type CreateFoodPayload = {
  userId: string;
  name: string;
  mealType: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  eatenAt: string;
};

export type UpdateFoodPayload = Partial<Omit<CreateFoodPayload, "userId">>;

export type MenulistItem = {
  id: string;
  userId?: string;
  name: string;
  mealType: string | null;
  description?: string | null;
  kcal: number;
  proteinG?: number | null;
  carbG?: number | null;
  fatG?: number | null;
};

export type CreateMenulistPayload = Omit<MenulistItem, "id"> & {
  userId: string;
};

export type UpdateMenulistPayload = Partial<
  Omit<CreateMenulistPayload, "userId">
>;
