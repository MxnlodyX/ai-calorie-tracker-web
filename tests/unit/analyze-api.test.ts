import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AnalyzeApiError,
  acceptAnalysis,
  analyzeSelectedImage,
  retryAnalysis,
} from "@/features/analyze/api";

describe("analysis API", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("uploads an image before starting analysis", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "uploaded",
            data: {
              id: "image-1",
              storagePath: "food/image.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 3,
              bucket: "food",
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "analyzed",
            data: {
              analysis: {
                id: "analysis-1",
                foodName: "Rice",
                kcal: 320,
                proteinG: 8,
                carbG: 65,
                fatG: 3,
                confidence: 0.91,
                status: "awaiting_confirmation",
              },
              image: { id: "image-1", storagePath: "food/image.jpg" },
            },
          }),
          { status: 200 },
        ),
      );

    const result = await analyzeSelectedImage(
      new File(["img"], "meal.jpg", { type: "image/jpeg" }),
      "lunch",
      "2026-08-05T12:00:00.000Z",
    );

    expect(result.id).toBe("analysis-1");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBeInstanceOf(FormData);
    expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(
      JSON.stringify({
        foodImageId: "image-1",
        mealType: "lunch",
        eatenAt: "2026-08-05T12:00:00.000Z",
      }),
    );
  });

  it("sends edited values when accepting an analysis", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "accepted", data: {} }), {
        status: 200,
      }),
    );

    await acceptAnalysis("analysis/1", {
      foodName: "Edited meal",
      calories: 420,
      saveToFoodList: true,
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/analyze\/analysis%2F1\/accept$/),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns typed errors for failed actions", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: ["Analysis is already accepted"] }), {
        status: 409,
      }),
    );

    await expect(retryAnalysis("analysis-1")).rejects.toEqual(
      expect.objectContaining<Partial<AnalyzeApiError>>({
        name: "AnalyzeApiError",
        status: 409,
        message: "Analysis is already accepted",
      }),
    );
  });
});
