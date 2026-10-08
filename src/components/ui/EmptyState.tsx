import React from "react";
import { motion } from "motion/react";
import Button from "./Button";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    onClick: () => void;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`py-20 flex flex-col items-center justify-center text-center bg-surface rounded-3xl border border-dashed border-border-default ${className}`}
    >
      <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-neutral-300" />
      </div>
      <h3 className="text-content-strong font-bold">{title}</h3>
      <p className="text-content-secondary text-sm mt-1 max-w-xs">
        {description}
      </p>
      {action && (
        <Button variant="primary" className="mt-6" onClick={action.onClick}>
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
