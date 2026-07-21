import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireResourceOwner } from "./auth";
import { healthRecordFields } from "./validators";

// --- Private Helpers ---

async function assertUserExists(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"users">> {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

// --- Queries ---

/**
 * Retrieve a health record by its ID.
 */
export const getHealthRecord = query({
  args: { recordId: v.id("healthRecords") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.recordId);
  },
});

/**
 * List all health records for a user, ordered by upload date descending.
 */
export const getHealthRecordsByUserId = query({
  args: { userId: healthRecordFields.userId },
  handler: async (ctx, args) => {
    const records: Doc<"healthRecords">[] = [];
    for await (const record of ctx.db
      .query("healthRecords")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))) {
      records.push(record);
    }
    records.sort((a, b) => b.uploadedAt - a.uploadedAt);
    return records;
  },
});

/**
 * Search health records by title for a specific user.
 * Performs a case-insensitive partial match, scoped to the given userId.
 */
export const searchHealthRecordsByTitle = query({
  args: {
    userId: healthRecordFields.userId,
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const lowerSearch = args.searchTerm.toLowerCase();
    const matches: Doc<"healthRecords">[] = [];
    for await (const record of ctx.db
      .query("healthRecords")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))) {
      if (record.title.toLowerCase().includes(lowerSearch)) {
        matches.push(record);
      }
    }
    matches.sort((a, b) => b.uploadedAt - a.uploadedAt);
    return matches;
  },
});

// --- Mutations ---

/**
 * Create a new health record. Verifies the user exists before inserting.
 */
export const createHealthRecord = mutation({
  args: {
    userId: healthRecordFields.userId,
    title: healthRecordFields.title,
    fileUrl: healthRecordFields.fileUrl,
  },
  handler: async (ctx, args) => {
    await assertUserExists(ctx, args.userId);
    const recordId = await ctx.db.insert("healthRecords", {
      userId: args.userId,
      title: args.title,
      fileUrl: args.fileUrl,
      uploadedAt: Date.now(),
    });
    return recordId;
  },
});

/**
 * Update a health record. Verifies ownership before applying the patch.
 * userId and uploadedAt are immutable.
 */
export const updateHealthRecord = mutation({
  args: {
    recordId: v.id("healthRecords"),
    title: v.optional(healthRecordFields.title),
    fileUrl: v.optional(healthRecordFields.fileUrl),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new Error("Health record not found");
    }

    await requireResourceOwner(ctx, record.userId);

    const updates: Partial<
      Omit<Doc<"healthRecords">, "_id" | "_creationTime" | "userId" | "uploadedAt">
    > = {};

    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.fileUrl !== undefined) {
      updates.fileUrl = args.fileUrl;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch("healthRecords", args.recordId, updates);
    }

    return args.recordId;
  },
});

/**
 * Delete a health record. Verifies ownership before deleting.
 */
export const deleteHealthRecord = mutation({
  args: { recordId: v.id("healthRecords") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new Error("Health record not found");
    }

    await requireResourceOwner(ctx, record.userId);

    await ctx.db.delete("healthRecords", args.recordId);
    return args.recordId;
  },
});
