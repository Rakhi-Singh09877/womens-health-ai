import { action, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { aiInsightFields } from "./validators";
import type { Doc } from "./_generated/dataModel";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_REQUEST_TIMEOUT_MS = 15_000;
const GROQ_MAX_ATTEMPTS = 2;

function getTextContent(data: unknown): string {
  if (
    typeof data !== "object" ||
    data === null ||
    !("choices" in data) ||
    !Array.isArray(data.choices) ||
    data.choices.length === 0
  ) {
    throw new Error("Groq API returned an unexpected response format: missing choices array");
  }

  const firstChoice = data.choices[0];
  if (
    typeof firstChoice !== "object" ||
    firstChoice === null ||
    !("message" in firstChoice) ||
    typeof firstChoice.message !== "object" ||
    firstChoice.message === null ||
    !("content" in firstChoice.message) ||
    typeof firstChoice.message.content !== "string"
  ) {
    throw new Error("Groq API returned an unexpected response format: missing message content");
  }

  return firstChoice.message.content;
}

function isTransientStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }

  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  for (let attempt = 0; attempt < GROQ_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GROQ_REQUEST_TIMEOUT_MS);
    let response: Response;

    try {
      response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Groq API request timed out. Please try again.");
      }

      throw new Error(
        `Unable to reach the Groq API: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      if (isTransientStatus(response.status) && attempt + 1 < GROQ_MAX_ATTEMPTS) {
        await delay(250);
        continue;
      }

      let errorSnippet = "";
      try {
        const errorText = await response.text();
        errorSnippet = errorText.slice(0, 200).replace(apiKey, "[REDACTED]");
      } catch {
        errorSnippet = "Could not read response body";
      }

      throw new Error(
        `Groq API request failed (status ${response.status}): ${errorSnippet}`
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error("Groq API returned an invalid JSON response.");
    }

    return getTextContent(data);
  }

  throw new Error("Groq API request failed. Please try again.");
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
        await callGroq(insightSystemPrompt, `Symptom logs:\n${logsSummary}\n\nIdentify one candidate pattern.`)
      ).trim();

      const verifierSystemPrompt =
        'You are a skeptical verification agent. You will be given a candidate health pattern and the raw log data it was based on. Check whether the data supports the claimed correlation between symptoms and/or lifestyle factors, including whether the relationship is consistent across relevant logs and whether there are enough observations to support the confidence level. Respond with ONLY a JSON object (no markdown, no code fences) in this exact shape: {"status": "Verified" | "Confirmed" | "Insufficient", "confidence": number 0-100, "evidenceCount": number, "finalPatternText": string}. Use "Verified" only for a strong, consistent correlation supported by sufficient relevant evidence and assign a high confidence only when the data warrants it. Use "Confirmed" for a plausible but partial or less consistent correlation with moderate confidence. Use "Insufficient" when the data does not clearly support a correlation, is inconsistent, or lacks enough relevant observations; assign low confidence. "evidenceCount" must reflect the number of logs that directly support the final correlation. "finalPatternText" should be a corrected, precise description of what the data actually shows.';
      const verifierRaw = await callGroq(
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
