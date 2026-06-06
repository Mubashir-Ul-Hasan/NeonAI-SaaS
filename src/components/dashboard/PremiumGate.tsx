import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Gem,
  ImageIcon,
  LockKeyhole,
  ShieldCheck,
  WandSparkles,
  Zap,
} from "lucide-react";

import { ROUTES } from "../../lib/routes";
import {
  PREMIUM_REQUIRED_MESSAGE,
  PRICING_PLANS,
} from "../../lib/constants";
import {
  canUseTool,
  cn,
  getToolDescription,
  getToolGradient,
  getToolLabel,
  isPremiumTool,
  type ToolType,
  type UserPlan,
} from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type PremiumGateProps = {
  plan?: UserPlan;
  toolType?: ToolType;
  title?: string;
  description?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPreview?: boolean;
  className?: string;
};

export function PremiumGate({
  plan = "free",
  toolType,
  title,
  description,
  children,
  fallback,
  showPreview = true,
  className,
}: PremiumGateProps) {
  const isLocked = toolType
    ? !canUseTool(toolType, plan)
    : plan !== "premium";

  if (!isLocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {showPreview && (
        <div className="pointer-events-none select-none opacity-40 blur-[1.5px]">
          {children}
        </div>
      )}

      <div
        className={cn(
          showPreview
            ? "absolute inset-0 grid place-items-center rounded-[inherit] bg-white/70 p-5 backdrop-blur-sm dark:bg-slate-950/70"
            : "relative",
        )}
      >
        <PremiumLockedCard
          toolType={toolType}
          title={title}
          description={description}
        />
      </div>
    </div>
  );
}

type PremiumLockedCardProps = {
  toolType?: ToolType;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export function PremiumLockedCard({
  toolType,
  title,
  description,
  compact = false,
  className,
}: PremiumLockedCardProps) {
  const finalTitle =
    title ||
    (toolType
      ? `Unlock ${getToolLabel(toolType)}`
      : "Unlock premium AI tools");

  const finalDescription =
    description ||
    (toolType
      ? `${getToolLabel(toolType)} is a premium feature. Upgrade your plan to access this tool and save generated results.`
      : PREMIUM_REQUIRED_MESSAGE);

  return (
    <Card
      variant="premium"
      padding={compact ? "md" : "xl"}
      className={cn(
        "mx-auto w-full max-w-xl text-center",
        compact && "max-w-md",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative">
        <div
          className={cn(
            "mx-auto grid place-items-center rounded-[1.75rem] bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 text-white shadow-2xl shadow-amber-500/20",
            compact ? "h-16 w-16" : "h-20 w-20",
          )}
        >
          <LockKeyhole size={compact ? 26 : 34} />
        </div>

        <Badge
          variant="premium"
          icon={<Crown className="h-3.5 w-3.5" />}
          className="mt-6"
        >
          Premium Feature
        </Badge>

        <h3
          className={cn(
            "mt-5 font-black tracking-tight text-white",
            compact ? "text-2xl" : "text-3xl",
          )}
        >
          {finalTitle}
        </h3>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-300">
          {finalDescription}
        </p>

        {toolType && (
          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 text-left">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white",
                  getToolGradient(toolType),
                )}
              >
                <WandSparkles size={19} />
              </div>

              <div>
                <p className="text-sm font-black text-white">
                  {getToolLabel(toolType)}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  {getToolDescription(toolType)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={ROUTES.billing}>
            <Button
              variant="premium"
              size={compact ? "md" : "lg"}
              rightIcon={<ArrowRight size={18} />}
              className="w-full sm:w-auto"
            >
              Upgrade Now
            </Button>
          </Link>

          <Link to={ROUTES.dashboard}>
            <Button
              variant="secondary"
              size={compact ? "md" : "lg"}
              className="w-full border-white/10 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

type PremiumToolBannerProps = {
  plan?: UserPlan;
  toolType?: ToolType;
  className?: string;
};

export function PremiumToolBanner({
  plan = "free",
  toolType,
  className,
}: PremiumToolBannerProps) {
  const locked = toolType ? isPremiumTool(toolType) && plan !== "premium" : plan !== "premium";

  if (!locked) {
    return (
      <div
        className={cn(
          "rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5",
          className,
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-600 dark:text-emerald-300">
              <BadgeCheck size={20} />
            </div>

            <div>
              <p className="font-black text-slate-950 dark:text-white">
                Premium access active
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                You can use this tool with your current plan.
              </p>
            </div>
          </div>

          <Badge
            variant="success"
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
          >
            Unlocked
          </Badge>
        </div>
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
            <p className="font-black">
              {toolType
                ? `${getToolLabel(toolType)} is premium`
                : "Premium feature locked"}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Upgrade to Premium to unlock image tools, resume review, higher
              limits, and full history access.
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

type PremiumFeatureCardProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  locked?: boolean;
  className?: string;
};

export function PremiumFeatureCard({
  title,
  description,
  icon,
  locked = true,
  className,
}: PremiumFeatureCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border p-5 shadow-xl transition hover:-translate-y-1",
        locked
          ? "border-amber-400/25 bg-amber-400/10"
          : "border-emerald-400/20 bg-emerald-400/10",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
            locked
              ? "bg-amber-400/15 text-amber-600 dark:text-amber-300"
              : "bg-emerald-400/15 text-emerald-600 dark:text-emerald-300",
          )}
        >
          {icon ?? (locked ? <LockKeyhole size={21} /> : <BadgeCheck size={21} />)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-950 dark:text-white">
              {title}
            </h3>

            {locked && <Crown className="h-4 w-4 text-amber-500" />}
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

type PremiumBenefitsProps = {
  compact?: boolean;
  className?: string;
};

export function PremiumBenefits({
  compact = false,
  className,
}: PremiumBenefitsProps) {
  const premiumPlan = PRICING_PLANS.find((plan) => plan.id === "premium");

  const benefits = premiumPlan?.features ?? [
    "AI image generator",
    "Background remover",
    "Object remover",
    "Resume reviewer",
    "Higher monthly limits",
    "Full creation history",
  ];

  return (
    <div
      className={cn(
        "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge
            variant="premium"
            icon={<Gem className="h-3.5 w-3.5" />}
          >
            Premium Benefits
          </Badge>

          <h3
            className={cn(
              "mt-4 font-black text-slate-950 dark:text-white",
              compact ? "text-xl" : "text-2xl",
            )}
          >
            Unlock everything inside QuickAI
          </h3>

          {!compact && (
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Premium is built for users who need advanced image tools,
              resume feedback, stronger limits, and a smoother workflow.
            </p>
          )}
        </div>

        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 text-white shadow-xl shadow-amber-500/20">
          <Crown size={24} />
        </div>
      </div>

      <div className={cn("mt-6 grid gap-3", compact ? "gap-2" : "md:grid-cols-2")}>
        {benefits.map((benefit) => (
          <div
            key={benefit}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10",
              compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
            )}
          >
            <BadgeCheck className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {benefit}
            </span>
          </div>
        ))}
      </div>

      <Link to={ROUTES.billing} className="mt-6 block">
        <Button
          variant="premium"
          fullWidth
          rightIcon={<ArrowRight size={17} />}
        >
          Upgrade to Premium
        </Button>
      </Link>
    </div>
  );
}

type ToolLockOverlayProps = {
  toolType: ToolType;
  plan?: UserPlan;
  className?: string;
};

export function ToolLockOverlay({
  toolType,
  plan = "free",
  className,
}: ToolLockOverlayProps) {
  const locked = isPremiumTool(toolType) && plan !== "premium";

  if (!locked) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 grid place-items-center rounded-[inherit] bg-white/75 p-4 backdrop-blur-md dark:bg-slate-950/75",
        className,
      )}
    >
      <div className="max-w-sm text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 text-white shadow-xl shadow-amber-500/20">
          <LockKeyhole size={27} />
        </div>

        <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
          {getToolLabel(toolType)} is locked
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Upgrade to Premium to use this tool.
        </p>

        <Link to={ROUTES.billing} className="mt-5 inline-flex">
          <Button
            variant="premium"
            size="sm"
            rightIcon={<ArrowRight size={16} />}
          >
            Upgrade
          </Button>
        </Link>
      </div>
    </div>
  );
}

type PremiumToolPreviewProps = {
  toolType: ToolType;
  className?: string;
};

export function PremiumToolPreview({
  toolType,
  className,
}: PremiumToolPreviewProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
          getToolGradient(toolType),
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            "grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-xl",
            getToolGradient(toolType),
          )}
        >
          {toolType === "image" ? <ImageIcon size={24} /> : <WandSparkles size={24} />}
        </div>

        <Badge
          variant="premium"
          icon={<Crown className="h-3.5 w-3.5" />}
        >
          Premium
        </Badge>
      </div>

      <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">
        {getToolLabel(toolType)}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {getToolDescription(toolType)}
      </p>

      <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/15 text-amber-600 dark:text-amber-300">
            <LockKeyhole size={18} />
          </div>

          <div>
            <p className="text-sm font-black text-slate-950 dark:text-white">
              Subscription required
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Upgrade to unlock this tool.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type UpgradeCTAProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function UpgradeCTA({
  title = "Ready to unlock premium AI?",
  description = "Get access to image generation, background removal, object removal, resume review, higher limits, and full creation history.",
  className,
}: UpgradeCTAProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] border border-amber-400/25 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge
            variant="premium"
            icon={<Zap className="h-3.5 w-3.5" />}
          >
            Premium Upgrade
          </Badge>

          <h2 className="mt-5 text-3xl font-black tracking-tight">
            {title}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {description}
          </p>
        </div>

        <Link to={ROUTES.billing}>
          <Button
            variant="premium"
            size="lg"
            rightIcon={<ArrowRight size={18} />}
            className="w-full lg:w-auto"
          >
            View Plans
          </Button>
        </Link>
      </div>
    </section>
  );
}