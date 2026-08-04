"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  Leaf,
  LoaderCircle,
  RefreshCcw,
  RotateCcw,
  Save,
  ScanLine,
  Sparkles,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { useAlert } from "@/components/ui/alert-provider";
import {
  acceptAnalysis,
  AnalyzeApiError,
  analyzeSelectedImage,
  rejectAnalysis,
  retryAnalysis,
} from "@/features/analyze/api";
import type { FoodAnalysis } from "@/features/analyze/types";
import { api } from "@/store/api";
import type { AppDispatch } from "@/store/store";

type FlowStep = "camera" | "processing" | "result";

type NutritionResult = {
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "additional";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const initialResult: NutritionResult = {
  name: "",
  mealType: "lunch",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const analysisStages = [
  "Finding foods on your plate",
  "Estimating portion sizes",
  "Calculating nutrition",
];

const nutrients = [
  { key: "protein", label: "Protein", unit: "g", color: "bg-[#e8f7df]" },
  { key: "carbs", label: "Carbs", unit: "g", color: "bg-[#fff4c7]" },
  { key: "fat", label: "Fat", unit: "g", color: "bg-[#ffead8]" },
] as const;

export function AnalyzeMeal() {
  const [step, setStep] = useState<FlowStep>("camera");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [result, setResult] = useState<NutritionResult>(initialResult);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [eatenAt, setEatenAt] = useState<string | null>(null);
  const [saveToMealList, setSaveToMealList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { showAlert } = useAlert();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  useEffect(
    () => () => {
      if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );

  useEffect(() => {
    if (step !== "processing") return;
    const stageTimer = window.setInterval(
      () => setAnalysisStage((current) => Math.min(current + 1, 2)),
      900,
    );
    return () => window.clearInterval(stageTimer);
  }, [step]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      window.setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setCameraError("Camera access is off. You can upload a photo instead.");
    }
  };

  const showRequestError = (error: unknown, fallback: string) => {
    if (error instanceof AnalyzeApiError && error.status === 401) {
      showAlert({
        type: "info",
        title: "Please sign in again",
        message: "Your session has expired. Redirecting you to sign in.",
      });
      router.replace("/");
      return;
    }

    showAlert({
      type: "error",
      title: fallback,
      message: error instanceof Error ? error.message : "Please try again.",
    });
  };

  const setAnalysisResult = (nextAnalysis: FoodAnalysis) => {
    setAnalysis(nextAnalysis);
    setResult((current) => ({
      ...current,
      name: nextAnalysis.foodName,
      calories: nextAnalysis.kcal,
      protein: nextAnalysis.proteinG ?? 0,
      carbs: nextAnalysis.carbG ?? 0,
      fat: nextAnalysis.fatG ?? 0,
    }));
    setStep("result");
  };

  const beginAnalysis = async (file: File, url: string) => {
    stopCamera();
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      showAlert({
        type: "error",
        title: "Unsupported image",
        message: "Choose a JPEG, PNG, or WebP image.",
      });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      showAlert({
        type: "error",
        title: "Image is too large",
        message: "Choose an image no larger than 5 MB.",
      });
      return;
    }

    setPhotoUrl(url);
    setAnalysisStage(0);
    setStep("processing");
    const selectedEatenAt = new Date().toISOString();
    setEatenAt(selectedEatenAt);

    try {
      const nextAnalysis = await analyzeSelectedImage(
        file,
        result.mealType,
        selectedEatenAt,
      );
      setAnalysisResult(nextAnalysis);
    } catch (error) {
      setStep("camera");
      showRequestError(error, "Could not analyze this meal");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showRequestError(null, "Could not capture this photo");
          return;
        }
        const file = new File([blob], `meal-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        void beginAnalysis(file, URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.88,
    );
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void beginAnalysis(file, URL.createObjectURL(file));
    event.target.value = "";
  };

  const reset = () => {
    stopCamera();
    setPhotoUrl(null);
    setResult(initialResult);
    setAnalysis(null);
    setEatenAt(null);
    setSaveToMealList(false);
    setStep("camera");
  };

  const updateNumber = (
    key: "calories" | "protein" | "carbs" | "fat",
    value: string,
  ) => {
    setResult((current) => ({
      ...current,
      [key]: Math.max(0, Number(value) || 0),
    }));
  };

  const acceptResponse = async () => {
    if (!analysis || !eatenAt) return;
    setIsSubmitting(true);
    try {
      await acceptAnalysis(analysis.id, {
        foodName: result.name,
        calories: result.calories,
        proteinG: result.protein,
        carbsG: result.carbs,
        fatG: result.fat,
        mealType: result.mealType,
        eatenAt,
        saveToFoodList: saveToMealList,
      });
      dispatch(api.util.invalidateTags(["FoodsByDate", "MealHistory"]));
      router.push("/dashboard");
    } catch (error) {
      showRequestError(error, "Meal not saved");
      setIsSubmitting(false);
    }
  };

  const retryResponse = async () => {
    if (!analysis) return;
    setIsSubmitting(true);
    setAnalysisStage(0);
    setStep("processing");
    try {
      const response = await retryAnalysis(analysis.id);
      setAnalysisResult(response.data);
    } catch (error) {
      setStep("result");
      showRequestError(error, "Could not retry analysis");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rejectResponse = async () => {
    if (!analysis) return reset();
    setIsSubmitting(true);
    try {
      await rejectAnalysis(analysis.id);
      reset();
    } catch (error) {
      showRequestError(error, "Could not reject analysis");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app-page min-h-screen px-3.5 pt-3 text-[#172019] sm:px-6 sm:pt-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/85 text-[#235b30] shadow-[0_10px_24px_rgba(56,103,43,0.12)] ring-1 ring-[#e1edd8] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741] sm:size-11"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="text-center">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#22945f]">
              AI meal scanner
            </p>
            <h1 className="mt-0.5 text-lg font-bold sm:text-xl">Snap & track</h1>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] text-white shadow-[0_12px_26px_rgba(34,148,95,0.24)] sm:size-11 sm:rounded-2xl">
            <Leaf className="size-5" aria-hidden="true" />
          </span>
        </header>

        <ol className="mx-auto mt-3 flex max-w-sm items-center sm:mt-5" aria-label="Analysis progress">
          {["Photo", "Analyze", "Review"].map((label, index) => {
            const currentIndex = step === "camera" ? 0 : step === "processing" ? 1 : 2;
            const complete = index < currentIndex;
            const current = index === currentIndex;
            return (
              <li key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`grid size-7 place-items-center rounded-full text-[0.65rem] font-bold ring-1 ring-[#dce9d4] ${
                      complete ? "bg-[#22945f] text-white" : current ? "bg-[#c9f087] text-[#235b30]" : "bg-white/80 text-[#7c8883]"
                    }`}
                  >
                    {complete ? <Check className="size-4" /> : index + 1}
                  </span>
                  <span className="text-[0.62rem] font-black uppercase tracking-wider">{label}</span>
                </div>
                {index < 2 ? <span className={`mx-2 mb-5 h-0.5 flex-1 ${complete ? "bg-[#65b741]" : "bg-[#dce9d4]"}`} /> : null}
              </li>
            );
          })}
        </ol>

        {step === "camera" ? (
          <CameraStep
            cameraActive={cameraActive}
            cameraError={cameraError}
            videoRef={videoRef}
            onStartCamera={startCamera}
            onCapture={capturePhoto}
            onFile={handleFile}
          />
        ) : null}

        {step === "processing" ? (
          <ProcessingStep photoUrl={photoUrl} analysisStage={analysisStage} />
        ) : null}

        {step === "result" ? (
          <ResultStep
            photoUrl={photoUrl}
            result={result}
            confidence={analysis?.confidence ?? null}
            saveToMealList={saveToMealList}
            isSubmitting={isSubmitting}
            onResultChange={setResult}
            onNumberChange={updateNumber}
            onSavePreferenceChange={() => setSaveToMealList((current) => !current)}
            onAccept={acceptResponse}
            onReject={rejectResponse}
            onRetry={retryResponse}
          />
        ) : null}
      </div>
      <BottomNavbar />
    </main>
  );
}

type CameraStepProps = {
  cameraActive: boolean;
  cameraError: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onStartCamera: () => void;
  onCapture: () => void;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
};

function CameraStep({
  cameraActive,
  cameraError,
  videoRef,
  onStartCamera,
  onCapture,
  onFile,
}: CameraStepProps) {
  return (
    <section className="app-panel mx-auto mt-3 max-w-3xl overflow-hidden rounded-[24px] sm:mt-4 sm:rounded-[30px]">
      <div className="relative h-[min(52svh,25rem)] w-full overflow-hidden bg-[#235b30] sm:h-auto sm:max-h-[32rem] sm:aspect-[16/10]">
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center overflow-hidden bg-gradient-to-br from-[#235b30] via-[#22945f] to-[#95d85a] text-white">
            <div className="absolute -left-16 -top-12 size-52 rounded-full bg-[#fff4c7]/25 blur-sm" />
            <div className="absolute -bottom-24 -right-14 size-72 rounded-full bg-[#c9f087]/25 blur-sm" />
            <div className="relative flex max-w-sm flex-col items-center px-8 text-center">
              <span className="grid size-16 place-items-center rounded-[20px] bg-white/15 shadow-[0_18px_36px_rgba(18,73,43,0.2)] ring-1 ring-white/35 backdrop-blur-sm sm:size-20 sm:rounded-[24px]">
                <Camera className="size-9" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-2xl font-bold leading-tight sm:mt-6 sm:text-3xl">Show us your plate</h2>
              <p className="mt-2 text-xs leading-5 text-white/75 sm:mt-3 sm:text-sm sm:leading-6">
                Center the whole meal in good light. We’ll estimate calories and macros for you.
              </p>
            </div>
          </div>
        )}

        <span className="pointer-events-none absolute left-5 top-5 size-12 rounded-tl-2xl border-l-4 border-t-4 border-white" />
        <span className="pointer-events-none absolute right-5 top-5 size-12 rounded-tr-2xl border-r-4 border-t-4 border-white" />
        <span className="pointer-events-none absolute bottom-5 left-5 size-12 rounded-bl-2xl border-b-4 border-l-4 border-white" />
        <span className="pointer-events-none absolute bottom-5 right-5 size-12 rounded-br-2xl border-b-4 border-r-4 border-white" />

        {cameraActive ? (
          <button
            type="button"
            onClick={onCapture}
            className="absolute bottom-6 left-1/2 grid size-[4.5rem] -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-[#c9f087] shadow-[0_14px_30px_rgba(18,73,43,0.28)] transition active:scale-95"
            aria-label="Take photo"
          >
            <span className="size-10 rounded-full ring-2 ring-[#235b30]" />
          </button>
        ) : null}
      </div>

      <div className="p-3 sm:p-6">
        {cameraError ? <p className="mb-3 text-center text-xs font-bold text-[#b6532d]">{cameraError}</p> : null}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onStartCamera}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] px-2 text-xs font-bold text-white shadow-[0_14px_28px_rgba(34,148,95,0.25)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741] sm:gap-2 sm:px-5 sm:text-sm"
          >
            <Camera className="size-5" aria-hidden="true" />
            {cameraActive ? "Camera ready" : "Open camera"}
          </button>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white px-2 text-xs font-bold text-[#253025] shadow-[0_12px_26px_rgba(56,103,43,0.12)] ring-1 ring-[#e1edd8] transition hover:-translate-y-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#65b741] sm:gap-2 sm:px-5 sm:text-sm">
            <ImagePlus className="size-5" aria-hidden="true" />
            Upload photo
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={onFile} className="sr-only" />
          </label>
        </div>
      </div>
    </section>
  );
}

function MealVisual({ photoUrl, className = "" }: { photoUrl: string | null; className?: string }) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt="Meal selected for analysis"
        fill
        unoptimized
        sizes="(max-width: 1024px) 100vw, 45vw"
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`relative size-full overflow-hidden bg-[#ebe3c8] ${className}`} aria-label="Sample chicken power bowl" role="img">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.65)_0_2px,transparent_3px)] [background-size:18px_18px]" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-white bg-[#dbe8a7] shadow-xl">
        <span className="absolute left-[14%] top-[17%] h-[31%] w-[35%] rotate-[-8deg] rounded-[45%] bg-[#b8683c] shadow-[inset_0_-8px_0_rgba(99,48,27,.18)]" />
        <span className="absolute right-[12%] top-[13%] size-[34%] rounded-full bg-[#f5ddb0]" />
        <span className="absolute bottom-[14%] left-[12%] size-[32%] rounded-full bg-[#6c9a50]" />
        <span className="absolute bottom-[13%] right-[12%] h-[32%] w-[35%] rounded-full bg-[#e98e62]" />
        <span className="absolute left-[42%] top-[42%] size-[18%] rounded-full bg-[#ffdf5d]" />
      </div>
    </div>
  );
}

function ProcessingStep({ photoUrl, analysisStage }: { photoUrl: string | null; analysisStage: number }) {
  return (
    <section className="app-panel mx-auto mt-3 max-w-3xl overflow-hidden rounded-[24px] sm:mt-4 sm:rounded-[30px]">
      <div className="relative h-52 overflow-hidden sm:h-80">
        <MealVisual photoUrl={photoUrl} className="scale-105 blur-[2px] brightness-75" />
        <div className="absolute inset-0 bg-[#235b30]/20" />
        <div className="absolute inset-x-8 top-1/2 h-0.5 animate-[scan_1.6s_ease-in-out_infinite] bg-[#ffdf5d] shadow-[0_0_18px_4px_rgba(255,223,93,.8)]" />
        <span className="absolute left-6 top-6 rounded-full bg-[#235b30]/80 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white ring-1 ring-white/40 backdrop-blur-sm">
          AI vision active
        </span>
      </div>
      <div className="p-4 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#65b741] to-[#22945f] text-white shadow-[0_10px_22px_rgba(34,148,95,0.24)]">
            <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#22945f]">Analyzing your meal</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">Reading what’s on your plate…</h2>
          </div>
        </div>
        <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3" aria-live="polite">
          {analysisStages.map((stage, index) => (
            <div key={stage} className="flex items-center gap-3">
              <span className={`grid size-6 place-items-center rounded-full ring-1 ring-[#dce9d4] ${index <= analysisStage ? "bg-[#c9f087]" : "bg-white"}`}>
                {index < analysisStage ? <Check className="size-3.5" /> : index === analysisStage ? <span className="size-2 animate-pulse rounded-full bg-[#22945f]" /> : null}
              </span>
              <span className={`text-sm font-bold ${index <= analysisStage ? "text-[#20342d]" : "text-[#9ca49f]"}`}>{stage}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-xl bg-[#f1f8ec] px-4 py-3 text-xs leading-5 text-[#687566] ring-1 ring-[#e1edd8]">
          AI estimates can vary. You’ll be able to review and adjust everything before saving.
        </p>
      </div>
    </section>
  );
}

type ResultStepProps = {
  photoUrl: string | null;
  result: NutritionResult;
  confidence: number | null;
  saveToMealList: boolean;
  isSubmitting: boolean;
  onResultChange: (result: NutritionResult) => void;
  onNumberChange: (key: "calories" | "protein" | "carbs" | "fat", value: string) => void;
  onSavePreferenceChange: () => void;
  onAccept: () => void;
  onReject: () => void;
  onRetry: () => void;
};

function ResultStep({
  photoUrl,
  result,
  confidence,
  saveToMealList,
  isSubmitting,
  onResultChange,
  onNumberChange,
  onSavePreferenceChange,
  onAccept,
  onReject,
  onRetry,
}: ResultStepProps) {
  return (
    <section className="mx-auto mt-3 grid max-w-5xl gap-3 sm:mt-4 sm:gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div className="app-panel overflow-hidden rounded-[24px] sm:rounded-[30px]">
        <div className="relative aspect-[16/8] overflow-hidden sm:aspect-[4/3] lg:aspect-[4/5]">
          <MealVisual photoUrl={photoUrl} />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#235b30] shadow-[0_10px_22px_rgba(56,103,43,0.15)] ring-1 ring-white backdrop-blur-sm">
            <Sparkles className="size-4 text-[#b6532d]" />
            {confidence === null
              ? "AI estimate"
              : `${Math.round(confidence * 100)}% match`}
          </span>
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f7df] text-[#22945f] sm:size-10">
              <ScanLine className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#22945f]">Found on plate</p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-[#687566] sm:mt-1 sm:text-sm sm:leading-5">
                {result.name || "Food identified from your photo"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="app-panel rounded-[24px] p-4 sm:rounded-[30px] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#22945f]">AI estimate ready</p>
            <h2 className="mt-1 text-xl font-bold sm:text-3xl">Review your meal</h2>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#65b741] to-[#22945f] text-white shadow-[0_10px_22px_rgba(34,148,95,0.22)]">
            <CheckCircle2 className="size-5" />
          </span>
        </div>

        <div className="mt-4 grid gap-2.5 sm:mt-5 sm:grid-cols-[1fr_10rem] sm:gap-3">
          <label className="block">
            <span className="text-xs font-bold text-[#687566]">Meal name</span>
            <input
              value={result.name}
              onChange={(event) => onResultChange({ ...result, name: event.target.value })}
              className="app-field mt-1.5 min-h-12 w-full rounded-xl px-4 text-sm font-bold outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#687566]">Meal type</span>
            <span className="relative mt-1.5 block">
              <select
                value={result.mealType}
                onChange={(event) => onResultChange({ ...result, mealType: event.target.value as NutritionResult["mealType"] })}
                className="app-field min-h-12 w-full appearance-none rounded-xl px-4 pr-9 text-sm font-bold outline-none"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="additional">Additional</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-[22px] bg-gradient-to-br from-[#235b30] via-[#22945f] to-[#65b741] p-4 text-white shadow-[0_16px_34px_rgba(34,148,95,0.2)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#d7f7c3]">Estimated energy</p>
              <div className="mt-1 flex items-baseline gap-2">
                <input
                  type="number"
                  min="0"
                  value={result.calories}
                  onChange={(event) => onNumberChange("calories", event.target.value)}
                  aria-label="Calories"
                  className="w-28 bg-transparent text-4xl font-bold outline-none"
                />
                <span className="text-sm font-bold text-[#d7f7c3]">kcal</span>
              </div>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider ring-1 ring-white/20">1 serving</span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-3 sm:gap-2.5">
          {nutrients.map((nutrient) => (
            <label key={nutrient.key} className={`rounded-xl p-2 ring-1 ring-[#dce9d4] sm:rounded-2xl sm:p-3 ${nutrient.color}`}>
              <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-[#687566]">{nutrient.label}</span>
              <span className="mt-1 flex items-baseline gap-0.5">
                <input
                  type="number"
                  min="0"
                  value={result[nutrient.key]}
                  onChange={(event) => onNumberChange(nutrient.key, event.target.value)}
                  aria-label={nutrient.label}
                  className="min-w-0 w-full bg-transparent text-xl font-bold outline-none sm:text-2xl"
                />
                <span className="text-xs font-black">{nutrient.unit}</span>
              </span>
            </label>
          ))}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={saveToMealList}
          onClick={onSavePreferenceChange}
          className="mt-4 flex w-full items-center gap-2.5 rounded-xl bg-[#f1f8ec] p-2.5 text-left ring-1 ring-[#dce9d4] transition hover:bg-[#e8f5df] sm:mt-5 sm:gap-3 sm:rounded-2xl sm:p-3"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#22945f] shadow-[0_8px_18px_rgba(56,103,43,0.1)]">
            <Save className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Save to meal list</span>
            <span className="mt-0.5 block text-xs text-[#687566]">Keep this meal for quick logging next time.</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${saveToMealList ? "bg-[#65b741]" : "bg-[#cfd9ca]"}`}>
            <span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${saveToMealList ? "translate-x-[1.35rem]" : "translate-x-1"}`} />
          </span>
        </button>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
          <button
            type="button"
            onClick={onAccept}
            disabled={isSubmitting || !result.name.trim()}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] px-2 text-xs font-bold text-white shadow-[0_14px_28px_rgba(34,148,95,0.25)] transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:gap-2 sm:px-5 sm:text-sm"
          >
            {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />}
            {isSubmitting ? "Saving…" : "Accept response"}
          </button>
          <button
            type="button"
            onClick={onRetry}
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-white px-2 text-xs font-bold text-[#253025] shadow-[0_12px_26px_rgba(56,103,43,0.12)] ring-1 ring-[#e1edd8] transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:gap-2 sm:px-5 sm:text-sm"
          >
            <RefreshCcw className="size-4" /> Retry analysis
          </button>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={onReject}
            disabled={isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#fff5ee] px-5 text-sm font-bold text-[#a94f35] ring-1 ring-[#f2d8ca] transition enabled:hover:bg-[#ffeadf] disabled:cursor-wait disabled:opacity-60"
          >
            <X className="size-5" /> Reject
          </button>
        </div>
        <button type="button" onClick={onReject} disabled={isSubmitting} className="mx-auto mt-5 flex items-center gap-2 text-xs font-black text-[#66766f] hover:text-[#20342d] disabled:cursor-wait disabled:opacity-60">
          <RotateCcw className="size-3.5" /> Take a different photo
        </button>
      </div>
    </section>
  );
}
