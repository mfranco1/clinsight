import { BRAND } from "../../config/brand";

export interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  tone?: "action" | "white";
  badge?: boolean;
  meaningful?: boolean;
  className?: string;
}

const sizes = {
  sm: { badge: "h-9 w-9", mark: "h-5 w-5" },
  md: { badge: "h-12 w-12", mark: "h-6 w-6" },
  lg: { badge: "h-12 w-12", mark: "h-7 w-7" },
};

export default function BrandMark({
  size = "md",
  tone = "action",
  badge = false,
  meaningful = false,
  className = "",
}: BrandMarkProps) {
  const mark = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={BRAND.mark.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={BRAND.mark.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={meaningful ? "img" : undefined}
      aria-label={meaningful ? BRAND.name : undefined}
      aria-hidden={meaningful ? undefined : true}
      className={`${sizes[size].mark} ${badge || tone === "white" ? "text-white" : "text-action"} ${badge ? "" : className}`}
    >
      {BRAND.mark.shapes.map((shape, index) =>
        shape.tag === "path" ? (
          <path key={index} d={shape.d} />
        ) : (
          <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} />
        ),
      )}
    </svg>
  );
  return badge ? (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-action ${sizes[size].badge} ${className}`}
    >
      {mark}
    </span>
  ) : (
    mark
  );
}
