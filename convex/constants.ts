/**
 * Shared limits and configuration constants.
 *
 * These are intended to replace scattered hardcoded values across the
 * codebase in a future refactor pass. Modules should import from here
 * instead of writing magic numbers inline.
 */
export const LIMITS = {
  /**
   * Minimum allowed user age.
   *
   * TODO: 18 is a placeholder product decision — confirm with the team
   * before launch and adjust based on target audience research.
   */
  MINIMUM_USER_AGE: 18,

  /** Maximum allowed user age (sanity ceiling). */
  MAXIMUM_USER_AGE: 120,

  /** Default page size / limit for search queries. */
  DEFAULT_SEARCH_LIMIT: 10,

  /** Hard cap on page size to prevent unbounded result sets. */
  MAX_SEARCH_LIMIT: 100,

  /**
   * Default number of conversations fed into AI context.
   * Mirrors the default in aiChats.getRecentAiChatContext.
   */
  DEFAULT_AI_CONTEXT_LIMIT: 10,
} as const;

/**
 * Canonical error message constants.
 *
 * These centralize the error text already thrown inline across the
 * codebase. A future refactor pass should replace the raw strings
 * with these constants to make error handling and i18n easier.
 */
export const ERROR_MESSAGES = {
  USER_NOT_FOUND: "User not found",
  HEALTH_PROFILE_NOT_FOUND: "Health profile not found",
  SYMPTOM_LOG_NOT_FOUND: "Symptom log not found",
  HEALTH_RECORD_NOT_FOUND: "Health record not found",
  AI_CHAT_NOT_FOUND: "AI chat not found",
  UNAUTHORIZED: "Unauthorized",
  NOT_AUTHENTICATED: "Not authenticated",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  PHONE_ALREADY_EXISTS: "Phone already exists",
  INVALID_EMAIL_FORMAT: "Invalid email format",
  INVALID_PHONE_FORMAT: "Invalid phone format",
  AGE_TOO_LOW: "Age is below the minimum allowed",
  AGE_TOO_HIGH: "Age exceeds the maximum allowed",
  INVALID_TIMESTAMP: "Invalid timestamp",
} as const;
