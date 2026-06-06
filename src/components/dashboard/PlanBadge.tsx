import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Gem,
  LockKeyhole,
  Sparkles,
  Zap,
} from "lucide-react";

import { ROUTES } from "../../lib/routes";
import {
  FREE_PLAN_LIMIT,
  PLAN_DESCRIPTIONS,
  PLAN_NAMES,
  PREMIUM_PLAN_LIMIT,
  PRICING_PLANS,
} from "../../lib/constants";
import {
  cn,
  formatNumber,
  getPlanLabel,
  getToolLabel,
  getUsagePercentage,
  isPremiumTool,
  type ToolType,
  type UserPlan,
} from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/Loader";

type DashboardPlanBadgeProps = {
  plan?: UserPlan;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
};

export function DashboardPlanBadge({
  plan = "free",
  size = "md",
  showIcon = true,
  className,
}: DashboardPlanBadgeProps) {
  const isPremium = plan === "premium";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border font-black tracking-tight",
        isPremium
          ? "border-amber-400/30 bg-gradient-to-r from-amber-400/15 via-orange-500/15 to-fuchsia-500/15 text-amber-700 dark:text-amber-200"
          : "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-200",
        size === "sm" && "px-2.5 py-1 text-[0.68rem]",
        size === "md" && "px-3 py-1.5 text-xs",
        size === "lg" && "px-4 py-2 text-sm",
        className,
      )}
    >
      {showIcon &&
        (isPremium ? (
          <Crown className="h-3.5 w-3.5" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        ))}

      {getPlanLabel(plan)}
    </span>
  );
}

type PlanSummaryCardProps = {
  plan?: UserPlan;
  totalUsed?: number;
  totalLimit?: number;
  className?: string;
};

export function PlanSummaryCard({
  plan = "free",
  totalUsed = 0,
  totalLimit,
  className,
}: PlanSummaryCardProps) {
  const isPremium = plan === "premium";
  const currentPlan = PRICING_PLANS.find((item) => item.id === plan);
  const usageLimit =
    totalLimit ??
    Object.values(isPremium ? PREMIUM_PLAN_LIMIT : FREE_PLAN_LIMIT).reduce(
      (total, value) => total + value,
      0,
    );

  const usagePercentage = getUsagePercentage(totalUsed, usageLimit);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border p-6 shadow-xl",
        isPremium
          ? "border-amber-400/25 bg-slate-950 text-white shadow-violet-500/15"
          : "border-slate-200 bg-white text-slate-950 shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
        className,
      )}
    >
      {isPremium ? (
        <>
          <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        </>
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <DashboardPlanBadge plan={plan} />

            <h3 className="mt-4 text-2xl font-black tracking-tight">
              {PLAN_NAMES[plan]} Plan
            </h3>

            <p
              className={cn(
                "mt-2 text-sm leading-6",
                isPremium
                  ? "text-slate-300"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {PLAN_DESCRIPTIONS[plan]}
            </p>
          </div>

          <div
            className={cn(
              "grid h-14 w-14 shrink-0 place-items-center rounded-3xl",
              isPremium
                ? "bg-white/10 text-amber-300"
                : "bg-violet-500/10 text-violet-600 dark:text-violet-300",
            )}
          >
            {isPremium ? <Crown size={25} /> : <Zap size={25} />}
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar
            value={usagePercentage}
            label="Monthly usage"
            className={cn(isPremium && "[&_*]:text-white")}
          />

          <div
            className={cn(
              "mt-3 flex items-center justify-between text-xs font-bold",
              isPremium
                ? "text-slate-300"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            <span>{formatNumber(totalUsed)} used</span>
            <span>{formatNumber(usageLimit)} limit</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {isPremium ? (
            <Link to={ROUTES.billing} className="w-full">
              <Button
                variant="secondary"
                fullWidth
                rightIcon={<ArrowRight size={17} />}
                className="border-white/10 bg-white/10 text-white hover:bg-white/15"
              >
                Manage Billing
              </Button>
            </Link>
          ) : (
            <Link to={ROUTES.billing} className="w-full">
              <Button
                variant="premium"
                fullWidth
                rightIcon={<ArrowRight size={17} />}
              >
                Upgrade Plan
              </Button>
            </Link>
          )}

          <div
            className={cn(
              "flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-black",
              isPremium
                ? "border-white/10 bg-white/10 text-slate-200"
                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
            )}
          >
            {currentPlan?.price ?? "$0"}/month
          </div>
        </div>
      </div>
    </section>
  );
}

type PlanFeatureListProps = {
  plan?: UserPlan;
  compact?: boolean;
  className?: string;
};

export function PlanFeatureList({
  plan = "free",
  compact = false,
  className,
}: PlanFeatureListProps) {
  const isPremium = plan === "premium";

  const features = isPremium
    ? [
        "Article generator",
        "Blog title generator",
        "AI image generator",
        "Background remover",
        "Object remover",
        "Resume reviewer",
        "Higher monthly limits",
        "Full creation history",
      ]
    : [
        "Article generator",
        "Blog title generator",
        "Limited monthly usage",
        "Basic history access",
      ];

  return (
    <div className={cn("grid gap-3", className)}>
      {features.map((feature) => (
        <div
          key={feature}
          className={cn(
            "flex items-center gap-3 rounded-2xl border",
            compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
            isPremium
              ? "border-amber-400/20 bg-amber-400/10 text-amber-700 dark:text-amber-300"
              : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
          )}
        >
          <BadgeCheck
            className={cn(
              "shrink-0",
              compact ? "h-4 w-4" : "h-5 w-5",
              isPremium ? "text-amber-500" : "text-emerald-500",
            )}
          />
          <span className="font-bold">{feature}</span>
        </div>
      ))}
    </div>
  );
}

type ToolAccessBadgeProps = {
  toolType: ToolType;
  plan?: UserPlan;
  className?: string;
};

export function ToolAccessBadge({
  toolType,
  plan = "free",
  className,
}: ToolAccessBadgeProps) {
  const premiumOnly = isPremiumTool(toolType);
  const locked = premiumOnly && plan !== "premium";

  if (locked) {
    return (
      <Badge
        variant="warning"
        icon={<LockKeyhole className="h-3.5 w-3.5" />}
        className={className}
      >
        Premium Locked
      </Badge>
    );
  }

  if (premiumOnly) {
    return (
      <Badge
        variant="premium"
        icon={<Crown className="h-3.5 w-3.5" />}
        className={className}
      >
        Premium Access
      </Badge>
    );
  }

  return (
    <Badge
      variant="success"
      icon={<Sparkles className="h-3.5 w-3.5" />}
      className={className}
    >
      Free Access
    </Badge>
  );
}

type UsageLimitBadgeProps = {
  toolType: ToolType;
  plan?: UserPlan;
  used?: number;
  className?: string;
};

export function UsageLimitBadge({
  toolType,
  plan = "free",
  used = 0,
  className,
}: UsageLimitBadgeProps) {
  const limits = plan === "premium" ? PREMIUM_PLAN_LIMIT : FREE_PLAN_LIMIT;
  const limit = limits[toolType];
  const percentage = getUsagePercentage(used, limit);
  const isLocked = limit <= 0;
  const isHighUsage = percentage >= 80;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        isLocked
          ? "border-amber-400/20 bg-amber-400/10"
          : isHighUsage
            ? "border-rose-400/20 bg-rose-400/10"
            : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {getToolLabel(toolType)}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isLocked
              ? "Locked on current plan"
              : `${formatNumber(used)} / ${formatNumber(limit)} used`}
          </p>
        </div>

        <ToolAccessBadge toolType={toolType} plan={plan} />
      </div>

      {!isLocked && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isHighUsage
                ? "bg-gradient-to-r from-rose-500 to-orange-500"
                : "bg-gradient-to-r from-violet-600 to-cyan-400",
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

type UpgradeStripProps = {
  plan?: UserPlan;
  className?: string;
};

export function UpgradeStrip({ plan = "free", className }: UpgradeStripProps) {
  if (plan === "premium") {
    return (
      <div
        className={cn(
          "flex flex-col gap-4 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-600 dark:text-emerald-300">
            <Gem size={20} />
          </div>

          <div>
            <p className="font-black text-slate-950 dark:text-white">
              Premium is active
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You have full access to all tools and premium limits.
            </p>
          </div>
        </div>

        <Link to={ROUTES.billing}>
          <Button variant="secondary" rightIcon={<ArrowRight size={17} />}>
            Manage
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-amber-400/25 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/10",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
            <Crown size={20} />
          </div>

          <div>
            <p className="font-black">Upgrade to unlock the full AI suite</p>
            <p className="mt-1 text-sm text-slate-300">
              Image generation, background removal, object removal, resume
              review, and higher limits.
            </p>
          </div>
        </div>

        <Link to={ROUTES.billing}>
          <Button
            variant="premium"
            rightIcon={<ArrowRight size={17} />}
            className="w-full sm:w-auto"
          >
            Upgrade
          </Button>
        </Link>
      </div>
    </div>
  );
}