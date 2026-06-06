import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import {
  FREE_PLAN_LIMIT,
  PLAN_DESCRIPTIONS,
  PLAN_NAMES,
  PREMIUM_PLAN_LIMIT,
  PREMIUM_REQUIRED_MESSAGE,
  PRICING_PLANS,
} from "../lib/constants";
import {
  canUseTool,
  getPlanLabel,
  getToolLabel,
  getUsagePercentage,
  isPremiumTool,
  type ToolType,
  type UserPlan,
} from "../lib/utils";
import type {
  AppUser,
  UserBillingInfo,
  UserPlanInfo,
  UserUsage,
  UserUsageLimit,
  UserUsageSummary,
} from "../types/user";
import { ROUTES } from "../lib/routes";

export type PremiumGateResult = {
  allowed: boolean;
  reason?: string;
  requiredPlan?: UserPlan;
  upgradeHref: string;
};

export type PlanFeature = {
  label: string;
  included: boolean;
  premiumOnly?: boolean;
};

const EMPTY_USAGE: UserUsage = {
  article: 0,
  "blog-title": 0,
  image: 0,
  "background-removal": 0,
  "object-removal": 0,
  "resume-review": 0,
};

export function getPlanLimits(plan: UserPlan): UserUsageLimit {
  return plan === "premium" ? PREMIUM_PLAN_LIMIT : FREE_PLAN_LIMIT;
}

export function getPlanPrice(plan: UserPlan) {
  const pricingPlan = PRICING_PLANS.find((item) => item.id === plan);

  return pricingPlan?.price ?? "$0";
}

export function getPlanFeatures(plan: UserPlan): PlanFeature[] {
  if (plan === "premium") {
    return [
      {
        label: "Article generator",
        included: true,
      },
      {
        label: "Blog title generator",
        included: true,
      },
      {
        label: "AI image generator",
        included: true,
      },
      {
        label: "Background remover",
        included: true,
        premiumOnly: true,
      },
      {
        label: "Object remover",
        included: true,
        premiumOnly: true,
      },
      {
        label: "Resume reviewer",
        included: true,
        premiumOnly: true,
      },
      {
        label: "Higher monthly usage limits",
        included: true,
        premiumOnly: true,
      },
      {
        label: "Full creation history",
        included: true,
        premiumOnly: true,
      },
    ];
  }

  return [
    {
      label: "Article generator",
      included: true,
    },
    {
      label: "Blog title generator",
      included: true,
    },
    {
      label: "AI image generator",
      included: true,
    },
    {
      label: "Background remover",
      included: false,
      premiumOnly: true,
    },
    {
      label: "Object remover",
      included: false,
      premiumOnly: true,
    },
    {
      label: "Resume reviewer",
      included: false,
      premiumOnly: true,
    },
    {
      label: "Higher monthly usage limits",
      included: false,
      premiumOnly: true,
    },
    {
      label: "Full creation history",
      included: false,
      premiumOnly: true,
    },
  ];
}

export function getUsageSummary({
  usage = EMPTY_USAGE,
  limits,
}: {
  usage?: UserUsage;
  limits: UserUsageLimit;
}): UserUsageSummary {
  return {
    article: createToolUsageSummary({
      used: usage.article,
      limit: limits.article,
    }),
    "blog-title": createToolUsageSummary({
      used: usage["blog-title"],
      limit: limits["blog-title"],
    }),
    image: createToolUsageSummary({
      used: usage.image,
      limit: limits.image,
    }),
    "background-removal": createToolUsageSummary({
      used: usage["background-removal"],
      limit: limits["background-removal"],
    }),
    "object-removal": createToolUsageSummary({
      used: usage["object-removal"],
      limit: limits["object-removal"],
    }),
    "resume-review": createToolUsageSummary({
      used: usage["resume-review"],
      limit: limits["resume-review"],
    }),
  };
}

function createToolUsageSummary({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const remaining = Math.max(limit - used, 0);
  const percentage = getUsagePercentage(used, limit);

  return {
    used,
    limit,
    remaining,
    percentage,
    isUnlimited: false,
  };
}

export function checkToolAccess({
  toolType,
  plan,
  usage = EMPTY_USAGE,
}: {
  toolType: ToolType;
  plan: UserPlan;
  usage?: UserUsage;
}): PremiumGateResult {
  const limits = getPlanLimits(plan);
  const used = usage[toolType] ?? 0;
  const limit = limits[toolType] ?? 0;
  const isPremiumOnly = isPremiumTool(toolType);

  if (!canUseTool(toolType, plan)) {
    return {
      allowed: false,
      reason: `${getToolLabel(toolType)} is a premium feature.`,
      requiredPlan: "premium",
      upgradeHref: ROUTES.billing,
    };
  }

  if (limit <= 0) {
    return {
      allowed: false,
      reason: `${getToolLabel(toolType)} is not available on your current plan.`,
      requiredPlan: isPremiumOnly ? "premium" : plan,
      upgradeHref: ROUTES.billing,
    };
  }

  if (used >= limit) {
    return {
      allowed: false,
      reason: `You reached your monthly limit for ${getToolLabel(toolType)}.`,
      requiredPlan: plan === "free" ? "premium" : plan,
      upgradeHref: ROUTES.billing,
    };
  }

  return {
    allowed: true,
    upgradeHref: ROUTES.billing,
  };
}

export function getPlanInfo({
  plan,
  billing,
}: {
  plan: UserPlan;
  billing?: UserBillingInfo | null;
}): UserPlanInfo {
  return {
    plan,
    label: PLAN_NAMES[plan],
    description: PLAN_DESCRIPTIONS[plan],
    isPremium: plan === "premium",
    subscriptionStatus: billing?.subscriptionStatus ?? "none",
    renewsAt: billing?.currentPeriodEnd ?? null,
    cancelAt: billing?.cancelAtPeriodEnd
      ? billing.currentPeriodEnd ?? null
      : null,
  };
}

export function usePremium(user?: AppUser | null) {
  const plan = user?.plan ?? "free";
  const usage = user?.usage ?? EMPTY_USAGE;
  const limits = useMemo(() => getPlanLimits(plan), [plan]);

  const usageSummary = useMemo(() => {
    return getUsageSummary({
      usage,
      limits,
    });
  }, [usage, limits]);

  const planInfo = useMemo<UserPlanInfo>(() => {
    return getPlanInfo({
      plan,
      billing: undefined,
    });
  }, [plan]);

  const features = useMemo(() => getPlanFeatures(plan), [plan]);

  const isPremium = plan === "premium";
  const isFree = plan === "free";

  const canAccessTool = useCallback(
    (toolType: ToolType) => {
      return checkToolAccess({
        toolType,
        plan,
        usage,
      }).allowed;
    },
    [plan, usage],
  );

  const getToolAccess = useCallback(
    (toolType: ToolType) => {
      return checkToolAccess({
        toolType,
        plan,
        usage,
      });
    },
    [plan, usage],
  );

  const requirePremium = useCallback(
    (toolType?: ToolType) => {
      if (isPremium) return true;

      const message = toolType
        ? `${getToolLabel(toolType)} is a premium feature. Upgrade to unlock it.`
        : PREMIUM_REQUIRED_MESSAGE;

      toast.error(message);

      return false;
    },
    [isPremium],
  );

  const requireToolAccess = useCallback(
    (toolType: ToolType) => {
      const access = checkToolAccess({
        toolType,
        plan,
        usage,
      });

      if (!access.allowed) {
        toast.error(access.reason ?? PREMIUM_REQUIRED_MESSAGE);
        return false;
      }

      return true;
    },
    [plan, usage],
  );

  const getRemainingCredits = useCallback(
    (toolType: ToolType) => {
      return usageSummary[toolType]?.remaining ?? 0;
    },
    [usageSummary],
  );

  const getUsedCredits = useCallback(
    (toolType: ToolType) => {
      return usageSummary[toolType]?.used ?? 0;
    },
    [usageSummary],
  );

  const getToolLimit = useCallback(
    (toolType: ToolType) => {
      return usageSummary[toolType]?.limit ?? 0;
    },
    [usageSummary],
  );

  const hasReachedLimit = useCallback(
    (toolType: ToolType) => {
      const summary = usageSummary[toolType];

      if (!summary) return true;

      return summary.used >= summary.limit;
    },
    [usageSummary],
  );

  return {
    plan,
    planLabel: getPlanLabel(plan),
    planInfo,
    features,
    usage,
    limits,
    usageSummary,

    isPremium,
    isFree,

    canAccessTool,
    getToolAccess,
    requirePremium,
    requireToolAccess,

    getRemainingCredits,
    getUsedCredits,
    getToolLimit,
    hasReachedLimit,

    upgradeHref: ROUTES.billing,
  };
}

export function useToolAccess({
  toolType,
  user,
}: {
  toolType: ToolType;
  user?: AppUser | null;
}) {
  const premium = usePremium(user);

  const access = useMemo(() => {
    return premium.getToolAccess(toolType);
  }, [premium, toolType]);

  const usage = premium.usageSummary[toolType];

  return {
    ...access,
    toolType,
    toolLabel: getToolLabel(toolType),
    isPremiumTool: isPremiumTool(toolType),
    isPremiumUser: premium.isPremium,
    usage,
    canUse: access.allowed,
    upgradeHref: ROUTES.billing,
  };
}

export function usePricingPlans(currentPlan: UserPlan = "free") {
  return useMemo(() => {
    return PRICING_PLANS.map((plan) => ({
      ...plan,
      isCurrent: plan.id === currentPlan,
      isPremium: plan.id === "premium",
      ctaLabel:
        plan.id === currentPlan
          ? "Current Plan"
          : plan.id === "premium"
            ? "Upgrade to Premium"
            : "Start Free",
    }));
  }, [currentPlan]);
}

export function useUpgradePrompt() {
  const showUpgradeToast = useCallback((toolType?: ToolType) => {
    const message = toolType
      ? `${getToolLabel(toolType)} is locked on the Free plan. Upgrade to Premium to use it.`
      : PREMIUM_REQUIRED_MESSAGE;

    toast.error(message, {
      description: "Premium unlocks advanced image editing tools, resume review, higher limits, and full history.",
      action: {
        label: "Upgrade",
        onClick: () => {
          window.location.href = ROUTES.billing;
        },
      },
    });
  }, []);

  const showLimitToast = useCallback((toolType: ToolType) => {
    toast.warning(`Monthly limit reached for ${getToolLabel(toolType)}.`, {
      description: "Upgrade to Premium for higher monthly limits.",
      action: {
        label: "Upgrade",
        onClick: () => {
          window.location.href = ROUTES.billing;
        },
      },
    });
  }, []);

  return {
    showUpgradeToast,
    showLimitToast,
  };
}