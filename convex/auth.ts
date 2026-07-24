import type { UserIdentity } from "convex/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export type AuthCtx = QueryCtx | MutationCtx;

export const ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export type SessionInfo = {
  tokenIdentifier: string;
  subject: string;
  email: string | undefined;
  name: string | undefined;
};

// --- Session helpers ---

export async function getIdentity(
  ctx: AuthCtx,
): Promise<UserIdentity | null> {
  return await ctx.auth.getUserIdentity();
}

export async function requireIdentity(ctx: AuthCtx): Promise<UserIdentity> {
  const identity = await getIdentity(ctx);
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export function getSessionInfo(identity: UserIdentity): SessionInfo {
  return {
    tokenIdentifier: identity.tokenIdentifier,
    subject: identity.subject,
    email: identity.email,
    name: identity.name,
  };
}

// --- Current user helpers ---

export async function getCurrentUser(
  ctx: AuthCtx,
): Promise<Doc<"users"> | null> {
  const identity = await getIdentity(ctx);
  if (!identity?.email) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .unique();
}

export async function requireCurrentUser(ctx: AuthCtx): Promise<Doc<"users">> {
  const identity = await requireIdentity(ctx);
  if (!identity.email) {
    throw new Error("User not found");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getCurrentUserId(
  ctx: AuthCtx,
): Promise<Id<"users"> | null> {
  const user = await getCurrentUser(ctx);
  return user?._id ?? null;
}

export async function requireCurrentUserId(ctx: AuthCtx): Promise<Id<"users">> {
  const user = await requireCurrentUser(ctx);
  return user._id;
}

// --- Authorization / role helpers ---

export function getUserRole(user: Doc<"users">): UserRole {
  void user;
  return ROLES.USER;
}

export function hasRole(user: Doc<"users">, role: UserRole): boolean {
  return getUserRole(user) === role;
}

export async function requireRole(
  ctx: AuthCtx,
  role: UserRole,
): Promise<Doc<"users">> {
  const user = await requireCurrentUser(ctx);
  if (!hasRole(user, role)) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function assertResourceOwner(
  userId: Id<"users">,
  resourceUserId: Id<"users">,
): void {
  if (userId !== resourceUserId) {
    throw new Error("Unauthorized");
  }
}

export async function requireResourceOwner(
  ctx: AuthCtx,
  resourceUserId: Id<"users">,
): Promise<Doc<"users">> {
  const user = await requireCurrentUser(ctx);
  assertResourceOwner(user._id, resourceUserId);
  return user;
}
