/// <reference types="node" />

type AppEnv = "development" | "production" | "test";

type ServerEnv = {
  nodeEnv: AppEnv;
  isDevelopment: boolean;
  isProduction: boolean;

  appUrl: string;
  clientUrl: string;

  databaseUrl: string;

  clerkSecretKey: string;
  clerkWebhookSecret: string;
  clerkPublishableKey?: string;

  geminiApiKey: string;

  clipdropApiKey?: string;

  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;

  adminUserIds: string[];
  adminEmails: string[];

  maxUploadSizeMb: number;
  freeMonthlyLimit: number;
  premiumMonthlyLimit: number;
};

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim();
}

function requireEnv(name: string): string {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readNumberEnv(name: string, fallback: number): number {
  const value = readEnv(name);

  if (!value) return fallback;

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }

  return parsedValue;
}

function readListEnv(name: string): string[] {
  const value = readEnv(name);

  if (!value) return [];

  return value
    .split(",")
    .map((item: string) => item.trim())
    .filter((item: string) => Boolean(item));
}

function normalizeNodeEnv(value: string | undefined): AppEnv {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

const nodeEnv = normalizeNodeEnv(process.env.NODE_ENV);

const fallbackAppUrl =
  readEnv("URL") ||
  readEnv("DEPLOY_URL") ||
  readEnv("VITE_APP_URL") ||
  "http://localhost:5173";

export const env: ServerEnv = {
  nodeEnv,
  isDevelopment: nodeEnv === "development",
  isProduction: nodeEnv === "production",

  appUrl: readEnv("APP_URL") || fallbackAppUrl,
  clientUrl: readEnv("CLIENT_URL") || fallbackAppUrl,

  databaseUrl: requireEnv("DATABASE_URL"),

  clerkSecretKey: requireEnv("CLERK_SECRET_KEY"),
  clerkWebhookSecret: requireEnv("CLERK_WEBHOOK_SECRET"),
  clerkPublishableKey: readEnv("VITE_CLERK_PUBLISHABLE_KEY"),

  geminiApiKey: requireEnv("GEMINI_API_KEY"),

  clipdropApiKey: readEnv("CLIPDROP_API_KEY"),

  cloudinaryCloudName: readEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: readEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: readEnv("CLOUDINARY_API_SECRET"),

  adminUserIds: readListEnv("ADMIN_USER_IDS"),
  adminEmails: readListEnv("ADMIN_EMAILS").map((email: string) =>
    email.toLowerCase(),
  ),

  maxUploadSizeMb: readNumberEnv("MAX_UPLOAD_SIZE_MB", 10),
  freeMonthlyLimit: readNumberEnv("FREE_MONTHLY_LIMIT", 20),
  premiumMonthlyLimit: readNumberEnv("PREMIUM_MONTHLY_LIMIT", 500),
};

export function requireClipdropEnv() {
  if (!env.clipdropApiKey) {
    throw new Error("Missing required environment variable: CLIPDROP_API_KEY");
  }

  return {
    clipdropApiKey: env.clipdropApiKey,
  };
}

export function requireCloudinaryEnv() {
  if (!env.cloudinaryCloudName) {
    throw new Error("Missing required environment variable: CLOUDINARY_CLOUD_NAME");
  }

  if (!env.cloudinaryApiKey) {
    throw new Error("Missing required environment variable: CLOUDINARY_API_KEY");
  }

  if (!env.cloudinaryApiSecret) {
    throw new Error("Missing required environment variable: CLOUDINARY_API_SECRET");
  }

  return {
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
    apiSecret: env.cloudinaryApiSecret,
  };
}

export function getSafeEnvSummary() {
  return {
    nodeEnv: env.nodeEnv,
    appUrl: env.appUrl,
    clientUrl: env.clientUrl,
    hasDatabaseUrl: Boolean(env.databaseUrl),
    hasClerkSecretKey: Boolean(env.clerkSecretKey),
    hasClerkWebhookSecret: Boolean(env.clerkWebhookSecret),
    hasGeminiApiKey: Boolean(env.geminiApiKey),
    hasClipdropApiKey: Boolean(env.clipdropApiKey),
    hasCloudinaryConfig: Boolean(
      env.cloudinaryCloudName &&
        env.cloudinaryApiKey &&
        env.cloudinaryApiSecret,
    ),
    adminUserIdsCount: env.adminUserIds.length,
    adminEmailsCount: env.adminEmails.length,
    maxUploadSizeMb: env.maxUploadSizeMb,
    freeMonthlyLimit: env.freeMonthlyLimit,
    premiumMonthlyLimit: env.premiumMonthlyLimit,
  };
}