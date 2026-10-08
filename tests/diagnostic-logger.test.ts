import { afterEach, describe, expect, it, vi } from "vitest";

describe("diagnostic logger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("does not write diagnostics in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { logDiagnostic } = await import("../services/diagnosticLogger");

    logDiagnostic("error", "Gemini request failed.");

    expect(error).not.toHaveBeenCalled();
  });

  it("logs only a static event label in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { logDiagnostic } = await import("../services/diagnosticLogger");

    logDiagnostic(
      "warn",
      "Structured response parsing needed extraction fallback.",
    );

    expect(warn).toHaveBeenCalledWith(
      "[Clinsight] Structured response parsing needed extraction fallback.",
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
