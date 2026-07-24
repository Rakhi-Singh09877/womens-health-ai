import { v } from "convex/values";

import { LIMITS, ERROR_MESSAGES } from "./constants";

/** Reference to a user document. */
export const userId = v.id("users");

/** Reference to a symptom log document. */
export const symptomLogId = v.id("symptomLogs");

/** Reference to a health profile document. */
export const healthProfileId = v.id("healthProfiles");

/** Reference to a health record document. */
export const healthRecordId = v.id("healthRecords");

/** Reference to an AI chat document. */
export const aiChatId = v.id("aiChats");

/** Reference to an AI insight document. */
export const aiInsightId = v.id("aiInsights");

// --- User ---

export const userFields = {
  name: v.string(),
  email: v.string(),
  age: v.number(),
  phone: v.string(),
  createdAt: v.number(),
};

export const userValidator = v.object(userFields);

// --- Health Profile ---

export const healthProfileFields = {
  userId,
  bloodGroup: v.string(),
  allergies: v.array(v.string()),
  chronicConditions: v.array(v.string()),
  medications: v.array(v.string()),
  emergencyContact: v.string(),
};

export const healthProfileValidator = v.object(healthProfileFields);

// --- Symptom Log ---

export const symptomLogFields = {
  userId,
  symptoms: v.array(v.string()),
  severities: v.record(v.string(), v.number()),
  notes: v.optional(v.string()),
  mood: v.optional(v.string()),
  energy: v.optional(v.number()),
  sleep: v.optional(v.number()),
  createdAt: v.number(),
};

export const symptomLogValidator = v.object(symptomLogFields);

// --- Health Record ---

export const healthRecordFields = {
  userId,
  title: v.string(),
  fileUrl: v.string(),
  uploadedAt: v.number(),
};

export const healthRecordValidator = v.object(healthRecordFields);

// --- AI Chat ---

export const aiChatFields = {
  userId,
  prompt: v.string(),
  response: v.string(),
  createdAt: v.number(),
};

export const aiChatValidator = v.object(aiChatFields);

// --- AI Insight ---

export const aiInsightFields = {
  userId,
  patternText: v.string(),
  confidence: v.number(),
  status: v.union(v.literal("Verified"), v.literal("Confirmed"), v.literal("Insufficient")),
  evidenceCount: v.number(),
  processingStatus: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")),
  agentDebateSummary: v.optional(v.string()),
  triggeredSymptoms: v.optional(v.array(v.string())),
  createdAt: v.number(),
};

export const aiInsightValidator = v.object(aiInsightFields);

// --- Validation Functions ---

export function validateEmailFormat(email: string): void {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new Error(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
  }
}

export function validatePhoneFormat(phone: string): void {
  const phonePattern = /^[\d\s+()-]+$/;
  if (!phonePattern.test(phone)) {
    throw new Error(ERROR_MESSAGES.INVALID_PHONE_FORMAT);
  }
}

export function validateAge(age: number): void {
  if (age < LIMITS.MINIMUM_USER_AGE) {
    throw new Error(ERROR_MESSAGES.AGE_TOO_LOW);
  }
  if (age > LIMITS.MAXIMUM_USER_AGE) {
    throw new Error(ERROR_MESSAGES.AGE_TOO_HIGH);
  }
}

export function validateTimestamp(timestamp: number): void {
  const oneDayMs = 86400000;
  if (timestamp < 0 || timestamp > Date.now() + oneDayMs) {
    throw new Error(ERROR_MESSAGES.INVALID_TIMESTAMP);
  }
}
