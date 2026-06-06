import { isClipdropConfigured } from "../../server/ai/clipdrop";
import { getDatabaseHealth } from "../../server/db/client";
import { getSafeEnvSummary } from "../../server/env";
import { isCloudinaryConfigured } from "../../server/storage/cloudinary";
import { createGetHandler } from "../../server/utils/handler";
import { success } from "../../server/utils/response";

export const handler = createGetHandler(async () => {
  const startedAt = Date.now();

  const database = await getDatabaseHealth();
  const envSummary = getSafeEnvSummary();

  const services = {
    database: database.status,
    clerk:
      envSummary.hasClerkSecretKey && envSummary.hasClerkWebhookSecret
        ? "configured"
        : "missing_config",
    gemini: envSummary.hasGeminiApiKey ? "configured" : "missing_config",
    clipdrop: isClipdropConfigured() ? "configured" : "missing_config",
    cloudinary: isCloudinaryConfigured() ? "configured" : "missing_config",
  };

  const healthy =
    database.status === "healthy" &&
    services.clerk === "configured" &&
    services.gemini === "configured";

  return success(
    {
      status: healthy ? "healthy" : "degraded",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      services,
      database,
      env: envSummary,
      note:
        "Clipdrop and Cloudinary are only required for premium image tools. Clerk, Gemini, and Database are required for core app functionality.",
    },
    {
      message: healthy
        ? "Health check passed."
        : "Health check completed with warnings.",
    },
  );
});