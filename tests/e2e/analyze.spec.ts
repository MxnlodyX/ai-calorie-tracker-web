import { expect, test } from "@playwright/test";

import { fulfillJson } from "./helpers";

test("uploads, reviews, and accepts an analyzed meal", async ({ page }) => {
  await page.route("**/upload/food-image", (route) =>
    fulfillJson(route, {
      message: "uploaded",
      data: {
        id: "image-1",
        storagePath: "food/meal.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 3,
        bucket: "food",
      },
    }),
  );
  await page.route("**/analyze/food-image", (route) =>
    fulfillJson(route, {
      message: "analyzed",
      data: {
        analysis: {
          id: "analysis-1",
          foodName: "Chicken rice",
          kcal: 520,
          proteinG: 35,
          carbG: 58,
          fatG: 14,
          confidence: 0.9,
          status: "awaiting_confirmation",
        },
        image: { id: "image-1", storagePath: "food/meal.jpg" },
      },
    }),
  );
  await page.route("**/analyze/analysis-1/accept", (route) =>
    fulfillJson(route, { message: "accepted", data: {} }),
  );

  await page.goto("/analyze");
  await page.locator('input[type="file"]').setInputFiles({
    name: "meal.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("img"),
  });

  await page.getByRole("button", { name: "Analyze meal" }).click();
  await expect(page.getByRole("heading", { name: "Review your meal" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Meal name" })).toHaveValue(
    "Chicken rice",
  );
  await page.getByRole("button", { name: "Accept response" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
