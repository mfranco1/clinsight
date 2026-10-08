import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Brand from "../src/components/brand/Brand";
import BrandMark from "../src/components/brand/BrandMark";
import {
  BRAND,
  BRAND_ICON_DATA_URL,
  brandIconDataUrl,
  type BrandDefinition,
} from "../src/config/brand";
import { transformBrandHtml } from "../src/config/brandHtml";
import { sendNotification } from "../src/services/notificationService";

const template = readFileSync("index.html", "utf8");

describe("shared application identity", () => {
  it("supports all variants, themes, numeric sizing, monochrome color, and unique mask IDs", () => {
    const { container, rerender } = render(
      <>
        <Brand
          variant="icon"
          size={16}
          colorMode="mono"
          className="text-black"
        />
        <Brand variant="icon" size={16} theme="dark" />
        <Brand variant="wordmark" size={24} theme="dark" />
        <Brand size="lg" layout="stacked" nameAs="h1" />
      </>,
    );
    const marks = container.querySelectorAll("svg");
    expect(marks).toHaveLength(3);
    expect(marks[0]).toHaveAttribute("aria-label", "Clinsight");
    expect(marks[0]).toHaveStyle({ height: "16px" });
    expect(marks[0].querySelector("path")).toHaveAttribute(
      "stroke",
      "currentColor",
    );
    expect(marks[1].querySelectorAll("path")[1]).toHaveAttribute(
      "stroke",
      BRAND.palette.tealDark,
    );
    expect(marks[0].querySelector("mask")?.id).not.toBe(
      marks[1].querySelector("mask")?.id,
    );
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector(".brand-dark .brand-wordmark")).toHaveStyle({
      fontSize: "24px",
    });

    rerender(<Brand variant="wordmark" size={Number.NaN} />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector(".brand-wordmark")).toHaveStyle({
      fontSize: "26px",
    });
  });

  it("keeps decorative marks silent and names the collapsed brand once", () => {
    const { rerender, container } = render(<BrandMark />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    rerender(<Brand variant="icon" />);
    expect(screen.getByRole("img", { name: BRAND.name })).toBeInTheDocument();
    rerender(<Brand />);
    expect(screen.getByText(BRAND.name)).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("derives startup, title, favicon, and geometry from an alternate definition", () => {
    const alternate: BrandDefinition = {
      ...BRAND,
      name: 'Review <&" app',
      mark: {
        ...BRAND.mark,
        shapes: [{ tag: "circle", cx: 8, cy: 9, r: 3, paint: "teal" }],
      },
    };
    const output = transformBrandHtml(template, alternate);
    expect(output).not.toMatch(/%BRAND_/);
    const document = new DOMParser().parseFromString(output, "text/html");
    expect(document.title).toBe(alternate.name);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      `Loading ${alternate.name}…`,
    );
    expect(
      document.querySelector('link[rel="icon"]')?.getAttribute("href"),
    ).toBe(brandIconDataUrl(alternate));
    expect(document.querySelector("svg > circle")?.getAttribute("cx")).toBe(
      "8",
    );
    expect(document.querySelector("svg path")).toBeNull();
    expect(document.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(
      decodeURIComponent(brandIconDataUrl(alternate).split(",")[1]),
    ).toContain('cx="8"');
    expect(() => transformBrandHtml("%BRAND_UNKNOWN%")).toThrow(
      "Unknown brand placeholder",
    );
  });

  it("uses shared notification imagery and preserves caller overrides", () => {
    const NotificationMock = vi.fn(function () {
      return { close: vi.fn(), onclick: null };
    });
    Object.assign(NotificationMock, { permission: "granted" });
    vi.stubGlobal("Notification", NotificationMock);
    const visibility = vi
      .spyOn(document, "hidden", "get")
      .mockReturnValue(true);
    try {
      expect(sendNotification("Ready")).toBe(true);
      expect(NotificationMock).toHaveBeenLastCalledWith("Ready", {
        icon: BRAND_ICON_DATA_URL,
        badge: brandIconDataUrl(BRAND, "mono"),
      });
      expect(sendNotification("Ready", { icon: "custom-icon" })).toBe(true);
      expect(NotificationMock).toHaveBeenLastCalledWith("Ready", {
        icon: "custom-icon",
        badge: brandIconDataUrl(BRAND, "mono"),
      });
    } finally {
      visibility.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
