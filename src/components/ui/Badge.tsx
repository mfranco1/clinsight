import type { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  children: ReactNode;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-status-neutral",
  info: "bg-info-50 text-status-info",
  success: "bg-action-subtle text-status-success",
  warning: "bg-warning-50 text-status-warning",
  danger: "bg-critical-50 text-status-danger",
};

const Badge = ({
  tone = "neutral",
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps) => (
  <span
    className={`inline-flex items-center font-semibold ${size === "sm" ? "rounded-md px-2 py-0.5 text-[9px]" : "rounded-full px-2.5 py-1 text-xs"} ${tones[tone]} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
