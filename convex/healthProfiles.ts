import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { healthProfileFields, healthProfileId } from "./validators";
import { assertResourceOwner } from "./auth";
import { ERROR_MESSAGES } from "./constants";

// --- Queries ---

/**
 * Retrieve a health profile by its ID.
 */
export const getHealthProfile = query({
  args: { profileId: healthProfileId },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

/**
 * Retrieve a health profile by user ID.
 */
export const getHealthProfileByUserId = query({
  args: { userId: healthProfileFields.userId },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("healthProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

// --- Mutations ---

/**
 * Create a health profile for a user.
 * Enforces user existence and 1-to-1 profile constraint.
 */
export const createHealthProfile = mutation({
  args: {
    userId: healthProfileFields.userId,
    bloodGroup: healthProfileFields.bloodGroup,
    allergies: healthProfileFields.allergies,
    chronicConditions: healthProfileFields.chronicConditions,
    medications: healthProfileFields.medications,
    emergencyContact: healthProfileFields.emergencyContact,
  },
  handler: async (ctx, args) => {
    // 1. Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // 2. Verify no profile exists for this user (1-to-1 constraint)
    const existing = await ctx.db
      .query("healthProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) {
      throw new Error(ERROR_MESSAGES.HEALTH_PROFILE_ALREADY_EXISTS);
    }

    const profileId = await ctx.db.insert("healthProfiles", {
      userId: args.userId,
      bloodGroup: args.bloodGroup,
      allergies: args.allergies,
      chronicConditions: args.chronicConditions,
      medications: args.medications,
      emergencyContact: args.emergencyContact,
    });
    return profileId;
  },
});

/**
 * Update an existing health profile. Keeps userId, ID, and creation time immutable.
 */
export const updateHealthProfile = mutation({
  args: {
    profileId: healthProfileId,
    callerId: healthProfileFields.userId,
    bloodGroup: v.optional(healthProfileFields.bloodGroup),
    allergies: v.optional(healthProfileFields.allergies),
    chronicConditions: v.optional(healthProfileFields.chronicConditions),
    medications: v.optional(healthProfileFields.medications),
    emergencyContact: v.optional(healthProfileFields.emergencyContact),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error(ERROR_MESSAGES.HEALTH_PROFILE_NOT_FOUND);
    }

    assertResourceOwner(args.callerId, profile.userId);

    const updates: Partial<Omit<Doc<"healthProfiles">, "_id" | "_creationTime" | "userId">> = {};

    if (args.bloodGroup !== undefined) {
      updates.bloodGroup = args.bloodGroup;
    }
    if (args.allergies !== undefined) {
      updates.allergies = args.allergies;
    }
    if (args.chronicConditions !== undefined) {
      updates.chronicConditions = args.chronicConditions;
    }
    if (args.medications !== undefined) {
      updates.medications = args.medications;
    }
    if (args.emergencyContact !== undefined) {
      updates.emergencyContact = args.emergencyContact;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch("healthProfiles", args.profileId, updates);
    }

    return args.profileId;
  },
});

/**
 * Delete a health profile by ID.
 */
export const deleteHealthProfile = mutation({
  args: { profileId: healthProfileId, callerId: healthProfileFields.userId },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error(ERROR_MESSAGES.HEALTH_PROFILE_NOT_FOUND);
    }

    assertResourceOwner(args.callerId, profile.userId);

    await ctx.db.delete("healthProfiles", args.profileId);
    return args.profileId;
  },
});
