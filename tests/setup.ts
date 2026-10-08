import "@testing-library/jest-dom/vitest";
import { afterEach, expect, vi } from "vitest";

const blockedNetworkAttempts: string[] = [];

vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
  const requestUrl = input instanceof Request ? input.url : String(input);
  const parsedUrl = new URL(requestUrl, "http://localhost");
  blockedNetworkAttempts.push(`${parsedUrl.origin}${parsedUrl.pathname}`);
  throw new Error("Network access is disabled in tests.");
});

if (typeof XMLHttpRequest !== "undefined") {
  vi.spyOn(XMLHttpRequest.prototype, "send").mockImplementation(() => {
    blockedNetworkAttempts.push("XMLHttpRequest");
    throw new Error("Network access is disabled in tests.");
  });
}

afterEach(() => {
  const attempts = blockedNetworkAttempts.splice(0);
  expect(attempts, "Tests must not attempt network requests").toEqual([]);
});
