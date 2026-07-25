import { defineApp } from "convex/server";
import { v } from "convex/values";

export default defineApp({
  env: {
    XAI_API_KEY: v.optional(v.string()),
    XAI_MODEL: v.optional(v.string()),
  },
});
