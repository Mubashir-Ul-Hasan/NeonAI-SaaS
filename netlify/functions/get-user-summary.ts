import { requireUser } from "../../server/auth/requireUser";
import { getToolAccessInfo } from "../../server/auth/requirePremium";
import { getCreationCounts } from "../../server/services/creationService";
import {
  getUserSummary,
  mapUserToAuthenticatedUser,
  requireUserByClerkUserId,
} from "../../server/services/userService";
import { getUsageByTool } from "../../server/services/usageService";
import { createGetHandler } from "../../server/utils/handler";
import { success } from "../../server/utils/response";
import type { ToolType } from "../../server/types";

const tools: ToolType[] = [
  "article",
  "blog-title",
  "image",
  "background-removal",
  "object-removal",
  "resume-review",
];

export const handler = createGetHandler(async ({ event }) => {
  const auth = await requireUser(event);

  const [freshUser, summary, creationCounts, usageByTool] = await Promise.all([
    requireUserByClerkUserId(auth.clerkUserId),
    getUserSummary(auth.clerkUserId),
    getCreationCounts({
      clerkUserId: auth.clerkUserId,
    }),
    getUsageByTool({
      clerkUserId: auth.clerkUserId,
      period: "month",
    }),
  ]);

  const user = mapUserToAuthenticatedUser(freshUser);

  const toolAccess = tools.map((toolType) =>
  getToolAccessInfo({
    plan: user.plan,
    toolType,
  }),
);

  return success(
    {
      user,
      plan: {
        current: user.plan,
        role: user.role,
        billingStatus: freshUser.billingStatus,
        subscriptionCurrentPeriodEnd:
          freshUser.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
      },
      usage: summary.usage,
      creations: {
        ...summary.creations,
        counts: creationCounts,
      },
      usageByTool,
      toolAccess,
      account: {
        id: freshUser.id,
        clerkUserId: freshUser.clerkUserId,
        email: freshUser.email,
        name: freshUser.name,
        imageUrl: freshUser.imageUrl,
        createdAt: freshUser.createdAt.toISOString(),
        updatedAt: freshUser.updatedAt.toISOString(),
      },
    },
    {
      message: "User summary loaded successfully.",
    },
  );
});