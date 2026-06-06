import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import { env } from "../env";
import { db, executeDatabaseOperation } from "../db/client";
import {
  apiUsageLogs,
  users,
  type ApiUsageLog,
  type NewApiUsageLog,
} from "../db/schema";
import type {
  ApiProvider,
  ApiUsageStatus,
  ToolType,
  TrackUsageInput,
  UsageLimitResult,
  UserPlan,
} from "../types";
import { usageLimitReached, validationError } from "../utils/errors";

export type UsagePeriod = "month" | "week" | "day";

export type UsageSummary = {
  used: number;
  limit: number;
  remaining: number;
  plan: UserPlan;
  periodStartedAt: string;
};

export type UsageStats = {
  totalApiCalls: number;
  successfulApiCalls: number;
  failedApiCalls: number;
  pendingApiCalls: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  averageLatencyMs: number;
};

export type UsageByTool = Array<{
  toolType: ToolType;
  count: number;
  tokensUsed: number;
  costUsd: number;
}>;

const trackableStatuses: ApiUsageStatus[] = ["success", "failed", "pending"];

const trackableProviders: ApiProvider[] = [
  "gemini",
  "clipdrop",
  "cloudinary",
  "resume-reviewer",
  "system",
];

export async function trackUsage(
  input: TrackUsageInput,
): Promise<ApiUsageLog> {
  const usageInput = normalizeTrackUsageInput(input);

  return executeDatabaseOperation(async () => {
    const [createdLog] = await db
      .insert(apiUsageLogs)
      .values(usageInput)
      .returning();

    if (!createdLog) {
      throw validationError("Failed to create API usage log.");
    }

    return createdLog;
  }, "Failed to track API usage.");
}

export async function trackSuccess(input: Omit<TrackUsageInput, "status">) {
  return trackUsage({
    ...input,
    status: "success",
  });
}

export async function trackFailure(
  input: Omit<TrackUsageInput, "status"> & {
    errorMessage?: string | null;
  },
) {
  return trackUsage({
    ...input,
    status: "failed",
    errorMessage: input.errorMessage ?? "Request failed.",
  });
}

export async function getCurrentMonthlyUsage(input: {
  clerkUserId: string;
  toolType?: ToolType;
}): Promise<number> {
  const monthStartedAt = getPeriodStartDate("month");

  return executeDatabaseOperation(async () => {
    const conditions = [
      eq(apiUsageLogs.clerkUserId, input.clerkUserId),
      eq(apiUsageLogs.status, "success"),
      gte(apiUsageLogs.createdAt, monthStartedAt),
    ];

    if (input.toolType) {
      conditions.push(eq(apiUsageLogs.toolType, input.toolType));
    }

    const [result] = await db
      .select({
        total: count(apiUsageLogs.id),
      })
      .from(apiUsageLogs)
      .where(and(...conditions));

    return Number(result?.total ?? 0);
  }, "Failed to get current monthly usage.");
}

export async function checkUsageLimit(input: {
  clerkUserId: string;
  plan: UserPlan;
  toolType?: ToolType;
}): Promise<UsageLimitResult> {
  const used = await getCurrentMonthlyUsage({
    clerkUserId: input.clerkUserId,
    toolType: input.toolType,
  });

  const limit = getUsageLimitForPlan(input.plan);
  const remaining = Math.max(limit - used, 0);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
    plan: input.plan,
  };
}

export async function assertUsageLimit(input: {
  clerkUserId: string;
  plan: UserPlan;
  toolType?: ToolType;
}): Promise<UsageLimitResult> {
  const usageLimit = await checkUsageLimit(input);

  if (!usageLimit.allowed) {
    throw usageLimitReached(usageLimit.used, usageLimit.limit);
  }

  return usageLimit;
}

export async function getUsageSummary(input: {
  clerkUserId: string;
  plan: UserPlan;
  period?: UsagePeriod;
}): Promise<UsageSummary> {
  const period = input.period ?? "month";
  const periodStartedAt = getPeriodStartDate(period);

  return executeDatabaseOperation(async () => {
    const [result] = await db
      .select({
        total: count(apiUsageLogs.id),
      })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.clerkUserId, input.clerkUserId),
          eq(apiUsageLogs.status, "success"),
          gte(apiUsageLogs.createdAt, periodStartedAt),
        ),
      );

    const used = Number(result?.total ?? 0);
    const limit = getUsageLimitForPlan(input.plan);

    return {
      used,
      limit,
      remaining: Math.max(limit - used, 0),
      plan: input.plan,
      periodStartedAt: periodStartedAt.toISOString(),
    };
  }, "Failed to get usage summary.");
}

export async function getUserUsageStats(input: {
  clerkUserId: string;
  period?: UsagePeriod;
}): Promise<UsageStats> {
  const periodStartedAt = getPeriodStartDate(input.period ?? "month");

  return executeDatabaseOperation(async () => {
    const [result] = await db
      .select({
        totalApiCalls: count(apiUsageLogs.id),
        successfulApiCalls: sql<number>`
          coalesce(sum(case when ${apiUsageLogs.status} = 'success' then 1 else 0 end), 0)::int
        `,
        failedApiCalls: sql<number>`
          coalesce(sum(case when ${apiUsageLogs.status} = 'failed' then 1 else 0 end), 0)::int
        `,
        pendingApiCalls: sql<number>`
          coalesce(sum(case when ${apiUsageLogs.status} = 'pending' then 1 else 0 end), 0)::int
        `,
        totalTokensUsed: sql<number>`
          coalesce(sum(${apiUsageLogs.tokensUsed}), 0)::int
        `,
        totalCostUsd: sql<number>`
          coalesce(sum(${apiUsageLogs.costUsd}), 0)::float
        `,
        averageLatencyMs: sql<number>`
          coalesce(avg(${apiUsageLogs.latencyMs}), 0)::int
        `,
      })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.clerkUserId, input.clerkUserId),
          gte(apiUsageLogs.createdAt, periodStartedAt),
        ),
      );

    return mapUsageStats(result);
  }, "Failed to get user usage stats.");
}

export async function getGlobalUsageStats(input: {
  period?: UsagePeriod;
} = {}): Promise<UsageStats> {
  const periodStartedAt = getPeriodStartDate(input.period ?? "month");

  return executeDatabaseOperation(async () => {
    const [result] = await db
      .select({
        totalApiCalls: count(apiUsageLogs.id),
        successfulApiCalls: sql<number>`
          coalesce(sum(case when ${apiUsageLogs.status} = 'success' then 1 else 0 end), 0)::int
        `,
        failedApiCalls: sql<number>`
          coalesce(sum(case when ${apiUsageLogs.status} = 'failed' then 1 else 0 end), 0)::int
        `,
        pendingApiCalls: sql<number>`
          coalesce(sum(case when ${apiUsageLogs.status} = 'pending' then 1 else 0 end), 0)::int
        `,
        totalTokensUsed: sql<number>`
          coalesce(sum(${apiUsageLogs.tokensUsed}), 0)::int
        `,
        totalCostUsd: sql<number>`
          coalesce(sum(${apiUsageLogs.costUsd}), 0)::float
        `,
        averageLatencyMs: sql<number>`
          coalesce(avg(${apiUsageLogs.latencyMs}), 0)::int
        `,
      })
      .from(apiUsageLogs)
      .where(gte(apiUsageLogs.createdAt, periodStartedAt));

    return mapUsageStats(result);
  }, "Failed to get global usage stats.");
}

export async function getUsageByTool(input: {
  clerkUserId?: string;
  period?: UsagePeriod;
} = {}): Promise<UsageByTool> {
  const periodStartedAt = getPeriodStartDate(input.period ?? "month");

  return executeDatabaseOperation(async () => {
    const conditions = [
      gte(apiUsageLogs.createdAt, periodStartedAt),
      eq(apiUsageLogs.status, "success"),
    ];

    if (input.clerkUserId) {
      conditions.push(eq(apiUsageLogs.clerkUserId, input.clerkUserId));
    }

    const rows = await db
      .select({
        toolType: apiUsageLogs.toolType,
        count: count(apiUsageLogs.id),
        tokensUsed: sql<number>`
          coalesce(sum(${apiUsageLogs.tokensUsed}), 0)::int
        `,
        costUsd: sql<number>`
          coalesce(sum(${apiUsageLogs.costUsd}), 0)::float
        `,
      })
      .from(apiUsageLogs)
      .where(and(...conditions))
      .groupBy(apiUsageLogs.toolType);

    return rows
      .filter((row): row is {
        toolType: ToolType;
        count: number;
        tokensUsed: number;
        costUsd: number;
      } => Boolean(row.toolType))
      .map((row) => ({
        toolType: row.toolType,
        count: Number(row.count ?? 0),
        tokensUsed: Number(row.tokensUsed ?? 0),
        costUsd: Number(row.costUsd ?? 0),
      }));
  }, "Failed to get usage by tool.");
}

export async function listRecentUsageLogs(input: {
  clerkUserId?: string;
  limit?: number;
} = {}): Promise<ApiUsageLog[]> {
  const limit = clampInteger(input.limit ?? 20, 1, 100);

  return executeDatabaseOperation(async () => {
    if (input.clerkUserId) {
      return db
        .select()
        .from(apiUsageLogs)
        .where(eq(apiUsageLogs.clerkUserId, input.clerkUserId))
        .orderBy(desc(apiUsageLogs.createdAt))
        .limit(limit);
    }

    return db
      .select()
      .from(apiUsageLogs)
      .orderBy(desc(apiUsageLogs.createdAt))
      .limit(limit);
  }, "Failed to list recent usage logs.");
}

export async function resetUserMonthlyUsageMarker(clerkUserId: string) {
  return executeDatabaseOperation(async () => {
    const [updatedUser] = await db
      .update(users)
      .set({
        monthlyUsageResetAt: getNextMonthlyResetDate(),
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, clerkUserId))
      .returning();

    return updatedUser ?? null;
  }, "Failed to reset user monthly usage marker.");
}

export function getUsageLimitForPlan(plan: UserPlan): number {
  return plan === "premium"
    ? env.premiumMonthlyLimit
    : env.freeMonthlyLimit;
}

export function getPeriodStartDate(period: UsagePeriod, date = new Date()): Date {
  if (period === "day") {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  if (period === "week") {
    const start = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const day = start.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;

    start.setUTCDate(start.getUTCDate() - diff);

    return start;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function getNextMonthlyResetDate(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0),
  );
}

function normalizeTrackUsageInput(input: TrackUsageInput): NewApiUsageLog {
  validateProvider(input.provider);
  validateStatus(input.status);

  return {
    userId: input.userId ?? null,
    clerkUserId: input.clerkUserId ?? null,
    creationId: input.creationId ?? null,
    toolType: input.toolType ?? null,
    provider: input.provider,
    status: input.status,
    tokensUsed: normalizeNonNegativeInteger(input.tokensUsed ?? 0, "tokensUsed"),
    costUsd: normalizeNonNegativeNumber(input.costUsd ?? 0, "costUsd"),
    latencyMs: normalizeNonNegativeInteger(input.latencyMs ?? 0, "latencyMs"),
    errorMessage: input.errorMessage ?? null,
    metadata: input.metadata ?? {},
  };
}

function validateProvider(provider: ApiProvider): void {
  if (!trackableProviders.includes(provider)) {
    throw validationError("Invalid API provider.", {
      provider,
      allowedProviders: trackableProviders,
    });
  }
}

function validateStatus(status: ApiUsageStatus): void {
  if (!trackableStatuses.includes(status)) {
    throw validationError("Invalid API usage status.", {
      status,
      allowedStatuses: trackableStatuses,
    });
  }
}

function normalizeNonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw validationError(`${fieldName} must be a non-negative number.`);
  }

  return Math.floor(value);
}

function normalizeNonNegativeNumber(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw validationError(`${fieldName} must be a non-negative number.`);
  }

  return value;
}

function mapUsageStats(result: unknown): UsageStats {
  const row = result as Partial<UsageStats> | undefined;

  return {
    totalApiCalls: Number(row?.totalApiCalls ?? 0),
    successfulApiCalls: Number(row?.successfulApiCalls ?? 0),
    failedApiCalls: Number(row?.failedApiCalls ?? 0),
    pendingApiCalls: Number(row?.pendingApiCalls ?? 0),
    totalTokensUsed: Number(row?.totalTokensUsed ?? 0),
    totalCostUsd: Number(row?.totalCostUsd ?? 0),
    averageLatencyMs: Number(row?.averageLatencyMs ?? 0),
  };
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;

  return Math.min(Math.max(Math.floor(value), min), max);
}