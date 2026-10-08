import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODEL,
  DEFAULT_STRUCTURED_MODEL,
  MODELS,
  NAV_ITEMS,
  SPECIALIZATIONS,
} from "../src/config/appConfig";

describe("app configuration", () => {
  it("exposes valid model choices and navigation configuration", () => {
    expect(MODELS).toContainEqual(
      expect.objectContaining({ id: DEFAULT_MODEL }),
    );
    expect(DEFAULT_STRUCTURED_MODEL).toBeTruthy();
    expect(NAV_ITEMS.length).toBeGreaterThan(0);
    expect(SPECIALIZATIONS.length).toBeGreaterThan(0);
  });
});
