import { Loader2, Sparkles } from "lucide-react";

import { cn } from "../../lib/utils";

type LoaderSize = "sm" | "md" | "lg" | "xl";

type LoaderVariant = "spinner" | "dots" | "pulse" | "brand" | "page";

type LoaderProps = {
  size?: LoaderSize;
  variant?: LoaderVariant;
  label?: string;
  description?: string;
  fullScreen?: boolean;
  className?: string;
};

const sizeClasses: Record<LoaderSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const labelSizeClasses: Record<LoaderSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export function Loader({
  size = "md",
  variant = "spinner",
  label,
  description,
  fullScreen = false,
  className,
}: LoaderProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        fullScreen && "min-h-screen",
        className,
      )}
    >
      {variant === "spinner" && <SpinnerLoader size={size} />}

      {variant === "dots" && <DotsLoader size={size} />}

      {variant === "pulse" && <PulseLoader size={size} />}

      {variant === "brand" && <BrandLoader size={size} />}

      {variant === "page" && <PageLoader />}

      {label && (
        <p
          className={cn(
            "mt-4 font-black text-slate-950 dark:text-white",
            labelSizeClasses[size],
          )}
        >
          {label}
        </p>
      )}

      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );

  return content;
}

function SpinnerLoader({ size = "md" }: { size?: LoaderSize }) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-violet-600 dark:text-violet-300",
        sizeClasses[size],
      )}
    />
  );
}

function DotsLoader({ size = "md" }: { size?: LoaderSize }) {
  const dotSize =
    size === "sm"
      ? "h-1.5 w-1.5"
      : size === "md"
        ? "h-2 w-2"
        : size === "lg"
          ? "h-3 w-3"
          : "h-4 w-4";

  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            "rounded-full bg-gradient-to-r from-violet-600 to-cyan-400",
            dotSize,
          )}
          style={{
            animation: "quickai-dot-bounce 900ms ease-in-out infinite",
            animationDelay: `${index * 120}ms`,
          }}
        />
      ))}
    </div>
  );
}

function PulseLoader({ size = "md" }: { size?: LoaderSize }) {
  const boxSize =
    size === "sm"
      ? "h-8 w-8"
      : size === "md"
        ? "h-12 w-12"
        : size === "lg"
          ? "h-16 w-16"
          : "h-20 w-20";

  return (
    <div className={cn("relative grid place-items-center", boxSize)}>
      <span className="absolute inset-0 rounded-3xl bg-violet-500/20 animate-ping" />
      <span className="absolute inset-1 rounded-3xl bg-cyan-400/20 animate-pulse" />
      <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-xl shadow-violet-500/25">
        <Sparkles className="h-5 w-5" />
      </span>
    </div>
  );
}

function BrandLoader({ size = "md" }: { size?: LoaderSize }) {
  const logoSize =
    size === "sm"
      ? "h-10 w-10"
      : size === "md"
        ? "h-14 w-14"
        : size === "lg"
          ? "h-18 w-18"
          : "h-24 w-24";

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-full bg-violet-500/20 blur-2xl" />

      <div
        className={cn(
          "relative grid place-items-center rounded-[1.5rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-2xl shadow-violet-500/25",
          logoSize,
        )}
      >
        <Sparkles
          className={cn(
            "animate-pulse",
            size === "sm"
              ? "h-4 w-4"
              : size === "md"
                ? "h-6 w-6"
                : size === "lg"
                  ? "h-8 w-8"
                  : "h-10 w-10",
          )}
        />
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 dark:bg-[#050816]">
      <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-[-8rem] right-[-8rem] h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative rounded-[2rem] border border-slate-200 bg-white/75 p-8 text-center shadow-2xl shadow-slate-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
        <BrandLoader size="lg" />

        <p className="mt-6 text-xl font-black text-slate-950 dark:text-white">
          Loading QuickAI
        </p>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Preparing your AI workspace...
        </p>

        <div className="mt-6 flex justify-center">
          <DotsLoader size="md" />
        </div>
      </div>
    </div>
  );
}

type LoadingOverlayProps = {
  visible: boolean;
  label?: string;
  description?: string;
  className?: string;
};

export function LoadingOverlay({
  visible,
  label = "Working on it...",
  description,
  className,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-30 grid place-items-center rounded-[inherit] bg-white/70 backdrop-blur-md dark:bg-slate-950/70",
        className,
      )}
    >
      <Loader
        variant="brand"
        size="md"
        label={label}
        description={description}
      />
    </div>
  );
}

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10",
        className,
      )}
    />
  );
}

type SkeletonCardProps = {
  className?: string;
};

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-3 h-3 w-1/3" />
        </div>
      </div>

      <Skeleton className="mt-6 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-5/6" />
      <Skeleton className="mt-3 h-4 w-2/3" />

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}

type ProgressBarProps = {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
};

export function ProgressBar({
  value,
  label,
  showValue = true,
  className,
}: ProgressBarProps) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-4 text-sm font-bold">
          {label && (
            <span className="text-slate-700 dark:text-slate-300">{label}</span>
          )}

          {showValue && (
            <span className="text-slate-500 dark:text-slate-400">
              {safeValue}%
            </span>
          )}
        </div>
      )}

      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 transition-all duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}