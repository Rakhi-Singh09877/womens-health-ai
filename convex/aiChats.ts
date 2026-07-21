import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireResourceOwner } from "./auth";
import { aiChatFields, aiChatId } from "./validators";
import { ERROR_MESSAGES } from "./constants";

// --- Private Helpers ---

async function assertUserExists(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"users">> {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }
  return user;
}

// --- Queries ---

/**
 * Retrieve a single AI chat exchange by its ID.
 */
export const getAiChat = query({
  args: { chatId: aiChatId },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

/**
 * List all AI chat exchanges for a user, ordered by creation time ascending (chronological).
 */
export const getAiChatsByUserId = query({
  args: { userId: aiChatFields.userId },
  handler: async (ctx, args) => {
    const chats: Doc<"aiChats">[] = [];
    for await (const chat of ctx.db
      .query("aiChats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))) {
      chats.push(chat);
    }
    chats.sort((a, b) => a.createdAt - b.createdAt);
    return chats;
  },
});

/**
 * Fetch the most recent N AI chat exchanges for a user, oldest-to-newest,
 * intended as context for future AI interactions.
 */
export const getRecentAiChatContext = query({
  args: {
    userId: aiChatFields.userId,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const chats: Doc<"aiChats">[] = [];
    for await (const chat of ctx.db
      .query("aiChats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))) {
      chats.push(chat);
    }
    chats.sort((a, b) => a.createdAt - b.createdAt);
    const n = args.limit ?? 10;
    return chats.slice(-n);
  },
});

// --- Mutations ---

/**
 * Create a new AI chat exchange. Verifies the user exists before inserting.
 */
export const createAiChat = mutation({
  args: {
    userId: aiChatFields.userId,
    prompt: aiChatFields.prompt,
    response: aiChatFields.response,
  },
  handler: async (ctx, args) => {
    await assertUserExists(ctx, args.userId);
    const chatId = await ctx.db.insert("aiChats", {
      userId: args.userId,
      prompt: args.prompt,
      response: args.response,
      createdAt: Date.now(),
    });
    return chatId;
  },
});

/**
 * Delete an AI chat exchange. Verifies ownership before deleting.
 */
export const deleteAiChat = mutation({
  args: { chatId: aiChatId },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.AI_CHAT_NOT_FOUND);
    }

    await requireResourceOwner(ctx, chat.userId);

    await ctx.db.delete("aiChats", args.chatId);
    return args.chatId;
  },
});
