import type { ToolType, UserPlan } from "../lib/utils";

export type UserRole = "user" | "admin";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type AuthProvider = "google" | "email" | "unknown";

export type UserPreferences = {
  theme?: "light" | "dark" | "system";
  emailNotifications?: boolean;
  generationNotifications?: boolean;
  marketingEmails?: boolean;
  defaultArticleTone?: string;
  defaultImageStyle?: string;
};

export type UserUsage = {
  article: number;
  "blog-title": number;
  image: number;
  "background-removal": number;
  "object-removal": number;
  "resume-review": number;
};

export type UserUsageLimit = {
  article: number;
  "blog-title": number;
  image: number;
  "background-removal": number;
  "object-removal": number;
  "resume-review": number;
};

export type AppUser = {
  id: string;
  clerkUserId: string;

  email: string;
  name: string;
  imageUrl?: string | null;

  role: UserRole;
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;

  authProvider?: AuthProvider;

  usage: UserUsage;
  usageLimit: UserUsageLimit;

  preferences?: UserPreferences | null;

  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
};

export type PublicUser = Pick<
  AppUser,
  "id" | "name" | "email" | "imageUrl" | "plan" | "role"
>;

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string | null;
  plan: UserPlan;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  joinedAt: string;
};

export type UserPlanInfo = {
  plan: UserPlan;
  label: string;
  description: string;
  isPremium: boolean;
  subscriptionStatus: SubscriptionStatus;
  renewsAt?: string | null;
  cancelAt?: string | null;
};

export type UsageSummary = {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  isUnlimited?: boolean;
};

export type UserUsageSummary = Record<ToolType, UsageSummary>;

export type UserBillingInfo = {
  userId: string;
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  clerkSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
};

export type UpdateUserProfilePayload = {
  name?: string;
  imageUrl?: string | null;
};

export type UpdateUserPreferencesPayload = Partial<UserPreferences>;

export type AdminUserListItem = {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  imageUrl?: string | null;
  role: UserRole;
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  totalCreations: number;
  totalCreditsUsed: number;
  createdAt: string;
  lastLoginAt?: string | null;
};

export type AdminUsersResponse = {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type AdminUserQueryParams = {
  search?: string;
  plan?: UserPlan | "all";
  role?: UserRole | "all";
  subscriptionStatus?: SubscriptionStatus | "all";
  page?: number;
  limit?: number;
};

export type UserSession = {
  userId: string;
  clerkUserId: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isSignedIn: boolean;
  isPremium: boolean;
  isAdmin: boolean;
};

export type AuthState = {
  user: AppUser | null;
  session: UserSession | null;
  isLoaded: boolean;
  isSignedIn: boolean;
};

export type PlanUpgradeResult = {
  checkoutUrl?: string;
  success: boolean;
  message: string;
};

export type PlanDowngradeResult = {
  success: boolean;
  message: string;
  plan: UserPlan;
};

export type UserActivity = {
  id: string;
  userId: string;
  action:
    | "signed_in"
    | "signed_up"
    | "generated_article"
    | "generated_titles"
    | "generated_image"
    | "removed_background"
    | "removed_object"
    | "reviewed_resume"
    | "upgraded_plan"
    | "downgraded_plan"
    | "deleted_creation";
  toolType?: ToolType | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type UserNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "billing" | "generation";
  isRead: boolean;
  href?: string | null;
  createdAt: string;
};

export function isPremiumUser(user?: Pick<AppUser, "plan"> | null) {
  return user?.plan === "premium";
}

export function isAdminUser(user?: Pick<AppUser, "role"> | null) {
  return user?.role === "admin";
}

export function canAccessPremiumFeatures(user?: Pick<AppUser, "plan"> | null) {
  return isPremiumUser(user);
}

export function getDisplayName(user?: Partial<AppUser> | null) {
  if (!user) return "User";

  return user.name || user.email || "User";
}

export function getUserInitials(user?: Partial<AppUser> | null) {
  const displayName = getDisplayName(user);

  return displayName
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function getRemainingUsage({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  if (limit <= 0) {
    return {
      used,
      limit,
      remaining: 0,
      percentage: 100,
    };
  }

  const remaining = Math.max(limit - used, 0);
  const percentage = Math.min(Math.round((used / limit) * 100), 100);

  return {
    used,
    limit,
    remaining,
    percentage,
  };
}

export function hasReachedUsageLimit({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  if (limit <= 0) return true;

  return used >= limit;
}

export function getToolUsageSummary({
  usage,
  limits,
}: {
  usage: UserUsage;
  limits: UserUsageLimit;
}): UserUsageSummary {
  return {
    article: getRemainingUsage({
      used: usage.article,
      limit: limits.article,
    }),
    "blog-title": getRemainingUsage({
      used: usage["blog-title"],
      limit: limits["blog-title"],
    }),
    image: getRemainingUsage({
      used: usage.image,
      limit: limits.image,
    }),
    "background-removal": getRemainingUsage({
      used: usage["background-removal"],
      limit: limits["background-removal"],
    }),
    "object-removal": getRemainingUsage({
      used: usage["object-removal"],
      limit: limits["object-removal"],
    }),
    "resume-review": getRemainingUsage({
      used: usage["resume-review"],
      limit: limits["resume-review"],
    }),
  };
}

export function createEmptyUsage(): UserUsage {
  return {
    article: 0,
    "blog-title": 0,
    image: 0,
    "background-removal": 0,
    "object-removal": 0,
    "resume-review": 0,
  };
}