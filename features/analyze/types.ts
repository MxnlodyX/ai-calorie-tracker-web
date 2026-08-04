export type AnalysisStatus =
  | "pending"
  | "awaiting_confirmation"
  | "accepted"
  | "rejected"
  | "failed";

export type UploadedFoodImage = {
  id: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
};

export type FoodAnalysis = {
  id: string;
  foodImageId?: string | null;
  foodName: string;
  kcal: number;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  confidence: number | null;
  status: AnalysisStatus;
};

export type UploadImageResponse = {
  message: string;
  data: UploadedFoodImage;
};

export type AnalyzeImageResponse = {
  message: string;
  data: {
    analysis: FoodAnalysis;
    image: Pick<UploadedFoodImage, "id" | "storagePath">;
  };
};

export type ConfirmAnalysisInput = {
  foodName: string;
  calories: number;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  mealType?: string;
  eatenAt?: string;
  saveToFoodList?: boolean;
};

export type AcceptedFoodEntry = {
  id: string;
  userId: string;
  name: string;
  kcal: number;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  imageUrl: string | null;
  mealType: string | null;
  eatenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AcceptAnalysisResponse = {
  message: string;
  data: {
    foodEntry: AcceptedFoodEntry;
    foodListItem: unknown | null;
    analysis: FoodAnalysis;
  };
};

export type AnalysisActionResponse = {
  message: string;
  data: FoodAnalysis;
};
