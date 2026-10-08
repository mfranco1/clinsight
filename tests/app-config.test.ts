import { describe, expect, it } from "vitest";
import { NAV_ITEMS, SPECIALIZATIONS } from "../src/config/appConfig";

describe("app configuration", () => {
  it("exposes navigation and specialization configuration", () => {
    expect(NAV_ITEMS.length).toBeGreaterThan(0);
    expect(SPECIALIZATIONS.length).toBeGreaterThan(0);
  });
});
