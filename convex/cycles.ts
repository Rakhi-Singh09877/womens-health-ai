import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { cycleFields, cycleId } from "./validators";
import { assertResourceOwner } from "./auth";
import { ERROR_MESSAGES } from "./constants";

// Helper function to calculate cycle phase based on day
function calculatePhase(cycleDay: number): "Menstruation" | "Follicular" | "Ovulation" | "Luteal" {
  if (cycleDay <= 5) return "Menstruation";
  if (cycleDay <= 13) return "Follicular";
  if (cycleDay <= 15) return "Ovulation";
  return "Luteal";
}

// Helper function to calculate current cycle day
function calculateCurrentCycleDay(lastPeriodStartDate: number, cycleLength: number): number {
  const now = Date.now();
  const daysSinceStart = Math.floor((now - lastPeriodStartDate) / (1000 * 60 * 60 * 24));
  const currentDay = (daysSinceStart % cycleLength) + 1;
  return Math.max(1, currentDay);
}

// --- Queries ---

/**
 * Get current cycle information for a user
 */
export const getUserCycle = query({
  args: { userId: cycleFields.userId },
  handler: async (ctx, args) => {
    const cycle = await ctx.db
      .query("cycles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!cycle) return null;
    
    // Calculate fresh data
    const currentCycleDay = calculateCurrentCycleDay(cycle.lastPeriodStartDate, cycle.cycleLength);
    const currentPhase = calculatePhase(currentCycleDay);
    
    return {
      ...cycle,
      currentCycleDay,
      currentPhase,
    };
  },
});

/**
 * Get cycle day and phase for dashboard
 */
export const getCycleDayAndPhase = query({
  args: { userId: cycleFields.userId },
  handler: async (ctx, args) => {
    const cycle = await ctx.db
      .query("cycles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!cycle) return { cycleDay: null, phase: null };
    
    const cycleDay = calculateCurrentCycleDay(cycle.lastPeriodStartDate, cycle.cycleLength);
    const phase = calculatePhase(cycleDay);
    
    return { cycleDay, phase };
  },
});

// --- Mutations ---

/**
 * Create or update user cycle
 */
export const createOrUpdateCycle = mutation({
  args: {
    userId: cycleFields.userId,
    lastPeriodStartDate: v.number(),
    cycleLength: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingCycle = await ctx.db
      .query("cycles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    const cycleLength = args.cycleLength ?? 28; // Default 28 days
    const currentCycleDay = calculateCurrentCycleDay(args.lastPeriodStartDate, cycleLength);
    const currentPhase = calculatePhase(currentCycleDay);
    const nextPeriodDate = args.lastPeriodStartDate + (cycleLength * 24 * 60 * 60 * 1000);
    
    if (existingCycle) {
      // Update existing
      await ctx.db.patch(existingCycle._id, {
        lastPeriodStartDate: args.lastPeriodStartDate,
        cycleLength,
        currentCycleDay,
        currentPhase,
        nextPeriodDate,
        updatedAt: Date.now(),
      });
      return existingCycle._id;
    } else {
      // Create new
      return await ctx.db.insert("cycles", {
        userId: args.userId,
        lastPeriodStartDate: args.lastPeriodStartDate,
        cycleLength,
        currentCycleDay,
        currentPhase,
        nextPeriodDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Update cycle length
 */
export const updateCycleLength = mutation({
  args: {
    userId: cycleFields.userId,
    cycleLength: v.number(),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db
      .query("cycles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!cycle) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    const nextPeriodDate = cycle.lastPeriodStartDate + (args.cycleLength * 24 * 60 * 60 * 1000);
    
    await ctx.db.patch(cycle._id, {
      cycleLength: args.cycleLength,
      nextPeriodDate,
      updatedAt: Date.now(),
    });
    
    return cycle._id;
  },
});
