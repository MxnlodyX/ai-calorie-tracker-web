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

import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { useAlert } from "@/components/ui/alert-provider";
import { createMenulist } from "@/features/dashboard/api";
import { useGetMeQuery } from "@/store/api";

type FlowStep = "camera" | "processing" | "result";

type NutritionResult = {
  name: string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Additional";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const initialResult: NutritionResult = {
  name: "Grilled chicken power bowl",
  mealType: "Lunch",
  calories: 528,
  protein: 42,
  carbs: 48,
  fat: 19,
};

const analysisStages = [
  "Finding foods on your plate",
  "Estimating portion sizes",
  "Calculating nutrition",
];

const nutrients = [
  { key: "protein", label: "Protein", unit: "g", color: "bg-[#dbe8a7]" },
  { key: "carbs", label: "Carbs", unit: "g", color: "bg-[#ffdf5d]" },
  { key: "fat", label: "Fat", unit: "g", color: "bg-[#ffc8aa]" },
] as const;

export function AnalyzeMeal() {
  const [step, setStep] = useState<FlowStep>("camera");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [result, setResult] = useState<NutritionResult>(initialResult);
  const [saveToMealList, setSaveToMealList] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { showAlert } = useAlert();
  const { data: user } = useGetMeQuery();
  const router = useRouter();

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  useEffect(() => {
    if (step !== "processing") return;

    const stageTimer = window.setInterval(() => {
      setAnalysisStage((current) => Math.min(current + 1, 2));
    }, 650);
    const resultTimer = window.setTimeout(() => {
      window.clearInterval(stageTimer);
      setStep("result");
    }, 2300);

    return () => {
      window.clearInterval(stageTimer);
      window.clearTimeout(resultTimer);
    };
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

  const beginAnalysis = (url?: string) => {
    stopCamera();
    if (url) setPhotoUrl(url);
    setAnalysisStage(0);
    setStep("processing");
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    beginAnalysis(canvas.toDataURL("image/jpeg", 0.88));
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    beginAnalysis(URL.createObjectURL(file));
    event.target.value = "";
  };

  const reset = () => {
    stopCamera();
    if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setResult(initialResult);
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
    if (saveToMealList && !user?.id) {
      showAlert({
        type: "info",
        title: "Sign in to save this meal",
        message: "Turn off “Save to meal list” to continue without saving.",
      });
      return;
    }

    setIsAccepting(true);
    try {
      if (saveToMealList && user?.id) {
        await createMenulist({
          userId: user.id,
          name: result.name,
          mealType: result.mealType,
          description: "AI estimate from a meal photo",
          kcal: result.calories,
          proteinG: result.protein,
          carbG: result.carbs,
          fatG: result.fat,
        });
      }
      router.push("/dashboard");
    } catch {
      showAlert({
        type: "error",
        title: "Meal not saved",
        message: "Please check your connection and try again.",
      });
      setIsAccepting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff7df] px-4 pb-28 pt-4 text-[#20342d] sm:px-6 sm:pt-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-white shadow-[0_3px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="text-center">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-[#b6532d]">
              AI meal scanner
            </p>
            <h1 className="mt-0.5 text-lg font-black sm:text-xl">Snap & track</h1>
          </div>
          <span className="grid size-11 place-items-center rounded-full border-2 border-[#20342d] bg-[#dbe8a7]">
            <Leaf className="size-5" aria-hidden="true" />
          </span>
        </header>

        <ol className="mx-auto mt-5 flex max-w-sm items-center" aria-label="Analysis progress">
          {["Photo", "Analyze", "Review"].map((label, index) => {
            const currentIndex = step === "camera" ? 0 : step === "processing" ? 1 : 2;
            const complete = index < currentIndex;
            const current = index === currentIndex;
            return (
              <li key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`grid size-7 place-items-center rounded-full border-2 border-[#20342d] text-[0.65rem] font-black ${
                      complete ? "bg-[#20342d] text-white" : current ? "bg-[#ffdf5d]" : "bg-white text-[#7c8883]"
                    }`}
                  >
                    {complete ? <Check className="size-4" /> : index + 1}
                  </span>
                  <span className="text-[0.62rem] font-black uppercase tracking-wider">{label}</span>
                </div>
                {index < 2 ? <span className={`mx-2 mb-5 h-0.5 flex-1 ${complete ? "bg-[#20342d]" : "bg-[#c9c8bf]"}`} /> : null}
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
            onDemo={() => beginAnalysis()}
          />
        ) : null}

        {step === "processing" ? (
          <ProcessingStep photoUrl={photoUrl} analysisStage={analysisStage} />
        ) : null}

        {step === "result" ? (
          <ResultStep
            photoUrl={photoUrl}
            result={result}
            saveToMealList={saveToMealList}
            isAccepting={isAccepting}
            onResultChange={setResult}
            onNumberChange={updateNumber}
            onSavePreferenceChange={() => setSaveToMealList((current) => !current)}
            onAccept={acceptResponse}
            onReject={reset}
            onRetry={() => {
              setAnalysisStage(0);
              setStep("processing");
            }}
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
  onDemo: () => void;
};

function CameraStep({
  cameraActive,
  cameraError,
  videoRef,
  onStartCamera,
  onCapture,
  onFile,
  onDemo,
}: CameraStepProps) {
  return (
    <section className="mx-auto mt-4 max-w-3xl overflow-hidden rounded-[1.75rem] border-2 border-[#20342d] bg-white shadow-[0_8px_0_#20342d]">
      <div className="relative aspect-[4/5] max-h-[32rem] w-full overflow-hidden bg-[#20342d] sm:aspect-[16/10]">
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[#dbe8a7]">
            <div className="absolute -left-16 -top-12 size-52 rounded-full bg-[#ffdf5d]/75" />
            <div className="absolute -bottom-24 -right-14 size-72 rounded-full bg-[#ffc8aa]/80" />
            <div className="relative flex max-w-sm flex-col items-center px-8 text-center">
              <span className="grid size-20 place-items-center rounded-full border-2 border-[#20342d] bg-white shadow-[0_5px_0_#20342d]">
                <Camera className="size-9" aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-3xl font-black leading-tight">Show us your plate</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-[#52635c]">
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
            className="absolute bottom-6 left-1/2 grid size-[4.5rem] -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-[#ffdf5d] shadow-[0_0_0_2px_#20342d] transition active:scale-95"
            aria-label="Take photo"
          >
            <span className="size-10 rounded-full border-2 border-[#20342d]" />
          </button>
        ) : null}
      </div>

      <div className="p-4 sm:p-6">
        {cameraError ? <p className="mb-3 text-center text-xs font-bold text-[#b6532d]">{cameraError}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onStartCamera}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-[#20342d] px-5 text-sm font-black text-white shadow-[0_4px_0_#96ab80] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
          >
            <Camera className="size-5" aria-hidden="true" />
            {cameraActive ? "Camera ready" : "Open camera"}
          </button>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-[#ffdf5d] px-5 text-sm font-black shadow-[0_4px_0_#20342d] transition hover:-translate-y-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#20342d]">
            <ImagePlus className="size-5" aria-hidden="true" />
            Upload photo
            <input type="file" accept="image/*" capture="environment" onChange={onFile} className="sr-only" />
          </label>
        </div>
        <button type="button" onClick={onDemo} className="mx-auto mt-4 block text-xs font-black text-[#66766f] underline decoration-2 underline-offset-4 hover:text-[#20342d]">
          Preview with a sample meal
        </button>
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
    <section className="mx-auto mt-4 max-w-3xl overflow-hidden rounded-[1.75rem] border-2 border-[#20342d] bg-white shadow-[0_8px_0_#20342d]">
      <div className="relative h-72 overflow-hidden sm:h-80">
        <MealVisual photoUrl={photoUrl} className="scale-105 blur-[2px] brightness-75" />
        <div className="absolute inset-0 bg-[#20342d]/20" />
        <div className="absolute inset-x-8 top-1/2 h-0.5 animate-[scan_1.6s_ease-in-out_infinite] bg-[#ffdf5d] shadow-[0_0_18px_4px_rgba(255,223,93,.8)]" />
        <span className="absolute left-6 top-6 rounded-full border-2 border-white bg-[#20342d]/80 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.15em] text-white">
          AI vision active
        </span>
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-[#ffdf5d]">
            <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b6532d]">Analyzing your meal</p>
            <h2 className="mt-1 text-2xl font-black">Reading what’s on your plate…</h2>
          </div>
        </div>
        <div className="mt-6 space-y-3" aria-live="polite">
          {analysisStages.map((stage, index) => (
            <div key={stage} className="flex items-center gap-3">
              <span className={`grid size-6 place-items-center rounded-full border-2 border-[#20342d] ${index <= analysisStage ? "bg-[#dbe8a7]" : "bg-white"}`}>
                {index < analysisStage ? <Check className="size-3.5" /> : index === analysisStage ? <span className="size-2 animate-pulse rounded-full bg-[#20342d]" /> : null}
              </span>
              <span className={`text-sm font-bold ${index <= analysisStage ? "text-[#20342d]" : "text-[#9ca49f]"}`}>{stage}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-xl bg-[#fff7df] px-4 py-3 text-xs font-bold leading-5 text-[#66766f]">
          AI estimates can vary. You’ll be able to review and adjust everything before saving.
        </p>
      </div>
    </section>
  );
}

type ResultStepProps = {
  photoUrl: string | null;
  result: NutritionResult;
  saveToMealList: boolean;
  isAccepting: boolean;
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
  saveToMealList,
  isAccepting,
  onResultChange,
  onNumberChange,
  onSavePreferenceChange,
  onAccept,
  onReject,
  onRetry,
}: ResultStepProps) {
  return (
    <section className="mx-auto mt-4 grid max-w-5xl gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div className="overflow-hidden rounded-[1.75rem] border-2 border-[#20342d] bg-white shadow-[0_8px_0_#20342d]">
        <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[4/5]">
          <MealVisual photoUrl={photoUrl} />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border-2 border-[#20342d] bg-white px-3 py-1.5 text-xs font-black shadow-[0_3px_0_#20342d]">
            <Sparkles className="size-4 text-[#b6532d]" /> 92% match
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-[#dbe8a7]">
              <ScanLine className="size-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b6532d]">Found on plate</p>
              <p className="mt-1 text-sm font-bold leading-5 text-[#52635c]">Grilled chicken, brown rice, avocado, greens and tomato.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border-2 border-[#20342d] bg-white p-5 shadow-[0_8px_0_#20342d] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b6532d]">AI estimate ready</p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">Review your meal</h2>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-[#dbe8a7]">
            <CheckCircle2 className="size-5" />
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_10rem]">
          <label className="block">
            <span className="text-xs font-black text-[#66766f]">Meal name</span>
            <input
              value={result.name}
              onChange={(event) => onResultChange({ ...result, name: event.target.value })}
              className="mt-1.5 min-h-12 w-full rounded-xl border-2 border-[#20342d] bg-[#fffdf7] px-4 text-sm font-black outline-none focus:bg-white focus:ring-2 focus:ring-[#ffdf5d]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black text-[#66766f]">Meal type</span>
            <span className="relative mt-1.5 block">
              <select
                value={result.mealType}
                onChange={(event) => onResultChange({ ...result, mealType: event.target.value as NutritionResult["mealType"] })}
                className="min-h-12 w-full appearance-none rounded-xl border-2 border-[#20342d] bg-[#fffdf7] px-4 pr-9 text-sm font-black outline-none focus:bg-white focus:ring-2 focus:ring-[#ffdf5d]"
              >
                <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Additional</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-2xl border-2 border-[#20342d] bg-[#20342d] p-4 text-white">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#dbe8a7]">Estimated energy</p>
              <div className="mt-1 flex items-baseline gap-2">
                <input
                  type="number"
                  min="0"
                  value={result.calories}
                  onChange={(event) => onNumberChange("calories", event.target.value)}
                  aria-label="Calories"
                  className="w-28 bg-transparent text-4xl font-black outline-none"
                />
                <span className="text-sm font-black text-[#dbe8a7]">kcal</span>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider">1 serving</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {nutrients.map((nutrient) => (
            <label key={nutrient.key} className={`rounded-2xl border-2 border-[#20342d] p-3 ${nutrient.color}`}>
              <span className="block text-[0.65rem] font-black uppercase tracking-wider text-[#52635c]">{nutrient.label}</span>
              <span className="mt-1 flex items-baseline gap-0.5">
                <input
                  type="number"
                  min="0"
                  value={result[nutrient.key]}
                  onChange={(event) => onNumberChange(nutrient.key, event.target.value)}
                  aria-label={nutrient.label}
                  className="min-w-0 w-full bg-transparent text-xl font-black outline-none sm:text-2xl"
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
          className="mt-5 flex w-full items-center gap-3 rounded-2xl border-2 border-[#20342d] bg-[#fff7df] p-3 text-left transition hover:bg-[#fff2c7]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-white">
            <Save className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black">Save to meal list</span>
            <span className="mt-0.5 block text-xs font-bold text-[#66766f]">Keep this meal for quick logging next time.</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full border-2 border-[#20342d] transition-colors ${saveToMealList ? "bg-[#dbe8a7]" : "bg-[#d9d9d2]"}`}>
            <span className={`absolute top-0.5 size-5 rounded-full border-2 border-[#20342d] bg-white transition-transform ${saveToMealList ? "translate-x-[1.15rem]" : "translate-x-0.5"}`} />
          </span>
        </button>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onAccept}
            disabled={isAccepting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-[#dbe8a7] px-5 text-sm font-black shadow-[0_4px_0_#20342d] transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            {isAccepting ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />}
            {isAccepting ? "Saving…" : "Accept response"}
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-white px-5 text-sm font-black shadow-[0_4px_0_#20342d] transition hover:-translate-y-0.5"
          >
            <RefreshCcw className="size-4" /> Retry analysis
          </button>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={onReject}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-[#fff0e8] px-5 text-sm font-black transition hover:bg-[#ffd9c8]"
          >
            <X className="size-5" /> Reject
          </button>
        </div>
        <button type="button" onClick={onReject} className="mx-auto mt-5 flex items-center gap-2 text-xs font-black text-[#66766f] hover:text-[#20342d]">
          <RotateCcw className="size-3.5" /> Take a different photo
        </button>
      </div>
    </section>
  );
}
