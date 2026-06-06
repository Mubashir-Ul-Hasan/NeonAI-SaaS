import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Crown,
  Gauge,
  LockKeyhole,
  Sparkles,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  FREE_PLAN_LIMIT,
  PREMIUM_PLAN_LIMIT,
  THEME_GRADIENTS,
} from "../../lib/constants";
import { ROUTES } from "../../lib/routes";
import {
  cn,
  formatNumber,
  getToolDescription,
  getToolGradient,
  getToolLabel,
  getUsagePercentage,
  isPremiumTool,
  type ToolType,
  type UserPlan,
} from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export type UsageMap = Record<ToolType, number>;

type UsageMeterProps = {
  plan?: UserPlan;
  usage?: Partial<UsageMap>;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

const DEFAULT_USAGE: UsageMap = {
  article: 8,
  "blog-title": 12,
  image: 0,
  "background-removal": 0,
  "object-removal": 0,
  "resume-review": 0,
};

const TOOL_ORDER: ToolType[] = [
  "article",
  "blog-title",
  "image",
  "background-removal",
  "object-removal",
  "resume-review",
];

const toolIcons: Record<ToolType, LucideIcon> = {
  article: Sparkles,
  "blog-title": BarChart3,
  image: Zap,
  "background-removal": Gauge,
  "object-removal": LockKeyhole,
  "resume-review": TrendingUp,
};

export function UsageMeter({
  plan = "free",
  usage = DEFAULT_USAGE,
  title = "Usage Meter",
  description = "Track monthly usage for each AI tool.",
  compact = false,
  className,
}: UsageMeterProps) {
  const limits = plan === "premium" ? PREMIUM_PLAN_LIMIT : FREE_PLAN_LIMIT;
  const normalizedUsage = getNormalizedUsage(usage);

  const totalUsed = TOOL_ORDER.reduce(
    (total, toolType) => total + normalizedUsage[toolType],
    0,
  );

  const totalLimit = TOOL_ORDER.reduce(
    (total, toolType) => total + limits[toolType],
    0,
  );

  const totalPercentage = getUsagePercentage(totalUsed, totalLimit);
  const isPremium = plan === "premium";

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        isPremium && "border-amber-400/25",
        className,
      )}
      padding={compact ? "md" : "lg"}
    >
      <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge
              variant={isPremium ? "premium" : "primary"}
              icon={
                isPremium ? (
                  <Crown className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )
              }
            >
              {isPremium ? "Premium usage" : "Free usage"}
            </Badge>

            <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>

          <div
            className={cn(
              "grid h-14 w-14 shrink-0 place-items-center rounded-3xl text-white shadow-xl",
              isPremium
                ? "bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 shadow-amber-500/20"
                : "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 shadow-violet-500/20",
            )}
          >
            <Gauge size={25} />
          </div>
        </div>

        <TotalUsageBar
          used={totalUsed}
          limit={totalLimit}
          percentage={totalPercentage}
          plan={plan}
        />

        <div className={cn("mt-6 grid gap-3", compact ? "md:grid-cols-1" : "")}>
          {TOOL_ORDER.map((toolType) => (
            <ToolUsageRow
              key={toolType}
              toolType={toolType}
              used={normalizedUsage[toolType]}
              limit={limits[toolType]}
              plan={plan}
              compact={compact}
            />
          ))}
        </div>

        {!isPremium && (
          <div className="mt-6 rounded-[1.5rem] border border-amber-400/25 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-200">
                  <Crown size={14} />
                  Premium unlock
                </div>

                <p className="mt-3 text-sm font-black">
                  Need image tools and higher limits?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Upgrade to unlock image generation, background removal, object
                  removal, resume review, and more credits.
                </p>
              </div>

              <Link to={ROUTES.billing}>
                <Button
                  variant="premium"
                  size="sm"
                  rightIcon={<ArrowRight size={16} />}
                  className="w-full sm:w-auto"
                >
                  Upgrade
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function TotalUsageBar({
  used,
  limit,
  percentage,
  plan,
}: {
  used: number;
  limit: number;
  percentage: number;
  plan: UserPlan;
}) {
  const isPremium = plan === "premium";

  return (
    <div
      className={cn(
        "mt-6 rounded-[1.5rem] border p-5",
        isPremium
          ? "border-amber-400/20 bg-amber-400/10"
          : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            Total monthly usage
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatNumber(used)} used out of {formatNumber(limit)} credits
          </p>
        </div>

        <p
          className={cn(
            "rounded-full px-3 py-1 text-xs font-black",
            percentage >= 85
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
              : "bg-violet-500/10 text-violet-600 dark:text-violet-300",
          )}
        >
          {percentage}%
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            isPremium
            ? "from-amber-400 via-orange-500 to-fuchsia-600"
            : THEME_GRADIENTS.primary,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ToolUsageRow({
  toolType,
  used,
  limit,
  plan,
  compact,
  className,
}: {
  toolType: ToolType;
  used: number;
  limit: number;
  plan: UserPlan;
  compact?: boolean;
  className?: string;
}) {
  const Icon = toolIcons[toolType];
  const percentage = getUsagePercentage(used, limit);
  const locked = limit <= 0;
  const premiumOnly = isPremiumTool(toolType);
  const needsUpgrade = premiumOnly && plan !== "premium";
  const highUsage = percentage >= 80;

  return (
        <div
         className={cn(
        "rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5",
        locked
        ? "border-amber-400/20 bg-amber-400/10"
        : highUsage
            ? "border-rose-400/20 bg-rose-400/10"
            : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]",
        className,
    )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            getToolGradient(toolType),
          )}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-slate-950 dark:text-white">
                {getToolLabel(toolType)}
              </p>

              {!compact && (
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {getToolDescription(toolType)}
                </p>
              )}
            </div>

            {needsUpgrade ? (
              <Badge
                variant="warning"
                icon={<LockKeyhole className="h-3.5 w-3.5" />}
              >
                Locked
              </Badge>
            ) : premiumOnly ? (
              <Badge
                variant="premium"
                icon={<Crown className="h-3.5 w-3.5" />}
              >
                Premium
              </Badge>
            ) : (
              <Badge
                variant="success"
                icon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Free
              </Badge>
            )}
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs font-black">
              <span className="text-slate-500 dark:text-slate-400">
                {locked
                  ? "Not available on current plan"
                  : `${formatNumber(used)} / ${formatNumber(limit)} used`}
              </span>

              {!locked && (
                <span
                  className={cn(
                    highUsage
                      ? "text-rose-600 dark:text-rose-300"
                      : "text-violet-600 dark:text-violet-300",
                  )}
                >
                  {percentage}%
                </span>
              )}
            </div>

            {locked ? (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <LockKeyhole size={14} />
                Upgrade required
              </div>
            ) : (
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                    highUsage
                      ? "from-rose-500 to-orange-500"
                      : getToolGradient(toolType),
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiniUsageMeter({
  label = "Monthly credits",
  used = 0,
  limit = 100,
  className,
}: {
  label?: string;
  used?: number;
  limit?: number;
  className?: string;
}) {
  const percentage = getUsagePercentage(used, limit);
  const isHigh = percentage >= 80;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-black">
        <span className="text-slate-950 dark:text-white">{label}</span>
        <span
          className={cn(
            isHigh
              ? "text-rose-600 dark:text-rose-300"
              : "text-violet-600 dark:text-violet-300",
          )}
        >
          {percentage}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            isHigh
              ? "from-rose-500 to-orange-500"
              : "from-violet-600 via-fuchsia-600 to-cyan-500",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {formatNumber(used)} of {formatNumber(limit)} credits used
      </p>
    </div>
  );
}

export function ToolUsageMeter({
  toolType,
  plan = "free",
  used = 0,
  className,
}: {
  toolType: ToolType;
  plan?: UserPlan;
  used?: number;
  className?: string;
}) {
  const limits = plan === "premium" ? PREMIUM_PLAN_LIMIT : FREE_PLAN_LIMIT;

  return (
    <ToolUsageRow
      toolType={toolType}
      used={used}
      limit={limits[toolType]}
      plan={plan}
      className={className}
    />
  );
}

function getNormalizedUsage(usage: Partial<UsageMap>): UsageMap {
  return {
    article: usage.article ?? 0,
    "blog-title": usage["blog-title"] ?? 0,
    image: usage.image ?? 0,
    "background-removal": usage["background-removal"] ?? 0,
    "object-removal": usage["object-removal"] ?? 0,
    "resume-review": usage["resume-review"] ?? 0,
  };
}