import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { userId, userFields } from "./validators";

// --- Private Validation Helpers ---

async function validateUniqueEmail(
  ctx: QueryCtx | MutationCtx,
  email: string,
  excludeUserId?: Id<"users">,
): Promise<void> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
  if (existing && (!excludeUserId || existing._id !== excludeUserId)) {
    throw new Error(`A user with email ${email} already exists`);
  }
}

async function validateUniquePhone(
  ctx: QueryCtx | MutationCtx,
  phone: string,
  excludeUserId?: Id<"users">,
): Promise<void> {
  const existing = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("phone"), phone))
    .first();
  if (existing && (!excludeUserId || existing._id !== excludeUserId)) {
    throw new Error(`A user with phone ${phone} already exists`);
  }
}

// --- Queries ---

/**
 * Retrieve a user document by ID.
 */
export const getUser = query({
  args: { userId },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Lookup a user by their email address.
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

/**
 * Lookup a user by their phone number.
 */
export const getUserByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("phone"), args.phone))
      .first();
  },
});

/**
 * Search users by name, email, or phone number.
 */
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const term = args.searchTerm.trim().toLowerCase();

    if (!term) {
      return await ctx.db.query("users").take(limit);
    }

    const candidates = await ctx.db.query("users").take(100);
    return candidates
      .filter((user) => {
        return (
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.phone.includes(term)
        );
      })
      .slice(0, limit);
  },
});

// --- Mutations ---

/**
 * Create a new user.
 */
export const createUser = mutation({
  args: {
    name: userFields.name,
    email: userFields.email,
    age: userFields.age,
    phone: userFields.phone,
  },
  handler: async (ctx, args) => {
    await validateUniqueEmail(ctx, args.email);
    await validateUniquePhone(ctx, args.phone);

    const userIdVal = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      age: args.age,
      phone: args.phone,
      createdAt: Date.now(),
    });
    return userIdVal;
  },
});

/**
 * Update an existing user. Keeps user ID and creation time immutable.
 */
export const updateUser = mutation({
  args: {
    userId,
    name: v.optional(userFields.name),
    email: v.optional(userFields.email),
    age: v.optional(userFields.age),
    phone: v.optional(userFields.phone),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updates: Partial<Omit<Doc<"users">, "_id" | "_creationTime">> = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.email !== undefined && args.email !== user.email) {
      await validateUniqueEmail(ctx, args.email, args.userId);
      updates.email = args.email;
    }

    if (args.phone !== undefined && args.phone !== user.phone) {
      await validateUniquePhone(ctx, args.phone, args.userId);
      updates.phone = args.phone;
    }

    if (args.age !== undefined) {
      updates.age = args.age;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch("users", args.userId, updates);
    }

    return args.userId;
  },
});

/**
 * Delete a user.
 */
export const deleteUser = mutation({
  args: { userId },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.delete("users", args.userId);
    return args.userId;
  },
});
