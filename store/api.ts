import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
type ProfileResponse = UserProfile | ApiEnvelope<UserProfile>;

function unwrapResponse(response: ProfileResponse): UserProfile {
  return "data" in response ? response.data : response;
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
  tagTypes: ["Me", "Profile"],
  endpoints: (builder) => ({
    getMe: builder.query<UserProfile, void>({
      query: () => "/authentications/me",
      transformResponse: unwrapResponse,
      providesTags: ["Me"],
      keepUnusedDataFor: 300,
    }),
    getProfile: builder.query<UserProfile, void>({
      query: () => "/users/profile",
      transformResponse: unwrapResponse,
      providesTags: ["Profile"],
      keepUnusedDataFor: 300,
    }),
    updateProfile: builder.mutation<UserProfile, UpdateProfileInput>({
      query: (body) => ({
        url: "/users/profile",
        method: "PUT",
        body,
      }),
      transformResponse: unwrapResponse,
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
  }),
});

export const {
  useGetMeQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = api;
