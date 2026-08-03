import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type {
  CreateFoodPayload,
  FoodItem,
  UpdateFoodPayload,
} from "@/features/dashboard/types";

export type DietMode = "lose" | "maintain" | "gain";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dietMode: DietMode | null;
  kcalGoal: number | null;
  proteinGoal: number | null;
  fatGoal: number | null;
  carbGoal: number | null;
};

export type UpdateProfileInput = Pick<
  UserProfile,
  | "name"
  | "heightCm"
  | "weightKg"
  | "dietMode"
  | "kcalGoal"
  | "proteinGoal"
  | "fatGoal"
  | "carbGoal"
>;

type ApiEnvelope<T> = { data: T };

type MealHistoryQuery = {
  month: number;
  year: number;
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

type UpdateFoodMutation = {
  id: string;
  date?: string;
  payload: UpdateFoodPayload;
};

type DeleteFoodMutation = {
  id: string;
  date: string;
};

function unwrapResponse<T>(response: T | ApiEnvelope<T>): T {
  return response && typeof response === "object" && "data" in response
    ? response.data
    : response;
}

function getMealHistoryTagIdFromDate(value: string | undefined) {
  if (!value) {
    return "LIST";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "LIST";
  }

  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function getFoodDateTagIdFromDate(value: string | undefined) {
  if (!value) {
    return "LIST";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "LIST";
  }

  return formatLocalDate(date);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

function unwrapFoodItems(response: Array<FoodItem | LegacyMeal> | ApiEnvelope<Array<FoodItem | LegacyMeal>>) {
  return unwrapResponse(response).map(toFoodItem);
}

function unwrapFoodItem(response: FoodItem | LegacyMeal | ApiEnvelope<FoodItem | LegacyMeal>) {
  return toFoodItem(unwrapResponse(response));
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
    prepareHeaders: (headers) => {
      headers.set("accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Me", "Profile", "MealHistory", "FoodsByDate"],
  endpoints: (builder) => ({
    getMe: builder.query<UserProfile, void>({
      query: () => "/authentications/me",
      transformResponse: unwrapResponse<UserProfile>,
      providesTags: ["Me"],
      keepUnusedDataFor: 300,
    }),
    getProfile: builder.query<UserProfile, void>({
      query: () => "/users/profile",
      transformResponse: unwrapResponse<UserProfile>,
      providesTags: ["Profile"],
      keepUnusedDataFor: 300,
    }),
    updateProfile: builder.mutation<UserProfile, UpdateProfileInput>({
      query: (body) => ({
        url: "/users/profile",
        method: "PUT",
        body,
      }),
      transformResponse: unwrapResponse<UserProfile>,
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            api.util.updateQueryData("getMe", undefined, () => data),
          );
          dispatch(
            api.util.updateQueryData("getProfile", undefined, () => data),
          );
        } catch {
          // Failed mutations leave the current cached profile untouched.
        }
      },
      invalidatesTags: (result) => (result ? ["Me", "Profile"] : []),
    }),
    getMealCalendarHistory: builder.query<FoodItem[], MealHistoryQuery>({
      query: ({ month, year }) =>
        `/meal-calendar-history?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`,
      transformResponse: unwrapFoodItems,
      providesTags: (_result, _error, { month, year }) => [
        { type: "MealHistory", id: `${year}-${month}` },
      ],
      keepUnusedDataFor: 300,
    }),
    getFoodsByDate: builder.query<FoodItem[], string>({
      query: (date) => `/foods?date=${encodeURIComponent(date)}`,
      transformResponse: unwrapFoodItems,
      providesTags: (_result, _error, date) => [
        { type: "FoodsByDate", id: date },
      ],
      keepUnusedDataFor: 300,
    }),
    createFood: builder.mutation<FoodItem, CreateFoodPayload>({
      query: (body) => ({
        url: "/foods",
        method: "POST",
        body,
      }),
      transformResponse: unwrapFoodItem,
      invalidatesTags: (_result, _error, body) => [
        {
          type: "MealHistory",
          id: getMealHistoryTagIdFromDate(body.eatenAt),
        },
        {
          type: "FoodsByDate",
          id: getFoodDateTagIdFromDate(body.eatenAt),
        },
      ],
    }),
    updateFood: builder.mutation<FoodItem, UpdateFoodMutation>({
      query: ({ id, payload }) => ({
        url: `/foods/${encodeURIComponent(id)}`,
        method: "PATCH",
        body: payload,
      }),
      transformResponse: unwrapFoodItem,
      invalidatesTags: (_result, _error, { date, payload }) => [
        {
          type: "MealHistory",
          id: getMealHistoryTagIdFromDate(payload.eatenAt ?? date),
        },
        {
          type: "FoodsByDate",
          id: getFoodDateTagIdFromDate(payload.eatenAt ?? date),
        },
      ],
    }),
    deleteFood: builder.mutation<void, DeleteFoodMutation>({
      query: ({ id }) => ({
        url: `/foods/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { date }) => [
        {
          type: "MealHistory",
          id: getMealHistoryTagIdFromDate(date),
        },
        {
          type: "FoodsByDate",
          id: getFoodDateTagIdFromDate(date),
        },
      ],
    }),
  }),
});

export const {
  useCreateFoodMutation,
  useDeleteFoodMutation,
  useGetFoodsByDateQuery,
  useGetMeQuery,
  useGetMealCalendarHistoryQuery,
  useGetProfileQuery,
  useUpdateFoodMutation,
  useUpdateProfileMutation,
} = api;
