import React, { useState } from "react";
import { Icons } from "./Icons";

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  children,
  className = "",
  headerActions,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`bg-surface rounded-xl shadow-sm border border-border-default overflow-hidden mb-6 group/card ${className}`}
    >
      <div
        className={`px-5 py-4 border-b border-border-subtle bg-canvas/50 flex items-center justify-between gap-3 ${collapsible ? "cursor-pointer hover:bg-surface-muted transition-colors" : ""}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-1.5 rounded-lg bg-surface border border-border-default text-action shadow-sm">
              {icon}
            </div>
          )}
          <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-widest">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {headerActions && (
            <div onClick={(e) => e.stopPropagation()}>{headerActions}</div>
          )}
          {collapsible && (
            <Icons.ChevronDown
              className={`w-5 h-5 text-content-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>

      {(!collapsible || isExpanded) && (
        <div className="p-6 animate-fade-in">{children}</div>
      )}
    </div>
  );
};

export default SectionCard;
