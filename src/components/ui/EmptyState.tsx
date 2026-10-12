import React, { type ReactNode } from "react";
import { motion } from "motion/react";
import Button from "./Button";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    onClick: () => void;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  footer?: ReactNode;
  className?: string;
  variant?: "section" | "compact" | "page";
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  footer,
  className = "",
  variant = "section",
}) => {
  const layoutClass = {
    section:
      "py-20 bg-surface rounded-3xl border border-dashed border-border-default",
    compact:
      "px-4 py-8 bg-surface rounded-2xl border border-dashed border-border-default",
    page: "min-h-[40vh] px-6 py-16 bg-canvas rounded-3xl",
  }[variant];
  const iconClass = variant === "compact" ? "h-12 w-12" : "h-16 w-16";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center text-center ${layoutClass} ${className}`}
    >
      <div
        className={`${iconClass} bg-canvas rounded-full flex items-center justify-center mb-4`}
      >
        <Icon
          className={
            variant === "compact"
              ? "h-6 w-6 text-neutral-300"
              : "h-8 w-8 text-neutral-300"
          }
        />
      </div>
      <h3 className="text-content-strong font-bold">{title}</h3>
      {description && (
        <p className="text-content-secondary text-sm mt-1 max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" className="mt-6" onClick={action.onClick}>
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </Button>
      )}
      {footer}
    </motion.div>
  );
};

export default EmptyState;
