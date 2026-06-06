import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { cn, formatNumber } from "../../lib/utils";

export type StatTrend = "up" | "down" | "neutral";

export type AdminStatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: StatTrend;
  trendValue?: string;
  trendLabel?: string;
  gradient?: string;
  badge?: string;
  compact?: boolean;
  className?: string;
};

export function AdminStatCard({
  title,
  value,
  description,
  icon: Icon,
  trend = "neutral",
  trendValue = "0%",
  trendLabel = "vs last month",
  gradient = "from-violet-600 via-fuchsia-600 to-cyan-500",
  badge,
  compact = false,
  className,
}: AdminStatCardProps) {
  return (
    <Card
      hover
      padding={compact ? "md" : "lg"}
      className={cn("relative overflow-hidden", className)}
    >
      <div className="pointer-events-none absolute right-[-5rem] top-[-5rem] h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            {badge && (
              <Badge
                variant="muted"
                size="sm"
                icon={<Sparkles className="h-3 w-3" />}
              >
                {badge}
              </Badge>
            )}

            <p
              className={cn(
                "font-bold text-slate-500 dark:text-slate-400",
                badge ? "mt-4 text-sm" : "text-sm",
              )}
            >
              {title}
            </p>

            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {typeof value === "number" ? formatNumber(value) : value}
            </p>

            {description && (
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>

          <div
            className={cn(
              "grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-xl",
              gradient,
            )}
          >
            <Icon size={23} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <TrendBadge trend={trend} value={trendValue} />

          <p className="text-xs font-bold text-slate-400">{trendLabel}</p>
        </div>

        <MiniSparkline trend={trend} />
      </div>
    </Card>
  );
}

export function TrendBadge({
  trend,
  value,
}: {
  trend: StatTrend;
  value: string;
}) {
  const Icon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black",
        trend === "up" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        trend === "down" &&
          "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        trend === "neutral" &&
          "bg-slate-500/10 text-slate-600 dark:text-slate-300",
      )}
    >
      <Icon size={14} />
      {value}
    </div>
  );
}

export function MiniSparkline({ trend = "neutral" }: { trend?: StatTrend }) {
  const heights =
    trend === "up"
      ? [30, 38, 34, 52, 48, 66, 74, 90]
      : trend === "down"
        ? [88, 76, 82, 64, 58, 42, 38, 26]
        : [48, 54, 46, 58, 52, 60, 55, 62];

  return (
    <div className="mt-5 flex h-16 items-end gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      {heights.map((height, index) => (
        <div
          key={index}
          className={cn(
            "flex-1 rounded-t-full bg-gradient-to-t",
            trend === "up" && "from-emerald-500 to-cyan-400",
            trend === "down" && "from-rose-500 to-orange-400",
            trend === "neutral" && "from-violet-600 to-cyan-400",
          )}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

export type AdminStatsGridProps = {
  stats: AdminStatCardProps[];
  className?: string;
};

export function AdminStatsGrid({ stats, className }: AdminStatsGridProps) {
  return (
    <section
      className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-4", className)}
    >
      {stats.map((stat) => (
        <AdminStatCard key={stat.title} {...stat} />
      ))}
    </section>
  );
}

export function AdminSectionHeader({
  eyebrow = "Admin Analytics",
  title,
  description,
  icon: Icon = TrendingUp,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 dark:border-white/10",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-red-500/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge
            variant="premium"
            icon={<Sparkles className="h-3.5 w-3.5" />}
          >
            {eyebrow}
          </Badge>

          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>

          {description && (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {description}
            </p>
          )}
        </div>

        <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-white/10 text-cyan-200 shadow-xl">
          <Icon size={34} />
        </div>
      </div>
    </div>
  );
}