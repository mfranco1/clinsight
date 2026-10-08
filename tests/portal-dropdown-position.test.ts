import { describe, expect, it } from "vitest";
import { calculatePortalDropdownPosition } from "../hooks/usePortalDropdownPosition";

describe("portal dropdown positioning", () => {
  it("preserves desktop centering inputs and document scroll offsets", () => {
    expect(
      calculatePortalDropdownPosition(
        { left: 120, bottom: 40, width: 80 },
        true,
        320,
        5,
        12,
      ),
    ).toEqual({ top: 52, left: 125, width: 80 });
  });

  it("keeps mobile menus inside viewport padding at the right and left edges", () => {
    expect(
      calculatePortalDropdownPosition(
        { left: 290, bottom: 40, width: 80 },
        false,
        320,
        0,
        0,
      ),
    ).toEqual({ top: 40, left: 150, width: 80 });
    expect(
      calculatePortalDropdownPosition(
        { left: -5, bottom: 40, width: 80 },
        false,
        320,
        0,
        0,
      ),
    ).toEqual({ top: 40, left: 10, width: 80 });
  });
});
