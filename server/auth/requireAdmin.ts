import type { AdminContext, AuthContext } from "../types";
import { forbidden } from "../utils/errors";
import { requireUser, type AuthEvent } from "./requireUser";
import { isAdminUser } from "../services/userService";

export async function requireAdmin(event: AuthEvent): Promise<AdminContext> {
  const auth = await requireUser(event);

  assertAdmin(auth);

  return {
    ...auth,
    user: {
      ...auth.user,
      role: "admin",
    },
  };
}

export function assertAdmin(auth: AuthContext): asserts auth is AdminContext {
  if (!isAdminAuthContext(auth)) {
    throw forbidden("Admin access is required.");
  }
}

export function isAdminAuthContext(auth: AuthContext): auth is AdminContext {
  return isAdminUser({
    clerkUserId: auth.clerkUserId,
    email: auth.user.email,
    role: auth.user.role,
  });
}

export function getAdminAccessInfo(auth: AuthContext): {
  isAdmin: boolean;
  role: AuthContext["user"]["role"];
  clerkUserId: string;
  email: string;
} {
  return {
    isAdmin: isAdminAuthContext(auth),
    role: auth.user.role,
    clerkUserId: auth.clerkUserId,
    email: auth.user.email,
  };
}

export async function requireAdminOrSelf(input: {
  event: AuthEvent;
  targetClerkUserId: string;
}): Promise<AuthContext> {
  const auth = await requireUser(input.event);

  const isSelf = auth.clerkUserId === input.targetClerkUserId;
  const isAdmin = isAdminAuthContext(auth);

  if (!isSelf && !isAdmin) {
    throw forbidden("You can only access your own data unless you are an admin.");
  }

  return auth;
}

export function assertAdminOrSelf(input: {
  auth: AuthContext;
  targetClerkUserId: string;
}): void {
  const isSelf = input.auth.clerkUserId === input.targetClerkUserId;
  const isAdmin = isAdminAuthContext(input.auth);

  if (!isSelf && !isAdmin) {
    throw forbidden("You can only access your own data unless you are an admin.");
  }
}

export function assertCanManageUser(input: {
  auth: AuthContext;
  targetClerkUserId: string;
}): void {
  if (!isAdminAuthContext(input.auth)) {
    throw forbidden("Only admins can manage users.");
  }

  if (input.auth.clerkUserId === input.targetClerkUserId) {
    throw forbidden("Admins cannot perform this management action on themselves.");
  }
}

export function assertCanManageCreation(auth: AuthContext): void {
  if (!isAdminAuthContext(auth)) {
    throw forbidden("Only admins can manage user creations.");
  }
}

export function assertCanViewAdminStats(auth: AuthContext): void {
  if (!isAdminAuthContext(auth)) {
    throw forbidden("Only admins can view platform analytics.");
  }
}