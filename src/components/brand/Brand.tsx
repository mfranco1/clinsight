import { BRAND } from "../../config/brand";
import type { CSSProperties } from "react";
import BrandMark, { resolveBrandSize } from "./BrandMark";
import BrandName from "./BrandName";

export interface BrandProps {
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg" | number;
  theme?: "light" | "dark";
  colorMode?: "full" | "mono";
  layout?: "horizontal" | "stacked";
  className?: string;
  nameAs?: "span" | "h1";
  showTagline?: boolean;
}

const presetWordmarkSizes = { sm: 20, md: 26, lg: 40 } as const;

export default function Brand({
  variant = "full",
  size = "md",
  theme = "light",
  colorMode = "full",
  layout = "horizontal",
  className = "",
  nameAs: Name = "span",
  showTagline = false,
}: BrandProps) {
  const iconSize = resolveBrandSize(size);
  const numericSize =
    typeof size === "number" && Number.isFinite(size) && size > 0
      ? size
      : undefined;
  const wordmarkSize =
    numericSize ??
    (typeof size === "number"
      ? presetWordmarkSizes.md
      : presetWordmarkSizes[size]);
  const fullWordmarkSize = numericSize
    ? numericSize * (layout === "horizontal" ? 0.65 : 0.5)
    : wordmarkSize;
  const gap = iconSize * 0.25;
  const style = {
    gap: variant === "full" ? gap : undefined,
    "--brand-wordmark-color":
      theme === "dark" ? BRAND.palette.wordmarkDark : BRAND.palette.wordmark,
  } as CSSProperties;
  if (variant === "icon")
    return (
      <span
        className={`brand-lockup brand-${theme} brand-${colorMode} ${className}`}
        style={style}
      >
        <BrandMark
          size={iconSize}
          theme={theme}
          colorMode={colorMode}
          meaningful
        />
      </span>
    );
  if (variant === "wordmark")
    return (
      <span
        className={`brand-lockup brand-${theme} brand-${colorMode} ${className}`}
        style={style}
      >
        <Name className="brand-wordmark" style={{ fontSize: wordmarkSize }}>
          <BrandName />
        </Name>
      </span>
    );
  const stacked = layout === "stacked";
  return (
    <div
      className={`brand-lockup ${stacked ? "brand-stacked" : "brand-horizontal"} brand-${theme} brand-${colorMode} ${className}`}
      style={style}
    >
      <BrandMark size={iconSize} theme={theme} colorMode={colorMode} />
      <div className={stacked ? "brand-copy-stacked" : "brand-copy"}>
        <Name className="brand-wordmark" style={{ fontSize: fullWordmarkSize }}>
          <BrandName />
        </Name>
        {showTagline && <p className="brand-tagline">{BRAND.tagline}</p>}
      </div>
    </div>
  );
}
