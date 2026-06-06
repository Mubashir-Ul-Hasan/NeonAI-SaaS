import { createClerkClient, verifyToken } from "@clerk/backend";

import { env } from "../env";
import type { AuthContext, AuthenticatedUser, JsonRecord } from "../types";
import { unauthorized } from "../utils/errors";
import { getHeader, type BodyLikeEvent } from "../utils/parseBody";
import {
  getUserByClerkUserId,
  mapUserToAuthenticatedUser,
  upsertUser,
} from "../services/userService";

export type AuthEvent = BodyLikeEvent & {
  headers?: Record<string, string | undefined>;
};

type ClerkSessionClaims = {
  sub?: string;
  email?: string;
  name?: string;
  imageUrl?: string;
  image_url?: string;
  first_name?: string;
  last_name?: string;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type ClerkVerifiedToken = {
  sub?: string;
  sid?: string;
  email?: string;
  claims?: ClerkSessionClaims;
  [key: string]: unknown;
};

const clerkClient = createClerkClient({
  secretKey: env.clerkSecretKey,
});

export async function requireUser(event: AuthEvent): Promise<AuthContext> {
  const token = getBearerToken(event);

  if (!token) {
    throw unauthorized("Missing authentication token.");
  }

  const verifiedToken = await verifyClerkToken(token);
  const clerkUserId = getClerkUserIdFromToken(verifiedToken);

  if (!clerkUserId) {
    throw unauthorized("Invalid Clerk session token.");
  }

  let user = await getUserByClerkUserId(clerkUserId);

  if (!user) {
    const clerkUser = await fetchClerkUser(clerkUserId);

    user = await upsertUser({
      clerkUserId,
      email: clerkUser.email,
      name: clerkUser.name,
      imageUrl: clerkUser.imageUrl,
      metadata: clerkUser.metadata,
    });
  }

  return {
    clerkUserId,
    user: mapUserToAuthenticatedUser(user),
  };
}

export async function getOptionalUser(
  event: AuthEvent,
): Promise<AuthContext | null> {
  const token = getBearerToken(event);

  if (!token) {
    return null;
  }

  try {
    return await requireUser(event);
  } catch {
    return null;
  }
}

export function getBearerToken(event: AuthEvent): string | null {
  const authorizationHeader =
    getHeader(event, "authorization") ||
    getHeader(event, "Authorization") ||
    getHeader(event, "x-clerk-auth-token") ||
    getHeader(event, "X-Clerk-Auth-Token");

  if (!authorizationHeader) {
    return null;
  }

  const cleanHeader = authorizationHeader.trim();

  if (!cleanHeader) {
    return null;
  }

  if (cleanHeader.toLowerCase().startsWith("bearer ")) {
    return cleanHeader.slice(7).trim();
  }

  return cleanHeader;
}

export async function verifyClerkToken(
  token: string,
): Promise<ClerkVerifiedToken> {
  const authorizedParties = Array.from(
    new Set(
      [
        env.clientUrl,
        env.appUrl,
        process.env.URL,
        process.env.DEPLOY_URL,
        "http://localhost:5173",
        "http://localhost:8888",
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.replace(/\/$/, "")),
    ),
  );

  try {
    const verifiedToken = await verifyToken(token, {
      secretKey: env.clerkSecretKey,
      authorizedParties,
      clockSkewInMs: 60_000,
    });

    return verifiedToken as ClerkVerifiedToken;
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          level: "error",
          message: "Clerk token verification failed",
          authorizedParties,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );

    if (env.isDevelopment) {
      try {
        const verifiedToken = await verifyToken(token, {
          secretKey: env.clerkSecretKey,
          clockSkewInMs: 60_000,
        });

        return verifiedToken as ClerkVerifiedToken;
      } catch {
        throw unauthorized("Invalid or expired authentication token.");
      }
    }

    throw unauthorized("Invalid or expired authentication token.");
  }
}

export function getClerkUserIdFromToken(
  token: ClerkVerifiedToken,
): string | null {
  if (typeof token.sub === "string" && token.sub.trim()) {
    return token.sub.trim();
  }

  if (typeof token.claims?.sub === "string" && token.claims.sub.trim()) {
    return token.claims.sub.trim();
  }

  return null;
}

export async function fetchClerkUser(clerkUserId: string): Promise<{
  clerkUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  metadata: JsonRecord;
}> {
  try {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    const primaryEmail =
      clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId,
      ) ?? clerkUser.emailAddresses[0];

    if (!primaryEmail?.emailAddress) {
      throw unauthorized("Authenticated Clerk user has no email address.");
    }

    const name = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      clerkUserId,
      email: primaryEmail.emailAddress.toLowerCase(),
      name: name || null,
      imageUrl: clerkUser.imageUrl || null,
      metadata: {
        ...sanitizeMetadata(clerkUser.publicMetadata),
        ...sanitizeMetadata(clerkUser.privateMetadata),
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("no email")) {
      throw error;
    }

    throw unauthorized("Could not load authenticated Clerk user.");
  }
}

export function assertSameUser(
  auth: AuthContext,
  clerkUserId: string,
): AuthenticatedUser {
  if (auth.clerkUserId !== clerkUserId) {
    throw unauthorized("You can only access your own account.");
  }

  return auth.user;
}

export function getAuthHeaderForFrontend(token: string): {
  Authorization: string;
} {
  return {
    Authorization: `Bearer ${token}`,
  };
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