import { useId } from "react";
import { BRAND } from "../../config/brand";

export interface BrandMarkProps {
  size?: "sm" | "md" | "lg" | number;
  theme?: "light" | "dark";
  colorMode?: "full" | "mono";
  meaningful?: boolean;
  className?: string;
}

const presetSizes = { sm: 32, md: 40, lg: 80 } as const;
export function resolveBrandSize(size: BrandMarkProps["size"] = "md"): number {
  if (typeof size === "number")
    return Number.isFinite(size) && size > 0 ? size : presetSizes.md;
  return presetSizes[size];
}

export default function BrandMark({
  size = "md",
  theme = "light",
  colorMode = "full",
  meaningful = false,
  className = "",
}: BrandMarkProps) {
  const id = useId().replace(/:/g, "");
  const paints = {
    mint: colorMode === "mono" ? "currentColor" : BRAND.palette.mint,
    teal:
      colorMode === "mono"
        ? "currentColor"
        : theme === "dark"
          ? BRAND.palette.tealDark
          : BRAND.palette.teal,
  };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={BRAND.mark.viewBox}
      fill="none"
      width="100%"
      height="100%"
      focusable="false"
      role={meaningful ? "img" : undefined}
      aria-label={meaningful ? BRAND.name : undefined}
      aria-hidden={meaningful ? undefined : true}
      className={`brand-mark ${className}`}
      style={{
        width: resolveBrandSize(size) * (224 / 240),
        height: resolveBrandSize(size),
        flexShrink: 0,
      }}
    >
      <defs>
        <mask
          id={`brand-${id}-cutout`}
          x="0"
          y="0"
          width="224"
          height="240"
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          style={{ maskType: "luminance" }}
        >
          <rect width="224" height="240" fill="white" />
          <circle
            cx={BRAND.mark.cutout.cx}
            cy={BRAND.mark.cutout.cy}
            r={BRAND.mark.cutout.r}
            fill="black"
          />
        </mask>
      </defs>
      {BRAND.mark.shapes.map((shape, index) =>
        shape.tag === "path" ? (
          <path
            key={index}
            d={shape.d}
            stroke={shape.paint === "mint" ? paints.mint : paints.teal}
            strokeWidth="40"
            strokeLinecap="round"
            strokeLinejoin="round"
            mask={
              "cutout" in shape && shape.cutout
                ? `url(#brand-${id}-cutout)`
                : undefined
            }
          />
        ) : (
          <circle
            key={index}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            fill={paints.teal}
          />
        ),
      )}
    </svg>
  );
}
