import { BRAND } from "../../config/brand";
import BrandMark from "./BrandMark";
import BrandName from "./BrandName";

interface BrandProps {
  layout?: "horizontal" | "stacked";
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  nameAs?: "span" | "h1";
  showTagline?: boolean;
  className?: string;
}

export default function Brand({
  layout = "horizontal",
  size = "md",
  showName = true,
  nameAs: NameElement = "span",
  showTagline = false,
  className = "",
}: BrandProps) {
  const stacked = layout === "stacked";
  return (
    <div
      className={`flex ${stacked ? "flex-col items-center text-center" : "items-center gap-3"} ${className}`}
    >
      <BrandMark
        size={size}
        badge
        meaningful={!showName}
        className={
          size === "sm"
            ? "shadow-md shadow-action-100"
            : "shadow-lg shadow-action-100"
        }
      />
      {showName && (
        <div className={stacked ? "mt-3" : ""}>
          <NameElement
            className={`font-bold tracking-tight text-content-strong whitespace-nowrap ${stacked ? "mb-2 text-4xl" : `animate-fade-in ${size === "sm" ? "text-xl" : "text-2xl"}`}`}
          >
            <BrandName />
          </NameElement>
          {showTagline && (
            <p className="text-content-secondary text-xs font-bold uppercase tracking-[0.15em]">
              {BRAND.tagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
