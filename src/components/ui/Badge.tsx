import {
  Crown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock3,
  LockKeyhole,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "../../lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "premium"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | "dark"
  | "outline";

type BadgeSize = "sm" | "md" | "lg";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200",

  primary:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-200",

  premium:
    "border-amber-400/25 bg-gradient-to-r from-amber-400/15 via-orange-500/15 to-fuchsia-500/15 text-amber-700 dark:text-amber-200",

  success:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",

  warning:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",

  danger:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",

  info:
    "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",

  muted:
    "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400",

  dark:
    "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950",

  outline:
    "border-slate-300 bg-transparent text-slate-700 dark:border-white/15 dark:text-slate-200",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2.5 py-1 text-[0.68rem]",
  md: "px-3 py-1.5 text-xs",
  lg: "px-4 py-2 text-sm",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-500",
  primary: "bg-violet-500",
  premium: "bg-amber-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-cyan-500",
  muted: "bg-slate-400",
  dark: "bg-white dark:bg-slate-950",
  outline: "bg-slate-500",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  icon,
  dot = false,
  pulse = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-black tracking-tight",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                dotClasses[variant],
              )}
            />
          )}

          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              dotClasses[variant],
            )}
          />
        </span>
      )}

      {icon && <span className="shrink-0">{icon}</span>}

      {children}
    </span>
  );
}

type StatusBadgeProps = {
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "active"
    | "inactive"
    | "locked"
    | "premium"
    | "free";
  className?: string;
};

const statusConfig: Record<
  StatusBadgeProps["status"],
  {
    label: string;
    variant: BadgeVariant;
    icon: LucideIcon;
    pulse?: boolean;
  }
> = {
  pending: {
    label: "Pending",
    variant: "warning",
    icon: Clock3,
    pulse: true,
  },
  processing: {
    label: "Processing",
    variant: "info",
    icon: Zap,
    pulse: true,
  },
  completed: {
    label: "Completed",
    variant: "success",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    variant: "danger",
    icon: XCircle,
  },
  active: {
    label: "Active",
    variant: "success",
    icon: CheckCircle2,
  },
  inactive: {
    label: "Inactive",
    variant: "muted",
    icon: Clock3,
  },
  locked: {
    label: "Locked",
    variant: "warning",
    icon: LockKeyhole,
  },
  premium: {
    label: "Premium",
    variant: "premium",
    icon: Crown,
  },
  free: {
    label: "Free",
    variant: "primary",
    icon: Sparkles,
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      icon={<Icon className="h-3.5 w-3.5" />}
      pulse={config.pulse}
      dot={Boolean(config.pulse)}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

type PlanBadgeProps = {
  plan?: "free" | "premium";
  className?: string;
};

export function PlanBadge({ plan = "free", className }: PlanBadgeProps) {
  if (plan === "premium") {
    return (
      <Badge
        variant="premium"
        icon={<Crown className="h-3.5 w-3.5" />}
        className={className}
      >
        Premium
      </Badge>
    );
  }

  return (
    <Badge
      variant="primary"
      icon={<Sparkles className="h-3.5 w-3.5" />}
      className={className}
    >
      Free
    </Badge>
  );
}

type PremiumBadgeProps = {
  className?: string;
};

export function PremiumBadge({ className }: PremiumBadgeProps) {
  return (
    <Badge
      variant="premium"
      icon={<Crown className="h-3.5 w-3.5" />}
      className={className}
    >
      Premium
    </Badge>
  );
}

type BetaBadgeProps = {
  className?: string;
};

export function BetaBadge({ className }: BetaBadgeProps) {
  return (
    <Badge
      variant="info"
      icon={<Sparkles className="h-3.5 w-3.5" />}
      className={className}
    >
      Beta
    </Badge>
  );
}

type CountBadgeProps = {
  count: number;
  max?: number;
  className?: string;
};

export function CountBadge({ count, max, className }: CountBadgeProps) {
  const isMaxed = typeof max === "number" && count >= max;

  return (
    <Badge
      variant={isMaxed ? "danger" : "muted"}
      size="sm"
      className={className}
    >
      {typeof max === "number" ? `${count}/${max}` : count}
    </Badge>
  );
}

type ToolBadgeProps = {
  label: string;
  premium?: boolean;
  className?: string;
};

export function ToolBadge({ label, premium = false, className }: ToolBadgeProps) {
  return (
    <Badge
      variant={premium ? "premium" : "primary"}
      icon={
        premium ? (
          <Crown className="h-3.5 w-3.5" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )
      }
      className={className}
    >
      {label}
    </Badge>
  );
}

type AlertBadgeProps = {
  type?: "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
};

export function AlertBadge({
  type = "info",
  children,
  className,
}: AlertBadgeProps) {
  const Icon =
    type === "success"
      ? CheckCircle2
      : type === "warning"
        ? AlertTriangle
        : type === "danger"
          ? XCircle
          : Sparkles;

  return (
    <Badge
      variant={type}
      icon={<Icon className="h-3.5 w-3.5" />}
      className={className}
    >
      {children}
    </Badge>
  );
}