import React from 'react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }> | any;
  title: string;
  description: string;
  action?: {
    onClick: () => void;
    label: string;
    icon?: React.ComponentType<{ className?: string }> | any;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
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
      className={`py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-slate-200 ${className}`}
    >
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-slate-900 font-bold">{title}</h3>
      <p className="text-slate-500 text-sm mt-1 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all flex items-center gap-2"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
