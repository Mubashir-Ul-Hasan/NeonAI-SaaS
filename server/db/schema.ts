import { relations, sql, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { JsonRecord } from "../types";

export const userPlanEnum = pgEnum("user_plan", ["free", "premium"]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const billingStatusEnum = pgEnum("billing_status", [
  "free",
  "active",
  "trialing",
  "past_due",
  "cancelled",
  "incomplete",
]);

export const toolTypeEnum = pgEnum("tool_type", [
  "article",
  "blog-title",
  "image",
  "background-removal",
  "object-removal",
  "resume-review",
]);

export const creationStatusEnum = pgEnum("creation_status", [
  "processing",
  "completed",
  "failed",
]);

export const apiUsageStatusEnum = pgEnum("api_usage_status", [
  "success",
  "failed",
  "pending",
]);

export const apiProviderEnum = pgEnum("api_provider", [
  "gemini",
  "clipdrop",
  "cloudinary",
  "resume-reviewer",
  "system",
]);

export const webhookStatusEnum = pgEnum("webhook_status", [
  "received",
  "processed",
  "failed",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    imageUrl: text("image_url"),

    plan: userPlanEnum("plan").notNull().default("free"),
    role: userRoleEnum("role").notNull().default("user"),
    billingStatus: billingStatusEnum("billing_status").notNull().default("free"),

    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),

    clerkCustomerId: text("clerk_customer_id"),
    clerkSubscriptionId: text("clerk_subscription_id"),

    subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end", {
      withTimezone: true,
    }),

    monthlyUsageResetAt: timestamp("monthly_usage_reset_at", {
      withTimezone: true,
    }),

    metadata: jsonb("metadata").$type<JsonRecord>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    clerkUserIdIdx: uniqueIndex("users_clerk_user_id_idx").on(table.clerkUserId),
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    planIdx: index("users_plan_idx").on(table.plan),
    roleIdx: index("users_role_idx").on(table.role),
    billingStatusIdx: index("users_billing_status_idx").on(table.billingStatus),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  }),
);

export const creations = pgTable(
  "creations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    clerkUserId: text("clerk_user_id").notNull(),

    toolType: toolTypeEnum("tool_type").notNull(),

    prompt: text("prompt").notNull(),

    resultText: text("result_text"),
    resultImageUrl: text("result_image_url"),
    cloudinaryPublicId: text("cloudinary_public_id"),

    status: creationStatusEnum("status").notNull().default("completed"),

    isFavorite: boolean("is_favorite").notNull().default(false),

    metadata: jsonb("metadata").$type<JsonRecord>().notNull().default({}),

    errorMessage: text("error_message"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("creations_user_id_idx").on(table.userId),
    clerkUserIdIdx: index("creations_clerk_user_id_idx").on(table.clerkUserId),
    toolTypeIdx: index("creations_tool_type_idx").on(table.toolType),
    statusIdx: index("creations_status_idx").on(table.status),
    favoriteIdx: index("creations_favorite_idx").on(table.isFavorite),
    createdAtIdx: index("creations_created_at_idx").on(table.createdAt),
    searchIdx: index("creations_prompt_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.prompt})`,
    ),
  }),
);

export const apiUsageLogs = pgTable(
  "api_usage_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    clerkUserId: text("clerk_user_id"),

    creationId: uuid("creation_id").references(() => creations.id, {
      onDelete: "set null",
    }),

    toolType: toolTypeEnum("tool_type"),

    provider: apiProviderEnum("provider").notNull(),

    status: apiUsageStatusEnum("status").notNull(),

    tokensUsed: integer("tokens_used").notNull().default(0),

    costUsd: doublePrecision("cost_usd").notNull().default(0),

    latencyMs: integer("latency_ms").notNull().default(0),

    errorMessage: text("error_message"),

    metadata: jsonb("metadata").$type<JsonRecord>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("api_usage_logs_user_id_idx").on(table.userId),
    clerkUserIdIdx: index("api_usage_logs_clerk_user_id_idx").on(table.clerkUserId),
    creationIdIdx: index("api_usage_logs_creation_id_idx").on(table.creationId),
    toolTypeIdx: index("api_usage_logs_tool_type_idx").on(table.toolType),
    providerIdx: index("api_usage_logs_provider_idx").on(table.provider),
    statusIdx: index("api_usage_logs_status_idx").on(table.status),
    createdAtIdx: index("api_usage_logs_created_at_idx").on(table.createdAt),
    monthlyUsageIdx: index("api_usage_logs_monthly_usage_idx").on(
      table.clerkUserId,
      table.createdAt,
    ),
  }),
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    provider: text("provider").notNull().default("clerk"),

    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),

    status: webhookStatusEnum("status").notNull().default("received"),

    payload: jsonb("payload").$type<JsonRecord>().notNull().default({}),

    errorMessage: text("error_message"),

    processedAt: timestamp("processed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventIdIdx: uniqueIndex("webhook_events_event_id_idx").on(table.eventId),
    eventTypeIdx: index("webhook_events_event_type_idx").on(table.eventType),
    statusIdx: index("webhook_events_status_idx").on(table.status),
    createdAtIdx: index("webhook_events_created_at_idx").on(table.createdAt),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  creations: many(creations),
  apiUsageLogs: many(apiUsageLogs),
}));

export const creationsRelations = relations(creations, ({ one, many }) => ({
  user: one(users, {
    fields: [creations.userId],
    references: [users.id],
  }),
  apiUsageLogs: many(apiUsageLogs),
}));

export const apiUsageLogsRelations = relations(apiUsageLogs, ({ one }) => ({
  user: one(users, {
    fields: [apiUsageLogs.userId],
    references: [users.id],
  }),
  creation: one(creations, {
    fields: [apiUsageLogs.creationId],
    references: [creations.id],
  }),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Creation = InferSelectModel<typeof creations>;
export type NewCreation = InferInsertModel<typeof creations>;

export type ApiUsageLog = InferSelectModel<typeof apiUsageLogs>;
export type NewApiUsageLog = InferInsertModel<typeof apiUsageLogs>;

export type WebhookEvent = InferSelectModel<typeof webhookEvents>;
export type NewWebhookEvent = InferInsertModel<typeof webhookEvents>;

export const schema = {
  users,
  creations,
  apiUsageLogs,
  webhookEvents,

  userPlanEnum,
  userRoleEnum,
  billingStatusEnum,
  toolTypeEnum,
  creationStatusEnum,
  apiUsageStatusEnum,
  apiProviderEnum,
  webhookStatusEnum,

  usersRelations,
  creationsRelations,
  apiUsageLogsRelations,
};