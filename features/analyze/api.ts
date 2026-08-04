import { apiFetch } from "@/lib/api-client";

import type {
  AcceptAnalysisResponse,
  AnalysisActionResponse,
  AnalyzeImageResponse,
  ConfirmAnalysisInput,
  FoodAnalysis,
  UploadImageResponse,
} from "./types";

type ApiErrorResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export class AnalyzeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AnalyzeApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | T
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const error = payload as ApiErrorResponse | null;
    const message = Array.isArray(error?.message)
      ? error.message.join(", ")
      : error?.message ?? error?.error ?? "Request failed";

    throw new AnalyzeApiError(message, response.status);
  }

  return payload as T;
}

export async function uploadFoodImage(
  image: File,
): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("image", image);

  return parseResponse<UploadImageResponse>(
    await apiFetch("/upload/food-image", {
      method: "POST",
      body: formData,
    }),
  );
}

export async function analyzeFoodImage(
  foodImageId: string,
  mealType?: string,
  eatenAt?: string,
): Promise<AnalyzeImageResponse> {
  return parseResponse<AnalyzeImageResponse>(
    await apiFetch("/analyze/food-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodImageId, mealType, eatenAt }),
    }),
  );
}

export async function analyzeSelectedImage(
  file: File,
  mealType?: string,
  eatenAt?: string,
): Promise<FoodAnalysis> {
  const uploaded = await uploadFoodImage(file);
  const analyzed = await analyzeFoodImage(uploaded.data.id, mealType, eatenAt);

  return analyzed.data.analysis;
}

export async function acceptAnalysis(
  analysisId: string,
  values: ConfirmAnalysisInput,
): Promise<AcceptAnalysisResponse> {
  return parseResponse<AcceptAnalysisResponse>(
    await apiFetch(`/analyze/${encodeURIComponent(analysisId)}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    }),
  );
}

export async function retryAnalysis(
  analysisId: string,
): Promise<AnalysisActionResponse> {
  return parseResponse<AnalysisActionResponse>(
    await apiFetch(`/analyze/${encodeURIComponent(analysisId)}/retry`, {
      method: "POST",
    }),
  );
}

export async function rejectAnalysis(
  analysisId: string,
): Promise<AnalysisActionResponse> {
  return parseResponse<AnalysisActionResponse>(
    await apiFetch(`/analyze/${encodeURIComponent(analysisId)}/reject`, {
      method: "POST",
    }),
  );
}
