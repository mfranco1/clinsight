import type { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "subtle";
}

const TextArea = ({
  variant = "default",
  className = "",
  ...props
}: TextAreaProps) => (
  <textarea
    className={`w-full rounded-control border border-border-default px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 disabled:bg-surface-muted disabled:text-content-muted ${variant === "subtle" ? "bg-canvas focus:bg-surface" : "bg-surface"} ${className}`}
    {...props}
  />
);

export default TextArea;
