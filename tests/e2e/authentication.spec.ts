import { expect, test } from "@playwright/test";

import { fulfillJson, mockAuthenticatedBackend } from "./helpers";

test("redirects an authenticated user from sign-in to dashboard", async ({ page }) => {
  await mockAuthenticatedBackend(page);

  await page.goto("/");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Hi, Test" })).toBeVisible();
});

test("shows sign-in when the session is unauthorized", async ({ page }) => {
  await page.route("**/authentications/me", (route) =>
    fulfillJson(route, { error: "Unauthorized" }, 401),
  );

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("keeps sign-in usable while the session check is slow", async ({ page }) => {
  await page.route("**/authentications/me", () => {
    // Keep the free-tier backend wake-up path pending.
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByText("Checking existing session in the background...")).toBeVisible();
});
