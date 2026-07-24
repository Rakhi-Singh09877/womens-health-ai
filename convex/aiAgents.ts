import { action, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { aiInsightFields } from "./validators";
import type { Doc } from "./_generated/dataModel";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-5";

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set in Convex environment variables");
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

  const data = await response.json();
  const textBlock = data.content?.find((block: any) => block.type === "text");
  return textBlock?.text ?? "";
}

export const storeInsight = internalMutation({
  args: {
    userId: aiInsightFields.userId,
    patternText: aiInsightFields.patternText,
    confidence: aiInsightFields.confidence,
    status: aiInsightFields.status,
    evidenceCount: aiInsightFields.evidenceCount,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiInsights", {
      userId: args.userId,
      patternText: args.patternText,
      confidence: args.confidence,
      status: args.status,
      evidenceCount: args.evidenceCount,
      createdAt: Date.now(),
    });
  },
});

export const runDualAgentAnalysis = action({
  args: { userId: aiInsightFields.userId },
  handler: async (ctx, args): Promise<string> => {
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
      });
    }

    const logsSummary = logs
      .map(
        (log) =>
          `Date: ${new Date(log.createdAt).toISOString().slice(0, 10)}, Symptoms: ${log.symptoms.map((symptom) => `${symptom} (${log.severities[symptom] ?? "unknown"}/10)`).join(", ") || "none"}, Notes: ${log.notes || "none"}`,
      )
      .join("\n");

    const insightSystemPrompt =
      "You are a health pattern analysis agent. Given a list of symptom logs, identify ONE specific, concrete pattern or correlation in the data. Respond with ONLY one sentence describing the candidate pattern. No preamble, no caveats, no medical advice.";
    const candidatePattern = (
      await callClaude(insightSystemPrompt, `Symptom logs:\n${logsSummary}\n\nIdentify one candidate pattern.`)
    ).trim();

    const verifierSystemPrompt =
      'You are a skeptical verification agent. You will be given a candidate health pattern and the raw log data it was based on. Check whether the data actually supports the claim. Respond with ONLY a JSON object (no markdown, no code fences) in this exact shape: {"status": "Verified" | "Confirmed" | "Insufficient", "confidence": number 0-100, "evidenceCount": number, "finalPatternText": string}. Use "Verified" only if the data strongly and consistently supports the pattern. Use "Confirmed" for partial support. Use "Insufficient" if the data does not clearly support it. "finalPatternText" should be a corrected, precise description of what the data actually shows.';
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
    });
  },
});
