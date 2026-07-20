import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { symptomLogFields } from "./validators";

type SymptomLogOrder = "asc" | "desc";

type SymptomLogFilterArgs = {
	userId: Id<"users">;
	symptom?: string;
	minSeverity?: number;
	maxSeverity?: number;
	startDate?: number;
	endDate?: number;
	limit?: number;
	order?: SymptomLogOrder;
};

type SymptomLogCreateArgs = {
	userId: Id<"users">;
	symptom: string;
	severity: number;
	notes: string;
};

async function assertUserExists(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
	const user = await ctx.db.get(userId);
	if (!user) {
		throw new Error("Cannot create symptom log: user does not exist");
	}

	return user;
}

function assertValidMonth(month: number) {
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		throw new Error("Month must be an integer between 1 and 12");
	}
}

async function assertNoDuplicateSymptomLog(
	ctx: QueryCtx,
	args: SymptomLogCreateArgs,
	createdAt: number,
) {
	const bounds = getDayBounds(createdAt);
	const duplicate = await ctx.db
		.query("symptomLogs")
		.withIndex("by_userId", (q) => q.eq("userId", args.userId))
		.filter((q) => q.eq(q.field("symptom"), args.symptom))
		.filter((q) => q.gte(q.field("createdAt"), bounds.start))
		.filter((q) => q.lt(q.field("createdAt"), bounds.end))
		.first();

	if (duplicate) {
		throw new Error("A symptom log for this user, symptom, and day already exists");
	}
}

function sortSymptomLogs(logs: Doc<"symptomLogs">[], order: SymptomLogOrder) {
	return [...logs].sort((left, right) => {
		if (left.createdAt !== right.createdAt) {
			return order === "asc"
				? left.createdAt - right.createdAt
				: right.createdAt - left.createdAt;
		}

		return order === "asc"
			? left._creationTime - right._creationTime
			: right._creationTime - left._creationTime;
	});
}

function getDayBounds(timestamp: number) {
	const date = new Date(timestamp);
	const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	return {
		start,
		end: start + 24 * 60 * 60 * 1000,
	};
}

function getMonthBounds(year: number, month: number) {
	const start = Date.UTC(year, month - 1, 1);
	const end = Date.UTC(year, month, 1);
	return { start, end };
}

async function collectFilteredSymptomLogs(
	ctx: QueryCtx,
	args: SymptomLogFilterArgs,
) {
	let logsQuery = ctx.db
		.query("symptomLogs")
		.withIndex("by_userId", (q) => q.eq("userId", args.userId));

	if (args.symptom !== undefined) {
		logsQuery = logsQuery.filter((q) => q.eq(q.field("symptom"), args.symptom));
	}

	if (args.minSeverity !== undefined) {
		const minSeverity = args.minSeverity;
		logsQuery = logsQuery.filter((q) => q.gte(q.field("severity"), minSeverity));
	}

	if (args.maxSeverity !== undefined) {
		const maxSeverity = args.maxSeverity;
		logsQuery = logsQuery.filter((q) => q.lte(q.field("severity"), maxSeverity));
	}

	if (args.startDate !== undefined) {
		const startDate = args.startDate;
		logsQuery = logsQuery.filter((q) => q.gte(q.field("createdAt"), startDate));
	}

	if (args.endDate !== undefined) {
		const endDate = args.endDate;
		logsQuery = logsQuery.filter((q) => q.lt(q.field("createdAt"), endDate));
	}

	const logs: Doc<"symptomLogs">[] = [];
	for await (const log of logsQuery) {
		logs.push(log);
	}

	const sortedLogs = sortSymptomLogs(logs, args.order ?? "desc");
	return args.limit === undefined ? sortedLogs : sortedLogs.slice(0, args.limit);
}

function getSeveritySummary(logs: Doc<"symptomLogs">[]) {
	if (logs.length === 0) {
		return {
			totalLogs: 0,
			averageSeverity: null as number | null,
			minSeverity: null as number | null,
			maxSeverity: null as number | null,
			severityCounts: {} as Record<number, number>,
		};
	}

	let totalSeverity = 0;
	let minSeverity = logs[0].severity;
	let maxSeverity = logs[0].severity;
	const severityCounts: Record<number, number> = {};

	for (const log of logs) {
		totalSeverity += log.severity;
		minSeverity = Math.min(minSeverity, log.severity);
		maxSeverity = Math.max(maxSeverity, log.severity);
		severityCounts[log.severity] = (severityCounts[log.severity] ?? 0) + 1;
	}

	return {
		totalLogs: logs.length,
		averageSeverity: totalSeverity / logs.length,
		minSeverity,
		maxSeverity,
		severityCounts,
	};
}

// --- Queries ---

/**
 * Retrieve a symptom log by ID.
 */
export const getSymptomLog = query({
	args: { symptomLogId: v.id("symptomLogs") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.symptomLogId);
	},
});

/**
 * Retrieve symptom logs for a user in chronological order.
 */
export const listSymptomLogs = query({
	args: {
		userId: symptomLogFields.userId,
		limit: v.optional(v.number()),
		order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
	},
	handler: async (ctx, args) => {
		return await collectFilteredSymptomLogs(ctx, {
			userId: args.userId,
			limit: args.limit,
			order: args.order,
		});
	},
});

/**
 * Filter symptom logs by symptom, severity, and date range.
 */
export const filterSymptomLogs = query({
	args: {
		userId: symptomLogFields.userId,
		symptom: v.optional(symptomLogFields.symptom),
		minSeverity: v.optional(symptomLogFields.severity),
		maxSeverity: v.optional(symptomLogFields.severity),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		limit: v.optional(v.number()),
		order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
	},
	handler: async (ctx, args) => {
		return await collectFilteredSymptomLogs(ctx, {
			userId: args.userId,
			symptom: args.symptom,
			minSeverity: args.minSeverity,
			maxSeverity: args.maxSeverity,
			startDate: args.startDate,
			endDate: args.endDate,
			limit: args.limit,
			order: args.order,
		});
	},
});

/**
 * Retrieve symptom logs for a specific day.
 */
export const getDailySymptomLogs = query({
	args: {
		userId: symptomLogFields.userId,
		date: v.number(),
		order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
	},
	handler: async (ctx, args) => {
		const bounds = getDayBounds(args.date);
		return await collectFilteredSymptomLogs(ctx, {
			userId: args.userId,
			startDate: bounds.start,
			endDate: bounds.end,
			order: args.order,
		});
	},
});

/**
 * Retrieve symptom logs for a given month.
 */
export const getMonthlySymptomHistory = query({
	args: {
		userId: symptomLogFields.userId,
		year: v.number(),
		month: v.number(),
		order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
	},
	handler: async (ctx, args) => {
		assertValidMonth(args.month);
		const bounds = getMonthBounds(args.year, args.month);
		return await collectFilteredSymptomLogs(ctx, {
			userId: args.userId,
			startDate: bounds.start,
			endDate: bounds.end,
			order: args.order,
		});
	},
});

/**
 * Summarize symptom severity over a date range.
 */
export const getSeverityTracking = query({
	args: {
		userId: symptomLogFields.userId,
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const logs = await collectFilteredSymptomLogs(ctx, {
			userId: args.userId,
			startDate: args.startDate,
			endDate: args.endDate,
			order: "asc",
		});

		const dailySeverity: Record<string, { totalSeverity: number; logCount: number }> = {};
		for (const log of logs) {
			const day = new Date(log.createdAt).toISOString().slice(0, 10);
			const current = dailySeverity[day] ?? { totalSeverity: 0, logCount: 0 };
			dailySeverity[day] = {
				totalSeverity: current.totalSeverity + log.severity,
				logCount: current.logCount + 1,
			};
		}

		return {
			...getSeveritySummary(logs),
			dailySeverity: Object.fromEntries(
				Object.entries(dailySeverity).map(([day, value]) => [
					day,
					{
						...value,
						averageSeverity: value.totalSeverity / value.logCount,
					},
				]),
			),
			logs,
		};
	},
});

// --- Mutations ---

/**
 * Create a new symptom log.
 */
export const createSymptomLog = mutation({
	args: {
		userId: symptomLogFields.userId,
		symptom: symptomLogFields.symptom,
		severity: symptomLogFields.severity,
		notes: symptomLogFields.notes,
	},
	handler: async (ctx, args) => {
		await assertUserExists(ctx, args.userId);
		const createdAt = Date.now();
		await assertNoDuplicateSymptomLog(ctx, args, createdAt);

		const symptomLogId = await ctx.db.insert("symptomLogs", {
			userId: args.userId,
			symptom: args.symptom,
			severity: args.severity,
			notes: args.notes,
			createdAt,
		});
		return symptomLogId;
	},
});

/**
 * Update an existing symptom log.
 */
export const updateSymptomLog = mutation({
	args: {
		symptomLogId: v.id("symptomLogs"),
		symptom: v.optional(symptomLogFields.symptom),
		severity: v.optional(symptomLogFields.severity),
		notes: v.optional(symptomLogFields.notes),
	},
	handler: async (ctx, args) => {
		const symptomLog = await ctx.db.get(args.symptomLogId);
		if (!symptomLog) {
			throw new Error("Symptom log not found");
		}

		const updates: Partial<
			Omit<Doc<"symptomLogs">, "_id" | "_creationTime" | "userId" | "createdAt">
		> = {};

		if (args.symptom !== undefined) {
			updates.symptom = args.symptom;
		}

		if (args.severity !== undefined) {
			updates.severity = args.severity;
		}

		if (args.notes !== undefined) {
			updates.notes = args.notes;
		}

		if (Object.keys(updates).length > 0) {
			await ctx.db.patch("symptomLogs", args.symptomLogId, updates);
		}

		return args.symptomLogId;
	},
});

/**
 * Delete a symptom log.
 */
export const deleteSymptomLog = mutation({
	args: { symptomLogId: v.id("symptomLogs") },
	handler: async (ctx, args) => {
		const symptomLog = await ctx.db.get(args.symptomLogId);
		if (!symptomLog) {
			throw new Error("Symptom log not found");
		}

		await ctx.db.delete("symptomLogs", args.symptomLogId);
		return args.symptomLogId;
	},
});
