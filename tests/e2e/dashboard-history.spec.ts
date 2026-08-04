import { expect, test } from "@playwright/test";

import { mockAuthenticatedBackend } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockAuthenticatedBackend(page);
});

test("renders authenticated dashboard data", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Hi, Test" })).toBeVisible();
  await expect(page.getByText("2,000 kcal left for today.")).toBeVisible();
  await expect(page.getByText("No meals yet", { exact: true })).toBeVisible();
});

test("navigates from dashboard to meal history", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /view history/i }).click();

  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByText("Meal diary")).toBeVisible();
  await expect(page.getByText("No meals logged", { exact: true })).toBeVisible();
});
