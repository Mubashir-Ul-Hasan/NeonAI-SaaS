import { Webhook } from "svix";
import { eq } from "drizzle-orm";

import { env } from "../../server/env";
import { db, executeDatabaseOperation } from "../../server/db/client";
import { webhookEvents } from "../../server/db/schema";
import type {
  ClerkWebhookPayload,
  ClerkWebhookUserData,
  JsonRecord,
  JsonValue,
} from "../../server/types";
import {
  deleteUserByClerkUserId,
  upsertUserFromClerkWebhookData,
} from "../../server/services/userService";
import { webhookError } from "../../server/utils/errors";
import { createPostHandler } from "../../server/utils/handler";
import { getHeader, parseTextBody } from "../../server/utils/parseBody";
import { success } from "../../server/utils/response";

type SvixHeaders = {
  "svix-id": string;
  "svix-timestamp": string;
  "svix-signature": string;
};

export const handler = createPostHandler(
  async ({ event }) => {
    const rawBody = parseTextBody(event);
    const svixHeaders = getSvixHeaders(event);

    const payload = verifyClerkWebhook(rawBody, svixHeaders);
    const eventId = svixHeaders["svix-id"];

    const insertedEvent = await insertWebhookEvent({
      eventId,
      eventType: payload.type,
      payload: toJsonRecord(payload),
    });

    if (!insertedEvent.created) {
      return success(
        {
          duplicate: true,
          eventId,
          eventType: payload.type,
        },
        {
          message: "Webhook event already processed.",
        },
      );
    }

    try {
      const result = await processClerkWebhook(payload);

      await markWebhookProcessed(eventId);

      return success(
        {
          eventId,
          eventType: payload.type,
          result,
        },
        {
          message: "Clerk webhook processed successfully.",
        },
      );
    } catch (error) {
      await markWebhookFailed(eventId, error);

      throw error;
    }
  },
  {
    cors: false,
  },
);

function getSvixHeaders(event: Parameters<typeof getHeader>[0]): SvixHeaders {
  const svixId = getHeader(event, "svix-id");
  const svixTimestamp = getHeader(event, "svix-timestamp");
  const svixSignature = getHeader(event, "svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw webhookError("Missing required Svix webhook headers.", {
      hasSvixId: Boolean(svixId),
      hasSvixTimestamp: Boolean(svixTimestamp),
      hasSvixSignature: Boolean(svixSignature),
    });
  }

  return {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  };
}

function verifyClerkWebhook(
  rawBody: string,
  headers: SvixHeaders,
): ClerkWebhookPayload {
  try {
    const webhook = new Webhook(env.clerkWebhookSecret);
    const verifiedPayload = webhook.verify(rawBody, headers) as unknown;

    if (!isClerkWebhookPayload(verifiedPayload)) {
      throw new Error("Webhook payload shape is invalid.");
    }

    return verifiedPayload;
  } catch (error) {
    throw webhookError("Invalid Clerk webhook signature or payload.", error);
  }
}

async function processClerkWebhook(payload: ClerkWebhookPayload): Promise<{
  action: string;
  clerkUserId?: string;
}> {
  switch (payload.type) {
    case "user.created":
    case "user.updated": {
      const user = await upsertUserFromClerkWebhookData(payload.data);

      return {
        action: payload.type === "user.created" ? "user_upserted" : "user_updated",
        clerkUserId: user.clerkUserId,
      };
    }

    case "user.deleted": {
      const clerkUserId = payload.data.id;
      const deleted = await deleteUserByClerkUserId(clerkUserId);

      return {
        action: deleted ? "user_deleted" : "user_not_found",
        clerkUserId,
      };
    }

    default:
      return {
        action: "ignored",
        clerkUserId: payload.data?.id,
      };
  }
}

async function insertWebhookEvent(input: {
  eventId: string;
  eventType: string;
  payload: JsonRecord;
}): Promise<{
  created: boolean;
}> {
  return executeDatabaseOperation(async () => {
    const insertedRows = await db
      .insert(webhookEvents)
      .values({
        provider: "clerk",
        eventId: input.eventId,
        eventType: input.eventType,
        status: "received",
        payload: input.payload,
      })
      .onConflictDoNothing({
        target: webhookEvents.eventId,
      })
      .returning({
        id: webhookEvents.id,
      });

    return {
      created: insertedRows.length > 0,
    };
  }, "Failed to insert webhook event.");
}

async function markWebhookProcessed(eventId: string): Promise<void> {
  await executeDatabaseOperation(async () => {
    await db
      .update(webhookEvents)
      .set({
        status: "processed",
        processedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(webhookEvents.eventId, eventId));
  }, "Failed to mark webhook as processed.");
}

async function markWebhookFailed(eventId: string, error: unknown): Promise<void> {
  const message =
    error instanceof Error ? error.message : "Unknown webhook processing error.";

  await executeDatabaseOperation(async () => {
    await db
      .update(webhookEvents)
      .set({
        status: "failed",
        errorMessage: message,
      })
      .where(eq(webhookEvents.eventId, eventId));
  }, "Failed to mark webhook as failed.");
}

function isClerkWebhookPayload(value: unknown): value is ClerkWebhookPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const payload = value as Partial<ClerkWebhookPayload>;

  return typeof payload.type === "string" && isClerkWebhookUserData(payload.data);
}

function isClerkWebhookUserData(value: unknown): value is ClerkWebhookUserData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const data = value as Partial<ClerkWebhookUserData>;

  return typeof data.id === "string" && data.id.trim().length > 0;
}

function toJsonRecord(value: unknown): JsonRecord {
  const jsonValue = toJsonValue(value);

  if (jsonValue && typeof jsonValue === "object" && !Array.isArray(jsonValue)) {
    return jsonValue;
  }

  return {};
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item));
  }

  if (value && typeof value === "object") {
    const record: JsonRecord = {};

    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) {
        record[key] = toJsonValue(item);
      }
    }

    return record;
  }

  return null;
}