import { describe, expect, it } from "vitest";
import {
  AppError,
  getErrorMessage,
  getErrorMessageCompat,
} from "../services/appErrors";

describe("application error contract", () => {
  it("preserves typed code and cause", () => {
    const cause = new Error("root cause");
    const error = new AppError("Storage failed", "STORAGE_READ_FAILED", cause);

    expect(error).toMatchObject({
      name: "AppError",
      code: "STORAGE_READ_FAILED",
      cause,
    });
    expect(error.message).toBe("Storage failed");
  });

  it("normalizes unknown errors to a user-safe fallback", () => {
    expect(getErrorMessage(new Error("known"), "fallback")).toBe("known");
    expect(getErrorMessage({ message: "not an Error" }, "fallback")).toBe(
      "fallback",
    );
  });

  it("preserves legacy message-bearing thrown objects when callers opt into compatibility behavior", () => {
    expect(
      getErrorMessageCompat({ message: "legacy message" }, "fallback"),
    ).toBe("legacy message");
    expect(getErrorMessageCompat(null, "fallback")).toBe("fallback");
  });
});
