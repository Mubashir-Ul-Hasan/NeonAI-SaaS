import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import { env } from "../env";
import { db, executeDatabaseOperation } from "../db/client";
import { apiUsageLogs, creations, users, type NewUser, type User } from "../db/schema";
import type {
  AppUser,
  AuthenticatedUser,
  BillingStatus,
  ClerkWebhookUserData,
  JsonRecord,
  UserPlan,
  UserRole,
} from "../types";
import { databaseError, notFound, validationError } from "../utils/errors";
import { validateEmail } from "../utils/validators";

export type UpsertUserInput = {
  clerkUserId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
  plan?: UserPlan;
  role?: UserRole;
  billingStatus?: BillingStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  clerkCustomerId?: string | null;
  clerkSubscriptionId?: string | null;
  metadata?: JsonRecord;
};

export type UpdateUserInput = Partial<
  Pick<
    UpsertUserInput,
    | "email"
    | "name"
    | "imageUrl"
    | "plan"
    | "role"
    | "billingStatus"
    | "stripeCustomerId"
    | "stripeSubscriptionId"
    | "clerkCustomerId"
    | "clerkSubscriptionId"
    | "metadata"
  >
>;

export type UserSummary = {
  user: AuthenticatedUser;
  usage: {
    monthStartedAt: string;
    usedThisMonth: number;
    limit: number;
    remaining: number;
  };
  creations: {
    total: number;
    recentCount: number;
  };
};

export async function getUserById(userId: string): Promise<User | null> {
  return executeDatabaseOperation(async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ?? null;
  }, "Failed to get user by ID.");
}

export async function getUserByClerkUserId(
  clerkUserId: string,
): Promise<User | null> {
  return executeDatabaseOperation(async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    return user ?? null;
  }, "Failed to get user by Clerk user ID.");
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = validateEmail(email);

  return executeDatabaseOperation(async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    return user ?? null;
  }, "Failed to get user by email.");
}

export async function requireUserByClerkUserId(
  clerkUserId: string,
): Promise<User> {
  const user = await getUserByClerkUserId(clerkUserId);

  if (!user) {
    throw notFound("User account was not found.");
  }

  return user;
}

export async function createUser(input: UpsertUserInput): Promise<User> {
  const normalizedInput = normalizeUserInput(input);

  return executeDatabaseOperation(async () => {
    const [createdUser] = await db
      .insert(users)
      .values({
        ...normalizedInput,
        monthlyUsageResetAt: getNextMonthlyResetDate(),
      })
      .returning();

    if (!createdUser) {
      throw databaseError("Failed to create user.");
    }

    return createdUser;
  }, "Failed to create user.");
}

export async function updateUserByClerkUserId(
  clerkUserId: string,
  input: UpdateUserInput,
): Promise<User> {
  const updateValues = normalizeUpdateUserInput(input);

  if (!Object.keys(updateValues).length) {
    return requireUserByClerkUserId(clerkUserId);
  }

  return executeDatabaseOperation(async () => {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateValues,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, clerkUserId))
      .returning();

    if (!updatedUser) {
      throw notFound("User account was not found.");
    }

    return updatedUser;
  }, "Failed to update user.");
}

export async function upsertUser(input: UpsertUserInput): Promise<User> {
  const normalizedInput = normalizeUserInput(input);

  return executeDatabaseOperation(async () => {
    const [upsertedUser] = await db
      .insert(users)
      .values({
        ...normalizedInput,
        monthlyUsageResetAt: getNextMonthlyResetDate(),
      })
      .onConflictDoUpdate({
        target: users.clerkUserId,
        set: {
          email: normalizedInput.email,
          name: normalizedInput.name,
          imageUrl: normalizedInput.imageUrl,
          plan: normalizedInput.plan,
          role: normalizedInput.role,
          billingStatus: normalizedInput.billingStatus,
          stripeCustomerId: normalizedInput.stripeCustomerId,
          stripeSubscriptionId: normalizedInput.stripeSubscriptionId,
          clerkCustomerId: normalizedInput.clerkCustomerId,
          clerkSubscriptionId: normalizedInput.clerkSubscriptionId,
          metadata: normalizedInput.metadata,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!upsertedUser) {
      throw databaseError("Failed to upsert user.");
    }

    return upsertedUser;
  }, "Failed to upsert user.");
}

export async function upsertUserFromClerkWebhookData(
  data: ClerkWebhookUserData,
): Promise<User> {
  const email = getPrimaryEmailFromClerkUser(data);

  if (!email) {
    throw validationError("Clerk user does not have a primary email address.", {
      clerkUserId: data.id,
    });
  }

  const name = getFullName(data.first_name, data.last_name);
  const metadata = getUserMetadataFromClerk(data);
  const plan = getPlanFromMetadata(metadata);
  const role = getRoleFromMetadataOrEnv({
    clerkUserId: data.id,
    email,
    metadata,
  });
  const billingStatus = getBillingStatusFromMetadata(metadata, plan);

  return upsertUser({
    clerkUserId: data.id,
    email,
    name,
    imageUrl: data.image_url ?? null,
    plan,
    role,
    billingStatus,
    stripeCustomerId: getMetadataString(metadata, "stripeCustomerId"),
    stripeSubscriptionId: getMetadataString(metadata, "stripeSubscriptionId"),
    clerkCustomerId: getMetadataString(metadata, "clerkCustomerId"),
    clerkSubscriptionId: getMetadataString(metadata, "clerkSubscriptionId"),
    metadata,
  });
}

export async function deleteUserByClerkUserId(
  clerkUserId: string,
): Promise<boolean> {
  return executeDatabaseOperation(async () => {
    const deletedUsers = await db
      .delete(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .returning({
        id: users.id,
      });

    return deletedUsers.length > 0;
  }, "Failed to delete user.");
}

export async function setUserPlan(
  clerkUserId: string,
  plan: UserPlan,
  billingStatus: BillingStatus = plan === "premium" ? "active" : "free",
): Promise<User> {
  return updateUserByClerkUserId(clerkUserId, {
    plan,
    billingStatus,
  });
}

export async function setUserRole(
  clerkUserId: string,
  role: UserRole,
): Promise<User> {
  return updateUserByClerkUserId(clerkUserId, {
    role,
  });
}

export async function markUserPremium(input: {
  clerkUserId: string;
  billingStatus?: BillingStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  clerkCustomerId?: string | null;
  clerkSubscriptionId?: string | null;
}): Promise<User> {
  return updateUserByClerkUserId(input.clerkUserId, {
    plan: "premium",
    billingStatus: input.billingStatus ?? "active",
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    clerkCustomerId: input.clerkCustomerId,
    clerkSubscriptionId: input.clerkSubscriptionId,
  });
}

export async function markUserFree(clerkUserId: string): Promise<User> {
  return updateUserByClerkUserId(clerkUserId, {
    plan: "free",
    billingStatus: "free",
    stripeSubscriptionId: null,
    clerkSubscriptionId: null,
  });
}

export async function getUserSummary(clerkUserId: string): Promise<UserSummary> {
  const user = await requireUserByClerkUserId(clerkUserId);
  const monthStartedAt = getMonthStartDate();
  const limit = user.plan === "premium" ? env.premiumMonthlyLimit : env.freeMonthlyLimit;

  return executeDatabaseOperation(async () => {
    const [usageResult] = await db
      .select({
        total: count(apiUsageLogs.id),
      })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.clerkUserId, clerkUserId),
          gte(apiUsageLogs.createdAt, monthStartedAt),
        ),
      );

    const [creationTotalResult] = await db
      .select({
        total: count(creations.id),
      })
      .from(creations)
      .where(eq(creations.clerkUserId, clerkUserId));

    const recentStartedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

    const [recentCreationResult] = await db
      .select({
        total: count(creations.id),
      })
      .from(creations)
      .where(
        and(
          eq(creations.clerkUserId, clerkUserId),
          gte(creations.createdAt, recentStartedAt),
        ),
      );

    const usedThisMonth = Number(usageResult?.total ?? 0);

    return {
      user: mapUserToAuthenticatedUser(user),
      usage: {
        monthStartedAt: monthStartedAt.toISOString(),
        usedThisMonth,
        limit,
        remaining: Math.max(limit - usedThisMonth, 0),
      },
      creations: {
        total: Number(creationTotalResult?.total ?? 0),
        recentCount: Number(recentCreationResult?.total ?? 0),
      },
    };
  }, "Failed to get user summary.");
}

export async function listRecentUsers(limit = 10): Promise<User[]> {
  return executeDatabaseOperation(async () => {
    return db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));
  }, "Failed to list recent users.");
}

export async function getUserCounts(): Promise<{
  totalUsers: number;
  premiumUsers: number;
  adminUsers: number;
}> {
  return executeDatabaseOperation(async () => {
    const [totalResult] = await db.select({ total: count(users.id) }).from(users);

    const [premiumResult] = await db
      .select({ total: count(users.id) })
      .from(users)
      .where(eq(users.plan, "premium"));

    const [adminResult] = await db
      .select({ total: count(users.id) })
      .from(users)
      .where(eq(users.role, "admin"));

    return {
      totalUsers: Number(totalResult?.total ?? 0),
      premiumUsers: Number(premiumResult?.total ?? 0),
      adminUsers: Number(adminResult?.total ?? 0),
    };
  }, "Failed to get user counts.");
}

export function mapUserToAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    plan: user.plan,
    role: user.role,
  };
}

export function mapUserToAppUser(user: User): AppUser {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    plan: user.plan,
    role: user.role,
    billingStatus: user.billingStatus,
    stripeCustomerId: user.stripeCustomerId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function isAdminUser(user: Pick<User, "clerkUserId" | "email" | "role">): boolean {
  if (user.role === "admin") return true;

  if (env.adminUserIds.includes(user.clerkUserId)) return true;

  return env.adminEmails.includes(user.email.toLowerCase());
}

export function isPremiumUser(user: Pick<User, "plan">): boolean {
  return user.plan === "premium";
}

export function getPrimaryEmailFromClerkUser(
  data: ClerkWebhookUserData,
): string | null {
  const primaryEmail = data.email_addresses?.find(
    (email) => email.id === data.primary_email_address_id,
  );

  const fallbackEmail = data.email_addresses?.[0];

  const email = primaryEmail?.email_address ?? fallbackEmail?.email_address;

  return email ? validateEmail(email) : null;
}

export function getFullName(
  firstName?: string | null,
  lastName?: string | null,
): string | null {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();

  return name || null;
}

export function getMonthStartDate(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
}

export function getNextMonthlyResetDate(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0),
  );
}

function normalizeUserInput(input: UpsertUserInput): NewUser {
  const email = validateEmail(input.email);
  const metadata = sanitizeMetadata(input.metadata);

  return {
    clerkUserId: requireNonEmpty(input.clerkUserId, "Clerk user ID"),
    email,
    name: input.name?.trim() || null,
    imageUrl: input.imageUrl?.trim() || null,
    plan: input.plan ?? getPlanFromMetadata(metadata),
    role:
      input.role ??
      getRoleFromMetadataOrEnv({
        clerkUserId: input.clerkUserId,
        email,
        metadata,
      }),
    billingStatus:
      input.billingStatus ??
      getBillingStatusFromMetadata(metadata, input.plan ?? "free"),
    stripeCustomerId: input.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    clerkCustomerId: input.clerkCustomerId ?? null,
    clerkSubscriptionId: input.clerkSubscriptionId ?? null,
    metadata,
  };
}

function normalizeUpdateUserInput(input: UpdateUserInput): Partial<NewUser> {
  const updateValues: Partial<NewUser> = {};

  if (input.email !== undefined) {
    updateValues.email = validateEmail(input.email);
  }

  if (input.name !== undefined) {
    updateValues.name = input.name?.trim() || null;
  }

  if (input.imageUrl !== undefined) {
    updateValues.imageUrl = input.imageUrl?.trim() || null;
  }

  if (input.plan !== undefined) {
    updateValues.plan = input.plan;
  }

  if (input.role !== undefined) {
    updateValues.role = input.role;
  }

  if (input.billingStatus !== undefined) {
    updateValues.billingStatus = input.billingStatus;
  }

  if (input.stripeCustomerId !== undefined) {
    updateValues.stripeCustomerId = input.stripeCustomerId;
  }

  if (input.stripeSubscriptionId !== undefined) {
    updateValues.stripeSubscriptionId = input.stripeSubscriptionId;
  }

  if (input.clerkCustomerId !== undefined) {
    updateValues.clerkCustomerId = input.clerkCustomerId;
  }

  if (input.clerkSubscriptionId !== undefined) {
    updateValues.clerkSubscriptionId = input.clerkSubscriptionId;
  }

  if (input.metadata !== undefined) {
    updateValues.metadata = sanitizeMetadata(input.metadata);
  }

  return updateValues;
}

function getUserMetadataFromClerk(data: ClerkWebhookUserData): JsonRecord {
  return {
    ...sanitizeMetadata(data.public_metadata),
    ...sanitizeMetadata(data.private_metadata),
  };
}

function getPlanFromMetadata(metadata: JsonRecord): UserPlan {
  const plan = metadata.plan;

  return plan === "premium" ? "premium" : "free";
}

function getRoleFromMetadataOrEnv({
  clerkUserId,
  email,
  metadata,
}: {
  clerkUserId: string;
  email: string;
  metadata: JsonRecord;
}): UserRole {
  if (metadata.role === "admin") return "admin";

  if (env.adminUserIds.includes(clerkUserId)) return "admin";

  if (env.adminEmails.includes(email.toLowerCase())) return "admin";

  return "user";
}

function getBillingStatusFromMetadata(
  metadata: JsonRecord,
  fallbackPlan: UserPlan,
): BillingStatus {
  const status = metadata.billingStatus;

  if (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "cancelled" ||
    status === "incomplete" ||
    status === "free"
  ) {
    return status;
  }

  return fallbackPlan === "premium" ? "active" : "free";
}

function getMetadataString(
  metadata: JsonRecord,
  key: string,
): string | null {
  const value = metadata[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sanitizeMetadata(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const metadata: JsonRecord = {};

  for (const [key, item] of Object.entries(value)) {
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    ) {
      metadata[key] = item;
    }
  }

  return metadata;
}

function requireNonEmpty(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw validationError(`${fieldName} is required.`);
  }

  return normalizedValue;
}