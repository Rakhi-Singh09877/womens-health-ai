/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiAgents from "../aiAgents.js";
import type * as aiChats from "../aiChats.js";
import type * as aiInsights from "../aiInsights.js";
import type * as auth from "../auth.js";
import type * as constants from "../constants.js";
import type * as healthProfiles from "../healthProfiles.js";
import type * as healthRecords from "../healthRecords.js";
import type * as symptomLogs from "../symptomLogs.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiAgents: typeof aiAgents;
  aiChats: typeof aiChats;
  aiInsights: typeof aiInsights;
  auth: typeof auth;
  constants: typeof constants;
  healthProfiles: typeof healthProfiles;
  healthRecords: typeof healthRecords;
  symptomLogs: typeof symptomLogs;
  users: typeof users;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
