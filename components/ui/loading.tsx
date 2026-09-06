import { LoaderCircle } from "lucide-react";

type LoadingVisualProps = {
  size?: "sm" | "md" | "lg";
};

type AppLoadingShellProps = {
  title: string;
  message: string;
};

type InlineLoadingCardProps = {
  title: string;
  message: string;
  className?: string;
};

type LoadingStatusPillProps = {
  message: string;
};

const visualSizes = {
  sm: "size-14",
  md: "size-20",
  lg: "size-24",
};

export function LoadingVisual({ size = "md" }: LoadingVisualProps) {
  return (
    <span
      className={`app-loading-plate relative grid ${visualSizes[size]} place-items-center rounded-full bg-white shadow-[0_18px_42px_rgba(56,103,43,0.16)] ring-1 ring-[#dce9d4]`}
      aria-hidden="true"
    >
      <span className="absolute inset-1.5 rounded-full border border-[#e1edd8]" />
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#65b741] border-r-[#f6d65b]" />
      <span className="relative grid size-[58%] place-items-center rounded-full bg-[#e8f7df]">
        <span className="absolute left-[18%] top-[22%] size-[28%] rounded-full bg-[#f6d65b]" />
        <span className="absolute right-[19%] top-[24%] size-[24%] rounded-full bg-[#ff9b72]" />
        <span className="absolute bottom-[18%] left-[30%] h-[30%] w-[44%] rounded-full bg-[#65b741]" />
      </span>
    </span>
  );
}

export function AppLoadingShell({ title, message }: AppLoadingShellProps) {
  return (
    <main className="app-page grid min-h-screen place-items-center px-5 text-[#172019]">
      <section
        className="w-full max-w-sm text-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex justify-center">
          <LoadingVisual size="lg" />
        </div>
        <h1 className="mt-6 text-2xl font-bold leading-tight">{title}</h1>
        <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-[#687566]">
          {message}
        </p>
        <LoadingBars />
      </section>
    </main>
  );
}

export function InlineLoadingCard({
  title,
  message,
  className = "",
}: InlineLoadingCardProps) {
  return (
    <div
      className={`app-card overflow-hidden rounded-2xl p-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <LoadingVisual size="sm" />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-black text-[#20342d]">{title}</p>
          <p className="mt-1 text-xs font-bold text-[#65746d]">{message}</p>
        </div>
      </div>
      <LoadingBars compact />
    </div>
  );
}

export function LoadingStatusPill({ message }: LoadingStatusPillProps) {
  return (
    <p
      className="w-full mx-auto mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 text-center text-xs font-bold text-[#687566]"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="size-4 animate-spin text-[#22945f]" aria-hidden="true" />
      {message}
    </p>
  );
}

function LoadingBars({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`mx-auto grid ${compact ? "mt-4 max-w-full" : "mt-6 max-w-[16rem]"} gap-2`}
      aria-hidden="true"
    >
      <span className="app-loading-bar h-2 rounded-full bg-[#dce9d4]" />
      <span className="app-loading-bar h-2 w-4/5 rounded-full bg-[#e1edd8]" />
      <span className="app-loading-bar h-2 w-3/5 rounded-full bg-[#edf4e9]" />
    </div>
  );
}
