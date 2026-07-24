import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    age: v.number(),
    phone: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  healthProfiles: defineTable({
    userId: v.id("users"),
    bloodGroup: v.string(),
    allergies: v.array(v.string()),
    chronicConditions: v.array(v.string()),
    medications: v.array(v.string()),
    emergencyContact: v.string(),
  }).index("by_userId", ["userId"]),

  symptomLogs: defineTable({
    userId: v.id("users"),
    symptom: v.string(),
    severity: v.number(),
    notes: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  healthRecords: defineTable({
    userId: v.id("users"),
    title: v.string(),
    fileUrl: v.string(),
    uploadedAt: v.number(),
  }).index("by_userId", ["userId"]),

  aiChats: defineTable({
    userId: v.id("users"),
    prompt: v.string(),
    response: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  aiInsights: defineTable({
    userId: v.id("users"),
    patternText: v.string(),
    confidence: v.number(),
    status: v.union(v.literal("Verified"), v.literal("Confirmed"), v.literal("Insufficient")),
    evidenceCount: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
