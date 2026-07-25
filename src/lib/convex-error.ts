/** Extracts a clean, human-readable message from a Convex client/server error. */
export function getErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  // Errors thrown inside a Convex function handler (e.g. `throw new Error("...")`)
  // arrive wrapped as "... Uncaught Error: <message> at ...".
  const uncaught = raw.match(/Uncaught Error:\s*([^\n]+)/);
  if (uncaught) return uncaught[1].replace(/\s+at\s.*$/, "").trim();

  // Convex argument schema mismatches (e.g. sending a number where v.string() is required).
  if (raw.includes("ArgumentValidationError")) {
    const path = raw.match(/Path:\s*([^\n]+)/)?.[1]?.trim();
    const value = raw.match(/Value:\s*([^\n]+)/)?.[1]?.trim();
    const validator = raw.match(/Validator:\s*([^\n]+)/)?.[1]?.trim();
    const parts = [
      `Invalid value${path ? ` for ${path}` : ""}`,
      value ? `(got ${value})` : "",
      validator ? `— expected ${validator}` : "",
    ].filter(Boolean);
    return parts.join(" ");
  }

  // Fallback: strip Convex's "[CONVEX ...] Server Error" wrapper and stack lines,
  // keep the first informative line.
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("[CONVEX") && !l.startsWith("at ") && l !== "Called by client");
  return lines[0] ?? raw;
}
