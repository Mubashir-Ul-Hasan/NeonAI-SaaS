import type { AuthContext, PremiumToolType, ToolType, UsageLimitResult } from "../types";
import { premiumRequired } from "../utils/errors";
import { isPremiumTool } from "../utils/validators";
import { requireUser, type AuthEvent } from "./requireUser";
import {
  assertUsageLimit,
  checkUsageLimit,
} from "../services/usageService";

export type PremiumAuthContext = AuthContext & {
  user: AuthContext["user"] & {
    plan: "premium";
  };
};

export async function requirePremium(
  event: AuthEvent,
): Promise<PremiumAuthContext> {
  const auth = await requireUser(event);

  if (auth.user.plan !== "premium") {
    throw premiumRequired();
  }

  return auth as PremiumAuthContext;
}

export async function requirePremiumForTool(
  event: AuthEvent,
  toolType: ToolType,
): Promise<AuthContext> {
  const auth = await requireUser(event);

  if (isPremiumTool(toolType) && auth.user.plan !== "premium") {
    throw premiumRequired(
      `${getToolLabel(toolType)} requires a Premium subscription.`,
    );
  }

  return auth;
}

export async function requirePremiumTool(
  event: AuthEvent,
  toolType: PremiumToolType,
): Promise<PremiumAuthContext> {
  const auth = await requirePremium(event);

  if (!isPremiumTool(toolType)) {
    throw premiumRequired("This endpoint only supports premium tools.");
  }

  return auth;
}

export async function requireUserWithUsageLimit(input: {
  event: AuthEvent;
  toolType?: ToolType;
}): Promise<
  AuthContext & {
    usageLimit: UsageLimitResult;
  }
> {
  const auth = await requireUser(input.event);

  const usageLimit = await assertUsageLimit({
    clerkUserId: auth.clerkUserId,
    plan: auth.user.plan,
    toolType: input.toolType,
  });

  return {
    ...auth,
    usageLimit,
  };
}

export async function requirePremiumWithUsageLimit(input: {
  event: AuthEvent;
  toolType: PremiumToolType;
}): Promise<
  PremiumAuthContext & {
    usageLimit: UsageLimitResult;
  }
> {
  const auth = await requirePremiumTool(input.event, input.toolType);

  const usageLimit = await assertUsageLimit({
    clerkUserId: auth.clerkUserId,
    plan: auth.user.plan,
    toolType: input.toolType,
  });

  return {
    ...auth,
    usageLimit,
  };
}

export async function checkUserToolAccess(input: {
  event: AuthEvent;
  toolType: ToolType;
}): Promise<{
  auth: AuthContext;
  hasAccess: boolean;
  requiresPremium: boolean;
  usageLimit: UsageLimitResult;
}> {
  const auth = await requireUser(input.event);
  const requiresPremium = isPremiumTool(input.toolType);
  const hasPremiumAccess = !requiresPremium || auth.user.plan === "premium";

  const usageLimit = await checkUsageLimit({
    clerkUserId: auth.clerkUserId,
    plan: auth.user.plan,
    toolType: input.toolType,
  });

  return {
    auth,
    hasAccess: hasPremiumAccess && usageLimit.allowed,
    requiresPremium,
    usageLimit,
  };
}

export function assertPremiumPlan(auth: AuthContext): PremiumAuthContext {
  if (auth.user.plan !== "premium") {
    throw premiumRequired();
  }

  return auth as PremiumAuthContext;
}

export function assertToolAccess(auth: AuthContext, toolType: ToolType): void {
  if (isPremiumTool(toolType) && auth.user.plan !== "premium") {
    throw premiumRequired(
      `${getToolLabel(toolType)} requires a Premium subscription.`,
    );
  }
}

export function getToolAccessInfo(input: {
  plan: AuthContext["user"]["plan"];
  toolType: ToolType;
}): {
  allowed: boolean;
  requiresPremium: boolean;
  plan: AuthContext["user"]["plan"];
  toolType: ToolType;
} {
  const requiresPremium = isPremiumTool(input.toolType);

  return {
    allowed: !requiresPremium || input.plan === "premium",
    requiresPremium,
    plan: input.plan,
    toolType: input.toolType,
  };
}

function getToolLabel(toolType: ToolType): string {
  const labels: Record<ToolType, string> = {
    article: "Article generation",
    "blog-title": "Blog title generation",
    image: "Image generation",
    "background-removal": "Background removal",
    "object-removal": "Object removal",
    "resume-review": "Resume review",
  };

  return labels[toolType];
}