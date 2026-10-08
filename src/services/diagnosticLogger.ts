const isDevelopment = process.env.NODE_ENV !== "production";

/** Logs static diagnostic events in development without accepting clinical or error payloads. */
export const logDiagnostic = (level: "warn" | "error", event: string): void => {
  if (!isDevelopment) return;
  console[level](`[Clinsight] ${event}`);
};
