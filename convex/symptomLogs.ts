import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { symptomLogFields, symptomLogId } from "./validators";
import { assertResourceOwner } from "./auth";
import { ERROR_MESSAGES } from "./constants";

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
	symptoms: string[];
	severities: Record<string, number>;
	notes: string;
	mood?: string;
	energy?: number;
	sleep?: number;
};

async function assertUserExists(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
	const user = await ctx.db.get(userId);
	if (!user) {
		throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
	}

	return user;
}

function assertValidMonth(month: number) {
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		throw new Error(ERROR_MESSAGES.INVALID_MONTH);
	}
}

async function assertNoDuplicateSymptomLog(
	ctx: QueryCtx | MutationCtx,
	args: SymptomLogCreateArgs,
	createdAt: number,
) {
	const bounds = getDayBounds(createdAt);
	const logsOnSameDay = ctx.db
		.query("symptomLogs")
		.withIndex("by_userId", (q) => q.eq("userId", args.userId))
		.filter((q) => q.gte(q.field("createdAt"), bounds.start))
		.filter((q) => q.lt(q.field("createdAt"), bounds.end));

	for await (const log of logsOnSameDay) {
		if (log.symptoms.some((symptom) => args.symptoms.includes(symptom))) {
			throw new Error(ERROR_MESSAGES.SYMPTOM_LOG_ALREADY_EXISTS_FOR_DAY);
		}
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
		const matchesSymptom =
			args.symptom === undefined || log.symptoms.includes(args.symptom);
		const matchesSeverity = Object.values(log.severities).some(
			(severity) =>
				(args.minSeverity === undefined || severity >= args.minSeverity) &&
				(args.maxSeverity === undefined || severity <= args.maxSeverity),
		);

		if (matchesSymptom && matchesSeverity) {
			logs.push(log);
		}
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

	const severityValues = logs.flatMap((log) => Object.values(log.severities));
	if (severityValues.length === 0) {
		return {
			totalLogs: logs.length,
			averageSeverity: null as number | null,
			minSeverity: null as number | null,
			maxSeverity: null as number | null,
			severityCounts: {} as Record<number, number>,
		};
	}

	let totalSeverity = 0;
	let minSeverity = severityValues[0];
	let maxSeverity = severityValues[0];
	const severityCounts: Record<number, number> = {};

	for (const severity of severityValues) {
		totalSeverity += severity;
		minSeverity = Math.min(minSeverity, severity);
		maxSeverity = Math.max(maxSeverity, severity);
		severityCounts[severity] = (severityCounts[severity] ?? 0) + 1;
	}

	return {
		totalLogs: logs.length,
		averageSeverity: totalSeverity / severityValues.length,
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
	args: { symptomLogId },
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
		symptom: v.optional(v.string()),
		minSeverity: v.optional(v.number()),
		maxSeverity: v.optional(v.number()),
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
			totalSeverity:
				current.totalSeverity +
				Object.values(log.severities).reduce((sum, severity) => sum + severity, 0),
			logCount: current.logCount + Object.keys(log.severities).length,
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
		symptoms: symptomLogFields.symptoms,
		severities: symptomLogFields.severities,
		notes: symptomLogFields.notes,
		mood: symptomLogFields.mood,
		energy: symptomLogFields.energy,
		sleep: symptomLogFields.sleep,
	},
	handler: async (ctx, args) => {
		await assertUserExists(ctx, args.userId);
		const createdAt = Date.now();
		await assertNoDuplicateSymptomLog(ctx, args, createdAt);

		const newSymptomLogId = await ctx.db.insert("symptomLogs", {
			userId: args.userId,
			symptoms: args.symptoms,
			severities: args.severities,
			notes: args.notes,
			mood: args.mood,
			energy: args.energy,
			sleep: args.sleep,
			createdAt,
		});
		return newSymptomLogId;
	},
});

/**
 * Update an existing symptom log.
 */
export const updateSymptomLog = mutation({
	args: {
		symptomLogId,
		callerId: symptomLogFields.userId,
		symptoms: v.optional(symptomLogFields.symptoms),
		severities: v.optional(symptomLogFields.severities),
		notes: v.optional(symptomLogFields.notes),
		mood: v.optional(symptomLogFields.mood),
		energy: v.optional(symptomLogFields.energy),
		sleep: v.optional(symptomLogFields.sleep),
	},
	handler: async (ctx, args) => {
		const symptomLog = await ctx.db.get(args.symptomLogId);
		if (!symptomLog) {
			throw new Error(ERROR_MESSAGES.SYMPTOM_LOG_NOT_FOUND);
		}

		assertResourceOwner(args.callerId, symptomLog.userId);

		const updates: Partial<
			Omit<Doc<"symptomLogs">, "_id" | "_creationTime" | "userId" | "createdAt">
		> = {};

		if (args.symptoms !== undefined) {
			updates.symptoms = args.symptoms;
		}

		if (args.severities !== undefined) {
			updates.severities = args.severities;
		}

		if (args.notes !== undefined) {
			updates.notes = args.notes;
		}

		if (args.mood !== undefined) {
			updates.mood = args.mood;
		}

		if (args.energy !== undefined) {
			updates.energy = args.energy;
		}

		if (args.sleep !== undefined) {
			updates.sleep = args.sleep;
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
	args: { symptomLogId, callerId: symptomLogFields.userId },
	handler: async (ctx, args) => {
		const symptomLog = await ctx.db.get(args.symptomLogId);
		if (!symptomLog) {
			throw new Error(ERROR_MESSAGES.SYMPTOM_LOG_NOT_FOUND);
		}

		assertResourceOwner(args.callerId, symptomLog.userId);

		await ctx.db.delete("symptomLogs", args.symptomLogId);
		return args.symptomLogId;
	},
});

/**
 * Returns month-by-month aggregated symptom data (label, severity trend, key symptom) for the doctor timeline view.
 */
export const getSymptomTimeline = query({
  args: { userId: symptomLogFields.userId },
  handler: async (ctx, args) => {
    const logs: Doc<"symptomLogs">[] = [];
    for await (const log of ctx.db
      .query("symptomLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))) {
      logs.push(log);
    }

    const byMonth: Record<string, Doc<"symptomLogs">[]> = {};
    for (const log of logs) {
      const key = new Date(log.createdAt).toISOString().slice(0, 7);
      byMonth[key] ??= [];
      byMonth[key].push(log);
    }

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, monthLogs]) => {
        const counts: Record<string, number> = {};
		for (const log of monthLogs) {
			for (const symptom of log.symptoms) {
				counts[symptom] = (counts[symptom] ?? 0) + 1;
			}
		}
		const keySymptom = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
		const severityValues = monthLogs.flatMap((log) => Object.values(log.severities));
		const severityTrend = severityValues.length === 0
			? 0
			: severityValues.reduce((sum, severity) => sum + severity, 0) / severityValues.length;

        return {
          monthLabel: new Date(monthKey + "-01").toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
          severityTrend: Number(severityTrend.toFixed(1)),
          keySymptom,
        };
      });
  },
});
