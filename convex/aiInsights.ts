import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { aiInsightFields } from "./validators";

/**
 * Retrieve AI insights for a user, ordered from most recent to oldest.
 */
export const getAiInsightsByUserId = query({
  args: { userId: aiInsightFields.userId },
  handler: async (ctx, args) => {
    const insights: Doc<"aiInsights">[] = [];
    for await (const insight of ctx.db
      .query("aiInsights")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))) {
      insights.push(insight);
    }

    insights.sort((a, b) => b.createdAt - a.createdAt);
    return insights;
  },
});

/**
 * Analyze a user's symptom logs and store a resulting AI insight.
 */
export const runAiAnalysis = mutation({
  args: { userId: aiInsightFields.userId },
  handler: async (ctx, args) => {
    const logs: Doc<"symptomLogs">[] = [];
    for await (const log of ctx.db
      .query("symptomLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))) {
      logs.push(log);
    }

    if (logs.length < 3) {
      return await ctx.db.insert("aiInsights", {
        userId: args.userId,
        patternText: "Not enough symptom logs yet to detect a pattern.",
        confidence: 0,
        status: "Insufficient",
        evidenceCount: logs.length,
        createdAt: Date.now(),
      });
    }

    const symptomCounts: Record<string, number> = {};
    let totalSeverity = 0;
    for (const log of logs) {
      symptomCounts[log.symptom] = (symptomCounts[log.symptom] ?? 0) + 1;
      totalSeverity += log.severity;
    }

    let topSymptom = logs[0].symptom;
    let topCount = symptomCounts[topSymptom];
    for (const [symptom, count] of Object.entries(symptomCounts)) {
      if (count > topCount) {
        topSymptom = symptom;
        topCount = count;
      }
    }

    const totalLogs = logs.length;
    const averageSeverity = totalSeverity / totalLogs;
    const confidence = Math.min(95, Math.round((topCount / totalLogs) * 100));
    const status: "Verified" | "Confirmed" | "Insufficient" =
      confidence >= 70 ? "Verified" : confidence >= 40 ? "Confirmed" : "Insufficient";
    const patternText = `${topSymptom} appears in ${topCount} of ${totalLogs} logs, with average severity ${averageSeverity.toFixed(1)}.`;

    return await ctx.db.insert("aiInsights", {
      userId: args.userId,
      patternText,
      confidence,
      status,
      evidenceCount: topCount,
      createdAt: Date.now(),
    });
  },
});
