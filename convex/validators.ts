import { v } from "convex/values";

/** Reference to a user document. */
export const userId = v.id("users");

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
  symptom: v.string(),
  severity: v.number(),
  notes: v.string(),
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
