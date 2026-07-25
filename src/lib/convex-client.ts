import { ConvexReactClient } from "convex/react";
import { anyApi } from "convex/server";

/**
 * Convex deployment URL is hardcoded (not read from an env variable) because
 * this platform forbids VITE_* config. The `convex/` folder lives only in the
 * remote deployment, so backend functions are referenced via `anyApi` (no
 * codegen). Query/mutation/action results are `any` — cast them to the typed
 * shapes in `src/types/health.ts` at the call site.
 */
const CONVEX_URL = "https://joyous-bloodhound-547.convex.cloud";

export const convexClient = new ConvexReactClient(CONVEX_URL);

/** Untyped API reference: `api.users.getUser`, `api.aiAgents.runDualAgentAnalysis`, etc. */
export const api = anyApi;
