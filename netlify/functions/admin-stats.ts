import { requireAdmin } from "../../server/auth/requireAdmin";
import {
  getCreationCounts,
  getCreationCountsByTool,
  listRecentCreations,
} from "../../server/services/creationService";
import {
  getGlobalUsageStats,
  getUsageByTool,
  listRecentUsageLogs,
  type UsagePeriod,
} from "../../server/services/usageService";
import {
  getUserCounts,
  listRecentUsers,
  mapUserToAppUser,
} from "../../server/services/userService";
import { validationError } from "../../server/utils/errors";
import { createGetHandler } from "../../server/utils/handler";
import { getQueryParam } from "../../server/utils/parseBody";
import { success } from "../../server/utils/response";

const premiumPlanPriceUsd = 29;

export const handler = createGetHandler(async ({ event }) => {
  const auth = await requireAdmin(event);

  const period = parseUsagePeriod(getQueryParam(event, "period"));

  const [
    userCounts,
    creationCounts,
    creationCountsByTool,
    usageStats,
    usageByTool,
    recentCreations,
    recentUsageLogs,
    recentUsers,
  ] = await Promise.all([
    getUserCounts(),
    getCreationCounts(),
    getCreationCountsByTool(),
    getGlobalUsageStats({
      period,
    }),
    getUsageByTool({
      period,
    }),
    listRecentCreations({
      limit: 8,
    }),
    listRecentUsageLogs({
      limit: 10,
    }),
    listRecentUsers(8),
  ]);

  const estimatedMonthlyRevenueUsd =
    userCounts.premiumUsers * premiumPlanPriceUsd;

  const conversionRate =
    userCounts.totalUsers > 0
      ? Math.round((userCounts.premiumUsers / userCounts.totalUsers) * 100)
      : 0;

  const successRate =
    usageStats.totalApiCalls > 0
      ? Math.round(
          (usageStats.successfulApiCalls / usageStats.totalApiCalls) * 100,
        )
      : 0;

  return success(
    {
      admin: {
        id: auth.user.id,
        clerkUserId: auth.clerkUserId,
        email: auth.user.email,
        role: auth.user.role,
      },
      period,
      overview: {
        totalUsers: userCounts.totalUsers,
        premiumUsers: userCounts.premiumUsers,
        adminUsers: userCounts.adminUsers,
        totalCreations: creationCounts.total,
        completedCreations: creationCounts.completed,
        processingCreations: creationCounts.processing,
        failedCreations: creationCounts.failed,
        favoriteCreations: creationCounts.favorites,
        totalApiCalls: usageStats.totalApiCalls,
        successfulApiCalls: usageStats.successfulApiCalls,
        failedApiCalls: usageStats.failedApiCalls,
        pendingApiCalls: usageStats.pendingApiCalls,
        totalTokensUsed: usageStats.totalTokensUsed,
        totalCostUsd: usageStats.totalCostUsd,
        averageLatencyMs: usageStats.averageLatencyMs,
        estimatedMonthlyRevenueUsd,
        conversionRate,
        successRate,
      },
      charts: {
        usageByTool,
        creationCountsByTool,
      },
      recent: {
        creations: recentCreations,
        usageLogs: recentUsageLogs.map((log) => ({
          id: log.id,
          clerkUserId: log.clerkUserId,
          creationId: log.creationId,
          toolType: log.toolType,
          provider: log.provider,
          status: log.status,
          tokensUsed: log.tokensUsed,
          costUsd: log.costUsd,
          latencyMs: log.latencyMs,
          errorMessage: log.errorMessage,
          metadata: log.metadata,
          createdAt: log.createdAt.toISOString(),
        })),
        users: recentUsers.map((user) => {
          const appUser = mapUserToAppUser(user);

          return {
            ...appUser,
            createdAt: appUser.createdAt.toISOString(),
            updatedAt: appUser.updatedAt.toISOString(),
          };
        }),
      },
      revenue: {
        premiumPlanPriceUsd,
        estimatedMonthlyRevenueUsd,
        note:
          "Revenue is estimated from premium user count until real billing webhook data is connected.",
      },
    },
    {
      message: "Admin stats loaded successfully.",
    },
  );
});

function parseUsagePeriod(value: string | undefined): UsagePeriod {
  if (!value) return "month";

  if (value === "day" || value === "week" || value === "month") {
    return value;
  }

  throw validationError("Invalid period query parameter.", {
    received: value,
    allowedValues: ["day", "week", "month"],
  });
}