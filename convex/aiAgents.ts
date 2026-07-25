import { action, env, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { aiInsightFields } from "./validators";
import type { Doc } from "./_generated/dataModel";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-5";

type ClaudeTextBlock = {
  type?: unknown;
  text?: unknown;
};

function getTextContent(data: unknown): string {
  if (
    typeof data !== "object" ||
    data === null ||
    !("content" in data) ||
    !Array.isArray(data.content)
  ) {
    throw new Error("Claude API returned an unexpected response format");
  }

  const textBlock = data.content.find(
    (block): block is ClaudeTextBlock =>
      typeof block === "object" &&
      block !== null &&
      (block as ClaudeTextBlock).type === "text" &&
      typeof (block as ClaudeTextBlock).text === "string",
  );

  return typeof textBlock?.text === "string" ? textBlock.text : "";
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set in Convex environment variables",
    );
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errText}`);
  }

  return getTextContent(await response.json());
}

export const storeInsight = internalMutation({
  args: {
    userId: aiInsightFields.userId,
    patternText: aiInsightFields.patternText,
    confidence: aiInsightFields.confidence,
    status: aiInsightFields.status,
    evidenceCount: aiInsightFields.evidenceCount,
    processingStatus: aiInsightFields.processingStatus,
    agentDebateSummary: aiInsightFields.agentDebateSummary,
    triggeredSymptoms: aiInsightFields.triggeredSymptoms,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiInsights", {
      userId: args.userId,
      patternText: args.patternText,
      confidence: args.confidence,
      status: args.status,
      evidenceCount: args.evidenceCount,
      processingStatus: args.processingStatus,
      agentDebateSummary: args.agentDebateSummary,
      triggeredSymptoms: args.triggeredSymptoms,
      createdAt: Date.now(),
    });
  },
});

export const runDualAgentAnalysis = action({
  args: { userId: aiInsightFields.userId },
  handler: async (ctx, args): Promise<string> => {
    try {
      const logs: Doc<"symptomLogs">[] = await ctx.runQuery(
        api.symptomLogs.listSymptomLogs,
        { userId: args.userId },
      );

      if (logs.length < 3) {
        return await ctx.runMutation(internal.aiAgents.storeInsight, {
          userId: args.userId,
          patternText: "Not enough symptom logs yet to detect a pattern.",
          confidence: 0,
          status: "Insufficient",
          evidenceCount: logs.length,
          processingStatus: "completed",
          agentDebateSummary: `Analysis skipped: Only ${logs.length} logs available. Need at least 3.`,
          triggeredSymptoms: logs.flatMap(l => l.symptoms).filter((s, i, arr) => arr.indexOf(s) === i),
        });
      }

      const logsSummary = logs
        .map(
          (log) =>
            `Date: ${new Date(log.createdAt).toISOString().slice(0, 10)}, Symptoms: ${log.symptoms.map((s) => `${s} (${log.severities[s] ?? "unknown"}/10)`).join(", ")}, Mood: ${log.mood || "not specified"}, Energy: ${log.energy ?? "not specified"}%, Sleep: ${log.sleep ?? "not specified"}h, Notes: ${log.notes || "none"}`,
        )
        .join("\n");

      const insightSystemPrompt =
        "You are a health pattern analysis agent. Given a list of symptom logs, identify ONE specific, concrete pattern or correlation in the data, prioritizing relationships among multiple symptoms and/or lifestyle factors such as mood, energy, and sleep. Respond with ONLY one sentence describing the candidate pattern. No preamble, no caveats, no medical advice.";
      const candidatePattern = (
        await callClaude(insightSystemPrompt, `Symptom logs:\n${logsSummary}\n\nIdentify one candidate pattern.`)
      ).trim();

      const verifierSystemPrompt =
        'You are a skeptical verification agent. You will be given a candidate health pattern and the raw log data it was based on. Check whether the data supports the claimed correlation between symptoms and/or lifestyle factors, including whether the relationship is consistent across relevant logs and whether there are enough observations to support the confidence level. Respond with ONLY a JSON object (no markdown, no code fences) in this exact shape: {"status": "Verified" | "Confirmed" | "Insufficient", "confidence": number 0-100, "evidenceCount": number, "finalPatternText": string}. Use "Verified" only for a strong, consistent correlation supported by sufficient relevant evidence and assign a high confidence only when the data warrants it. Use "Confirmed" for a plausible but partial or less consistent correlation with moderate confidence. Use "Insufficient" when the data does not clearly support a correlation, is inconsistent, or lacks enough relevant observations; assign low confidence. "evidenceCount" must reflect the number of logs that directly support the final correlation. "finalPatternText" should be a corrected, precise description of what the data actually shows.';
      const verifierRaw = await callClaude(
        verifierSystemPrompt,
        `Candidate pattern: "${candidatePattern}"\n\nRaw symptom logs:\n${logsSummary}\n\nVerify this pattern against the raw data.`,
      );

      let parsed: {
        status: "Verified" | "Confirmed" | "Insufficient";
        confidence: number;
        evidenceCount: number;
        finalPatternText: string;
      };

      try {
        parsed = JSON.parse(verifierRaw.replace(/```json|```/g, "").trim());
      } catch {
        parsed = {
          status: "Insufficient",
          confidence: 0,
          evidenceCount: 0,
          finalPatternText: "Verifier agent could not confirm a reliable pattern from the current data.",
        };
      }

      return await ctx.runMutation(internal.aiAgents.storeInsight, {
        userId: args.userId,
        patternText: parsed.finalPatternText,
        confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence))),
        status: parsed.status,
        evidenceCount: parsed.evidenceCount,
        processingStatus: "completed",
        agentDebateSummary: `Insight Agent proposed: "${candidatePattern}". Verifier Agent confirmed with ${parsed.confidence}% confidence.`,
        triggeredSymptoms: logs.flatMap(log => log.symptoms).filter((s, i, arr) => arr.indexOf(s) === i).slice(0, 5),
      });
    } catch (error) {
      console.error("Agent analysis failed:", error);
      return await ctx.runMutation(internal.aiAgents.storeInsight, {
        userId: args.userId,
        patternText: "Pattern analysis encountered an error. Please try again.",
        confidence: 0,
        status: "Insufficient",
        evidenceCount: 0,
        processingStatus: "failed",
        agentDebateSummary: `Error during analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
        triggeredSymptoms: [],
      });
    }
  },
});
