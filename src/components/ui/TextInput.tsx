import type { InputHTMLAttributes, RefAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> &
  RefAttributes<HTMLInputElement> & {
    variant?: "default" | "subtle";
  };

const TextInput = ({
  variant = "default",
  className = "",
  ...props
}: TextInputProps) => (
  <input
    className={`min-h-10 w-full rounded-control border border-border-default px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 disabled:bg-surface-muted disabled:text-content-muted ${variant === "subtle" ? "bg-canvas focus:bg-surface" : "bg-surface"} ${className}`}
    {...props}
  />
);

export default TextInput;
