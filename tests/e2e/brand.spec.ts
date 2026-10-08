import { BRAND, serializeBrandMark } from "../../src/config/brand";
import { expect, test } from "./fixtures";

test.use({ deviceScaleFactor: 2 });

test("renders the vector mark clearly across sizes and color treatments", async ({
  page,
}) => {
  const sizes = [16, 20, 24, 32, 48, 128];
  const specimens = sizes
    .flatMap((size) => {
      const variants = [
        {
          label: `light ${size}px`,
          theme: "light" as const,
          colorMode: "full" as const,
          background: "#fff",
          color: "#0b2030",
        },
        {
          label: `dark ${size}px`,
          theme: "dark" as const,
          colorMode: "full" as const,
          background: "#0b2030",
          color: "#f4faf9",
        },
        {
          label: `black ${size}px`,
          theme: "light" as const,
          colorMode: "mono" as const,
          background: "#fff",
          color: "#000",
        },
        {
          label: `white ${size}px`,
          theme: "dark" as const,
          colorMode: "mono" as const,
          background: "#000",
          color: "#fff",
        },
      ];
      return variants.map((variant, index) => {
        const svg = serializeBrandMark(BRAND, {
          theme: variant.theme,
          colorMode: variant.colorMode,
          color: variant.color,
          idPrefix: `specimen-${size}-${index}`,
        });
        return `<figure style="background:${variant.background};color:${variant.color}"><div style="height:132px;display:flex;align-items:center;justify-content:center"><span style="display:block;width:${(size * 224) / 240}px;height:${size}px">${svg}</span></div><figcaption>${variant.label}</figcaption></figure>`;
      });
    })
    .join("");

  await page.setViewportSize({ width: 1152, height: 1000 });
  await page.setContent(
    `<html><head><style>*{box-sizing:border-box}body{margin:0;padding:16px;font:13px system-ui,sans-serif}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}figure{margin:0;padding:8px;border:1px solid #cbd5e1;border-radius:8px}figcaption{color:#64748b;text-align:center}svg{display:block;width:100%;height:100%}</style></head><body><div class="grid">${specimens}</div></body></html>`,
  );

  const ids = await page
    .locator("mask")
    .evaluateAll((masks) => masks.map((mask) => mask.id));
  expect(ids).toHaveLength(sizes.length * 4);
  expect(new Set(ids).size).toBe(ids.length);
  await page.screenshot({
    path: test.info().outputPath("brand-size-specimens.png"),
    fullPage: true,
  });
});
