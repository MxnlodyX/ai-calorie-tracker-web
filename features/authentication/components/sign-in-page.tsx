"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { startGoogleSignIn } from "@/features/authentication/api";
import { useGetMeQuery } from "@/store/api";

function getResponseStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = error.status;
    return typeof status === "number" ? status : undefined;
  }

  return undefined;
}

export function SignInPage() {
  const router = useRouter();
  const { data: user, error, isLoading, isFetching } = useGetMeQuery();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const handleGoogleOAuthSignIn = () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    startGoogleSignIn();
  };

  if (isLoading || isFetching || user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7fbf3] px-5 text-[#172019]">
        <p className="text-sm font-black" role="status">
          Checking your session...
        </p>
      </main>
    );
  }

  const sessionError =
    error && getResponseStatus(error) !== 401
      ? "We could not check your session. You can still try signing in with Google."
      : null;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7fbf3] px-5 py-8 text-[#172019]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.94),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(165,223,127,0.52),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(255,185,91,0.34),transparent_30%),linear-gradient(135deg,#fbfff7_0%,#edf8e7_48%,#d7f0c6_100%)]" />
      <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(90deg,rgba(89,132,72,0.08)_1px,transparent_1px),linear-gradient(rgba(89,132,72,0.08)_1px,transparent_1px)] [background-size:58px_58px]" />

      <section className="relative z-10 w-full max-w-[430px] overflow-hidden rounded-[30px] bg-white/78 shadow-[0_30px_80px_rgba(56,103,43,0.2)] ring-1 ring-white/80 backdrop-blur-xl">
        <NutritionIllustration className="h-72 w-full" />

        <div className="rounded-t-[30px] bg-white/88 px-5 pb-8 pt-6 shadow-[0_-18px_44px_rgba(255,255,255,0.72)] sm:px-7">
          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#65b741] to-[#22945f] text-white shadow-[0_16px_34px_rgba(34,148,95,0.28)]">
              <SparkIcon />
            </div>
            <p className="mt-5 text-2xl font-black tracking-normal text-[#235b30]">
              AI Calories Track
            </p>
            <h1 className="mt-7 text-3xl font-bold tracking-normal text-[#172019]">
              Welcome Back
            </h1>
            <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-[#536052]">
              Continue with Google to scan meals, track calories, and keep your nutrition insights in sync.
            </p>
          </div>

          <button
            aria-label="Continue with Google"
            className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 text-sm font-bold text-[#253025] shadow-[0_14px_30px_rgba(56,103,43,0.12)] ring-1 ring-[#e1edd8] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(56,103,43,0.18)] focus:outline-none focus:ring-2 focus:ring-[#65b741] focus:ring-offset-2"
            type="button"
            disabled={isSigningIn}
            onClick={handleGoogleOAuthSignIn}
          >
            <GoogleIcon />
            {isSigningIn ? "Connecting..." : "Continue with Google"}
          </button>
          {(errorMessage ?? sessionError) && (
            <p className="mt-4 text-center text-sm text-red-600">
              {errorMessage ?? sessionError}
            </p>
          )}
          <p className="mx-auto mt-6 max-w-[300px] text-center text-xs leading-5 text-[#687566]">
            Your account is created or restored automatically using your Google profile.
          </p>
        </div>
      </section>
    </main>
  );
}

function NutritionIllustration({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 420 280"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="url(#mealBg)" height="280" width="420" />
      <path d="M-18 224C44 174 91 169 142 202C203 242 262 224 313 166C350 124 386 112 438 135" stroke="#F8C85F" strokeOpacity=".85" strokeWidth="28" />
      <path d="M-12 242C59 190 112 194 164 225C223 260 280 232 323 181C355 143 384 127 430 132" stroke="#65B741" strokeOpacity=".86" strokeWidth="16" />
      <circle cx="80" cy="67" fill="#FFF4C7" opacity=".9" r="36" />
      <circle cx="333" cy="62" fill="#D7F7C3" opacity=".7" r="42" />
      <path d="M70 165C70 105 122 64 210 64C298 64 350 105 350 165C350 219 300 242 210 242C120 242 70 219 70 165Z" fill="#FFFFFF" opacity=".88" />
      <path d="M94 166C94 118 137 86 210 86C283 86 326 118 326 166C326 207 284 224 210 224C136 224 94 207 94 166Z" fill="#E8F7DF" />
      <path d="M128 172C140 134 172 114 214 117C247 120 280 142 292 172C268 194 232 204 194 200C164 197 141 188 128 172Z" fill="#79C84B" />
      <path d="M157 157C171 138 197 132 221 142C236 148 250 160 257 177C233 190 204 191 178 181C167 177 160 169 157 157Z" fill="#2E9F65" />
      <circle cx="243" cy="150" fill="#FF6F61" r="19" />
      <circle cx="243" cy="150" fill="#FFE9A8" r="9" />
      <circle cx="177" cy="144" fill="#F29D38" r="16" />
      <circle cx="177" cy="144" fill="#FFF0B7" r="7" />
      <path d="M206 116C211 99 225 88 244 87C241 104 230 116 206 116Z" fill="#65B741" />
      <path d="M203 117C194 101 178 94 160 98C168 113 181 121 203 117Z" fill="#9BD85D" />
      <rect fill="#276C45" height="58" rx="8" transform="rotate(-24 282 74)" width="18" x="282" y="74" />
      <rect fill="#276C45" height="84" rx="8" transform="rotate(24 118 58)" width="18" x="118" y="58" />
      <path d="M290 42C310 52 316 70 306 94C288 82 281 65 290 42Z" fill="#C9F087" />
      <path d="M116 40C94 50 88 70 98 96C118 82 126 65 116 40Z" fill="#C9F087" />
      <rect fill="#FFFFFF" height="50" opacity=".85" rx="16" width="80" x="270" y="156" />
      <path d="M286 187L297 172L309 182L326 164" stroke="#22945F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
      <circle cx="74" cy="211" fill="#F8C85F" r="6" />
      <circle cx="352" cy="216" fill="#FF8F57" r="5" />
      <circle cx="52" cy="110" fill="#65B741" r="5" />
      <defs>
        <linearGradient gradientUnits="userSpaceOnUse" id="mealBg" x1="0" x2="420" y1="0" y2="280">
          <stop stopColor="#235B30" />
          <stop offset=".5" stopColor="#22945F" />
          <stop offset="1" stopColor="#95D85A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" className="size-9" fill="none" viewBox="0 0 48 48">
      <path d="M24 6 28.7 19.3 42 24l-13.3 4.7L24 42l-4.7-13.3L6 24l13.3-4.7L24 6Z" fill="currentColor" opacity=".95" />
      <path d="M36 6 38 12 44 14 38 16 36 22 34 16 28 14 34 12 36 6Z" fill="#FFE79B" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-7 shrink-0" viewBox="0 0 48 48">
      <path d="M44.5 24.4c0-1.5-.1-2.7-.4-4H24v7.7h11.8a10 10 0 0 1-4.4 6.6v5.1h7.1c4.1-3.8 6-9.4 6-15.4Z" fill="#4285F4" />
      <path d="M24 45c5.9 0 10.8-1.9 14.5-5.2l-7.1-5.1A13.1 13.1 0 0 1 4.5 30.8H-2v5.3A21 21 0 0 0 24 45Z" fill="#34A853" />
      <path d="M10.9 27.5a13 13 0 0 1 0-7l-7.2-5.5A21 21 0 0 0 3.7 36l7.2-5.5Z" fill="#FBBC05" />
      <path d="M24 10.2c3.2 0 5.4 1.4 6.7 2.6l6.1-6A21 21 0 0 0 3.7 15l7.2 5.5A12.6 12.6 0 0 1 24 10.2Z" fill="#EA4335" />
    </svg>
  );
}
