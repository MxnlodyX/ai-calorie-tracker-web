import type { Page, Route } from "@playwright/test";

const corsHeaders = {
  "access-control-allow-origin": "http://localhost:3000",
  "access-control-allow-credentials": "true",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

export async function fulfillJson(
  route: Route,
  json: unknown,
  status = 200,
) {
  if (route.request().method() === "OPTIONS") {
    await route.fulfill({ status: 204, headers: corsHeaders });
    return;
  }

  await route.fulfill({ status, json, headers: corsHeaders });
}

export const profile = {
  id: "user-1",
  email: "tester@example.com",
  name: "Test User",
  image: null,
  heightCm: 170,
  weightKg: 65,
  dietMode: "maintain",
  kcalGoal: 2000,
  proteinGoal: 120,
  fatGoal: 60,
  carbGoal: 220,
};

export async function mockAuthenticatedBackend(page: Page) {
  await page.route("**/authentications/me", (route) =>
    fulfillJson(route, { data: profile }),
  );
  await page.route("**/users/profile", (route) =>
    fulfillJson(route, { data: profile }),
  );
  await page.route("**/foods?date=*", (route) =>
    fulfillJson(route, { data: [] }),
  );
  await page.route("**/food-lists?userId=*", (route) =>
    fulfillJson(route, { data: [] }),
  );
  await page.route("**/meal-calendar-history?*", (route) =>
    fulfillJson(route, { data: [] }),
  );
}
