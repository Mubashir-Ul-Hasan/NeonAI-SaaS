import {
  ArrowRight,
  FileSearch,
  ImageOff,
  Inbox,
  LockKeyhole,
  Plus,
  RefreshCw,
  SearchX,
  Sparkles,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./Button";
import { Badge } from "./Badge";

type EmptyStateVariant =
  | "default"
  | "search"
  | "creations"
  | "image"
  | "premium"
  | "error"
  | "tool"
  | "history";

type EmptyStateSize = "sm" | "md" | "lg";

type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "premium"
    | "danger"
    | "success"
    | "dark";
};

type EmptyStateProps = {
  title?: string;
  description?: string;
  variant?: EmptyStateVariant;
  size?: EmptyStateSize;
  icon?: React.ReactNode;
  badge?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  iconClassName?: string;
};

const variantConfig: Record<
  EmptyStateVariant,
  {
    icon: LucideIcon;
    title: string;
    description: string;
    badge?: string;
    gradient: string;
  }
> = {
  default: {
    icon: Inbox,
    title: "Nothing here yet",
    description: "Once you start using QuickAI, your content will appear here.",
    gradient: "from-violet-600 via-fuchsia-600 to-cyan-500",
  },
  search: {
    icon: SearchX,
    title: "No results found",
    description: "Try changing your search text or clearing your filters.",
    gradient: "from-sky-500 via-cyan-500 to-teal-500",
  },
  creations: {
    icon: Sparkles,
    title: "No creations yet",
    description:
      "Choose an AI tool and generate your first article, image, or review.",
    gradient: "from-violet-600 via-fuchsia-600 to-cyan-500",
  },
  image: {
    icon: ImageOff,
    title: "No image generated yet",
    description:
      "Upload an image or enter a prompt, then generate your visual result.",
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
  },
  premium: {
    icon: LockKeyhole,
    title: "Premium feature locked",
    description:
      "Upgrade your plan to unlock image generation, background removal, object removal, and resume review.",
    badge: "Premium",
    gradient: "from-amber-400 via-orange-500 to-fuchsia-600",
  },
  error: {
    icon: RefreshCw,
    title: "Something went wrong",
    description:
      "The request could not be completed. Please try again in a moment.",
    gradient: "from-rose-500 via-red-500 to-orange-500",
  },
  tool: {
    icon: WandSparkles,
    title: "Ready when you are",
    description:
      "Fill in the input fields and run the tool to generate your result.",
    gradient: "from-blue-500 via-violet-500 to-fuchsia-500",
  },
  history: {
    icon: FileSearch,
    title: "No history available",
    description:
      "Your previous generations will be saved here after backend connection.",
    gradient: "from-slate-700 via-violet-600 to-cyan-500",
  },
};

const sizeClasses: Record<EmptyStateSize, string> = {
  sm: "min-h-52 p-5",
  md: "min-h-72 p-8",
  lg: "min-h-96 p-10",
};

const iconSizeClasses: Record<EmptyStateSize, string> = {
  sm: "h-14 w-14 rounded-2xl",
  md: "h-18 w-18 rounded-3xl",
  lg: "h-22 w-22 rounded-[1.75rem]",
};

const titleSizeClasses: Record<EmptyStateSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

function EmptyStateButton({ action }: { action: EmptyStateAction }) {
  if (action.href) {
    return (
      <a href={action.href} className="inline-flex items-center justify-center">
        <Button
          type="button"
          variant={action.variant ?? "primary"}
          rightIcon={action.icon ?? <ArrowRight size={17} />}
        >
          {action.label}
        </Button>
      </a>
    );
  }

  return (
    <Button
      type="button"
      onClick={action.onClick}
      variant={action.variant ?? "primary"}
      rightIcon={action.icon ?? <ArrowRight size={17} />}
    >
      {action.label}
    </Button>
  );
}

export function EmptyState({
  title,
  description,
  variant = "default",
  size = "md",
  icon,
  badge,
  primaryAction,
  secondaryAction,
  className,
  iconClassName,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const activeBadge = badge ?? config.badge;

  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-[2rem] border border-dashed border-slate-200 bg-white text-center shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]",
        sizeClasses[size],
        className,
      )}
    >
      <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-md">
        {activeBadge && (
          <div className="mb-5 flex justify-center">
            <Badge
              variant={variant === "premium" ? "premium" : "primary"}
              icon={<Sparkles className="h-3.5 w-3.5" />}
            >
              {activeBadge}
            </Badge>
          </div>
        )}

        <div
          className={cn(
            "relative mx-auto grid place-items-center bg-gradient-to-br text-white shadow-2xl",
            config.gradient,
            iconSizeClasses[size],
            iconClassName,
          )}
        >
          <div className="absolute inset-0 rounded-[inherit] bg-white/15" />
          <div className="relative">
            {icon ?? <Icon className={size === "sm" ? "h-6 w-6" : "h-8 w-8"} />}
          </div>
        </div>

        <h3
          className={cn(
            "mt-6 font-black tracking-tight text-slate-950 dark:text-white",
            titleSizeClasses[size],
          )}
        >
          {title ?? config.title}
        </h3>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description ?? config.description}
        </p>

        {(primaryAction || secondaryAction) && (
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {primaryAction && <EmptyStateButton action={primaryAction} />}
            {secondaryAction && <EmptyStateButton action={secondaryAction} />}
          </div>
        )}
      </div>
    </div>
  );
}

export function NoCreationsEmptyState({
  onCreate,
  className,
}: {
  onCreate?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="creations"
      title="Your creative history is empty"
      description="Start with an AI writing tool or premium image tool. Every generated result will be saved here."
      primaryAction={
        onCreate
          ? {
              label: "Create Something",
              onClick: onCreate,
              icon: <Plus size={17} />,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function SearchEmptyState({
  search,
  onClear,
  className,
}: {
  search?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="search"
      title="No matching results"
      description={
        search
          ? `No results matched "${search}". Try a different keyword.`
          : "No results matched your current filters."
      }
      primaryAction={
        onClear
          ? {
              label: "Clear Search",
              onClick: onClear,
              variant: "secondary",
              icon: <RefreshCw size={17} />,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function PremiumEmptyState({
  onUpgrade,
  className,
}: {
  onUpgrade?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="premium"
      title="Unlock this premium tool"
      description="Upgrade to Premium to access AI image generation, background removal, object removal, resume review, higher limits, and full history."
      primaryAction={{
        label: "Upgrade to Premium",
        onClick: onUpgrade,
        variant: "premium",
        icon: <ArrowRight size={17} />,
      }}
      className={className}
    />
  );
}

export function ErrorEmptyState({
  title = "Unable to load data",
  description = "Please refresh or try again. If the problem continues, check your API connection.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="error"
      title={title}
      description={description}
      primaryAction={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
              variant: "danger",
              icon: <RefreshCw size={17} />,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function ToolResultEmptyState({
  title = "No result generated yet",
  description = "Complete the form and click generate. Your AI output will appear here.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <EmptyState
      variant="tool"
      title={title}
      description={description}
      size="lg"
      className={className}
    />
  );
}

export function ImageResultEmptyState({
  className,
}: {
  className?: string;
}) {
  return (
    <EmptyState
      variant="image"
      title="Your image result will appear here"
      description="After generation or image processing, the final image will be displayed in this preview area."
      size="lg"
      className={className}
    />
  );
}

export function HistoryEmptyState({
  className,
}: {
  className?: string;
}) {
  return (
    <EmptyState
      variant="history"
      title="No previous generations"
      description="Once you generate something with this tool, your past results will be listed here."
      size="sm"
      className={className}
    />
  );
}