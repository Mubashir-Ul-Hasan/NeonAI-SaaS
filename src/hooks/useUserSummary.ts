import { useAuth, useUser } from "@clerk/clerk-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  createBillingPortal,
  createCheckout,
  getApiErrorMessage,
  getUserSummary,
  isPremiumRequiredError,
  isUnauthorizedError,
  isUsageLimitError,
  type BillingPortalResponse,
  type CheckoutResponse,
  type ToolType,
  type UserSummaryResponse,
} from "../lib/api";

export const userSummaryKeys = {
  all: ["user-summary"] as const,
  current: () => [...userSummaryKeys.all, "current"] as const,
};

export type UseUserSummaryOptions = {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
};

export function useUserSummary(options: UseUserSummaryOptions = {}) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: userSummaryKeys.current(),
    enabled: Boolean(isLoaded && isSignedIn && (options.enabled ?? true)),
    staleTime: options.staleTime ?? 1000 * 30,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    queryFn: async () => {
      const token = await getToken();

      return getUserSummary({
        token,
      });
    },
  });
}

export function useCurrentPlan() {
  const summaryQuery = useUserSummary();

  return {
    ...summaryQuery,
    plan: summaryQuery.data?.plan.current ?? "free",
    role: summaryQuery.data?.plan.role ?? "user",
    billingStatus: summaryQuery.data?.plan.billingStatus ?? "free",
    isPremium: summaryQuery.data?.plan.current === "premium",
    isAdmin: summaryQuery.data?.plan.role === "admin",
  };
}

export function useCurrentUsage() {
  const summaryQuery = useUserSummary();

  return {
    ...summaryQuery,
    usage: summaryQuery.data?.usage ?? {
      monthStartedAt: "",
      usedThisMonth: 0,
      limit: 0,
      remaining: 0,
    },
    usagePercentage: getUsagePercentage(summaryQuery.data),
    isUsageLimitReached:
      Boolean(summaryQuery.data) &&
      summaryQuery.data!.usage.remaining <= 0,
  };
}

export function useToolAccess(toolType: ToolType) {
  const summaryQuery = useUserSummary();

  const access = summaryQuery.data?.toolAccess.find(
    (item) => item.toolType === toolType,
  );

  return {
    ...summaryQuery,
    access,
    allowed: access?.allowed ?? false,
    requiresPremium: access?.requiresPremium ?? false,
    plan: access?.plan ?? "free",
  };
}

export function useCanUseTool(toolType: ToolType): boolean {
  const { allowed } = useToolAccess(toolType);

  return allowed;
}

export function useCreationSummary() {
  const summaryQuery = useUserSummary();

  return {
    ...summaryQuery,
    creations: summaryQuery.data?.creations ?? {
      total: 0,
      recentCount: 0,
      counts: {
        total: 0,
        completed: 0,
        processing: 0,
        failed: 0,
        favorites: 0,
      },
    },
  };
}

export function useRefreshUserSummary() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: userSummaryKeys.all,
    });
  };
}

export function useCreateCheckout(
  options: UseMutationOptions<
    CheckoutResponse,
    Error,
    {
      planId?: string;
      returnUrl?: string;
    }
  > = {},
) {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (input) => {
      const token = await getToken();

      return createCheckout(input, {
        token,
      });
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
    onSettled: options.onSettled,
    onMutate: options.onMutate,
  });
}

export function useCreateBillingPortal(
  options: UseMutationOptions<
    BillingPortalResponse,
    Error,
    {
      returnUrl?: string;
    }
  > = {},
) {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (input) => {
      const token = await getToken();

      return createBillingPortal(input, {
        token,
      });
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
    onSettled: options.onSettled,
    onMutate: options.onMutate,
  });
}

export function useUserDisplayName() {
  const { user } = useUser();
  const summaryQuery = useUserSummary();

  const summaryName = summaryQuery.data?.user.name;
  const clerkName = user?.fullName || user?.firstName || user?.username;
  const email = summaryQuery.data?.user.email || user?.primaryEmailAddress?.emailAddress;

  return {
    name: summaryName || clerkName || "Creator",
    email: email || "",
    imageUrl: summaryQuery.data?.user.imageUrl || user?.imageUrl || null,
    initials: getInitials(summaryName || clerkName || email || "Creator"),
  };
}

export function getUserSummaryErrorMessage(error: unknown) {
  if (isUnauthorizedError(error)) {
    return "Please sign in again to continue.";
  }

  if (isPremiumRequiredError(error)) {
    return "This action requires a Premium subscription.";
  }

  if (isUsageLimitError(error)) {
    return "You have reached your monthly usage limit.";
  }

  return getApiErrorMessage(error, "Could not load account summary.");
}

export function getUsagePercentage(summary: UserSummaryResponse | undefined) {
  if (!summary || summary.usage.limit <= 0) return 0;

  return Math.min(
    Math.round((summary.usage.usedThisMonth / summary.usage.limit) * 100),
    100,
  );
}

export function getRemainingUsageText(summary: UserSummaryResponse | undefined) {
  if (!summary) return "Usage data unavailable";

  return `${summary.usage.remaining} of ${summary.usage.limit} uses remaining`;
}

export function getPlanLabel(plan: string | undefined) {
  return plan === "premium" ? "Premium" : "Free";
}

export function getBillingStatusLabel(status: string | undefined) {
  const labels: Record<string, string> = {
    free: "Free",
    active: "Active",
    trialing: "Trialing",
    past_due: "Past Due",
    cancelled: "Cancelled",
    incomplete: "Incomplete",
  };

  return labels[status ?? "free"] ?? "Unknown";
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}