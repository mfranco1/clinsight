import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  "primary" | "secondary" | "ghost" | "danger" | "warning" | "info";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-action text-white hover:bg-action-hover focus-visible:ring-action",
  secondary:
    "border border-border-default bg-surface text-content-primary hover:bg-surface-muted focus-visible:ring-focus-ring",
  ghost:
    "text-content-secondary hover:bg-surface-muted hover:text-content-strong focus-visible:ring-focus-ring",
  danger:
    "bg-status-danger text-white hover:bg-critical-800 focus-visible:ring-status-danger",
  warning:
    "bg-status-warning text-white hover:bg-warning-700 focus-visible:ring-status-warning",
  info: "bg-action text-white hover:bg-action-hover focus-visible:ring-action",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-11 px-5 text-base",
};

const Button = ({
  variant = "secondary",
  size = "md",
  type = "button",
  className = "",
  children,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
