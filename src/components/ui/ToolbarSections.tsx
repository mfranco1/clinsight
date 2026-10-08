import React from "react";
import { Icons } from "./Icons";

/**
 * Reusable sections for the StickyToolbar to ensure consistency across views.
 */

// 1. ToolbarCount - Displays the number of items
export const ToolbarCount: React.FC<{ count: number; label: string }> = ({
  count,
  label,
}) => (
  <div className="items-center px-1 hidden sm:flex">
    <span className="text-[10px] font-bold text-content-secondary uppercase tracking-wide whitespace-nowrap">
      {count} {label}
    </span>
  </div>
);

// 2. ToolbarSearch - Standardized search input
export const ToolbarSearch: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "max-w-sm hidden sm:flex",
}) => (
  <div className={`relative flex-1 ${className} items-center gap-2`}>
    <div className="relative flex-1">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icons.Search className="h-3.5 w-3.5 text-content-secondary" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-muted/50 hover:bg-surface-muted border border-border-default rounded-lg text-xs pl-9 pr-3 py-2 focus:ring-1 focus:ring-focus-ring focus:border-action focus:bg-surface outline-none text-content-primary transition-all font-medium placeholder-neutral-400 shadow-inner"
        placeholder={placeholder}
      />
    </div>
  </div>
);

// 3. ToolbarFilterToggle - Button to toggle filter panel
export const ToolbarFilterToggle: React.FC<{
  isExpanded: boolean;
  onClick: () => void;
  activeCount?: number;
  hideLabelOnMobile?: boolean;
}> = ({ isExpanded, onClick, activeCount = 0, hideLabelOnMobile = false }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center ${hideLabelOnMobile ? "px-2 sm:px-3" : "px-3"} py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 whitespace-nowrap group ${
      isExpanded
        ? "bg-action-subtle text-action-hover border border-action-100"
        : "text-content-secondary hover:bg-canvas border border-transparent"
    }`}
  >
    <Icons.Filter
      className={`w-3.5 h-3.5 ${hideLabelOnMobile ? "sm:mr-2" : "mr-2"}`}
    />
    <span className={hideLabelOnMobile ? "hidden sm:inline-block" : ""}>
      Filters
    </span>
    {activeCount > 0 && (
      <span
        className={`ml-1.5 bg-action text-white text-[9px] px-1.5 py-0.5 rounded-full ${hideLabelOnMobile && !isExpanded ? "absolute -top-1 -right-1 sm:static sm:h-auto sm:w-auto h-3 w-3 flex items-center justify-center p-0" : ""}`}
      >
        {hideLabelOnMobile && !isExpanded ? (
          <span className="sm:hidden w-3 h-3 block" />
        ) : null}
        <span
          className={
            hideLabelOnMobile && !isExpanded ? "hidden sm:inline-block" : ""
          }
        >
          {activeCount}
        </span>
      </span>
    )}
  </button>
);

// 4. ToolbarButton - Generic button for toolbar actions
export const ToolbarButton: React.FC<{
  onClick: () => void;
  icon?: React.ElementType;
  label?: string;
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "ghost"
    | "outline"
    | "active";
  className?: string;
  disabled?: boolean;
  title?: string;
  showIndicator?: boolean;
  hideLabelOnMobile?: boolean;
}> = ({
  onClick,
  icon: Icon,
  label,
  variant = "secondary",
  className = "",
  disabled = false,
  title,
  showIndicator,
  hideLabelOnMobile = false,
}) => {
  const variants = {
    primary:
      "text-action-hover bg-action-subtle hover:bg-action-100 border-transparent",
    secondary: "text-content-default hover:bg-canvas border-transparent",
    danger: "text-danger-600 hover:bg-danger-50 border-transparent",
    success:
      "text-success-700 bg-success-50 hover:bg-success-100 border-transparent",
    ghost: "text-content-secondary hover:bg-canvas border-transparent",
    outline:
      "text-content-default border border-border-default hover:bg-canvas",
    active: "text-action-hover bg-action-subtle border border-action-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className={`flex items-center ${Icon && hideLabelOnMobile ? "px-2 sm:px-4" : "px-4"} py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap group active:scale-95 disabled:opacity-50 disabled:pointer-events-none relative ${variants[variant]} ${className}`}
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 ${label ? (hideLabelOnMobile ? "sm:mr-2" : "mr-2") : ""} ${variant === "secondary" || variant === "outline" ? "text-content-muted group-hover:text-action transition-colors" : ""}`}
        />
      )}
      {label && (
        <span className={hideLabelOnMobile ? "hidden sm:inline-block" : ""}>
          {label}
        </span>
      )}
      {showIndicator && (
        <span className="absolute right-1.5 w-1.5 h-1.5 bg-action-subtle rounded-full border border-white" />
      )}
    </button>
  );
};

// 5. ToolbarPagination - Standardized pagination controls
export const ToolbarPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  showPageSelector?: boolean;
  customLabel?: React.ReactNode;
  className?: string;
}> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  showPageSelector = true,
  customLabel,
  className = "",
}) => {
  if (totalPages <= 1 && !customLabel) return null;

  const canPrev = hasPrev !== undefined ? hasPrev : currentPage > 1;
  const canNext = hasNext !== undefined ? hasNext : currentPage < totalPages;

  const handlePrev = () => {
    if (onPrev) onPrev();
    else onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (onNext) onNext();
    else onPageChange(currentPage + 1);
  };

  return (
    <div
      className={`flex items-center bg-surface-muted/50 rounded-lg p-0.5 border border-border-default ${className}`}
    >
      <button
        onClick={handlePrev}
        disabled={!canPrev}
        className={`p-1 rounded-md transition-all ${
          !canPrev
            ? "text-neutral-300 cursor-not-allowed"
            : "text-content-default hover:bg-surface hover:shadow-sm"
        }`}
      >
        <Icons.ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {customLabel ? (
        customLabel
      ) : showPageSelector ? (
        <div className="relative flex items-center px-2 cursor-pointer hover:bg-surface/50 rounded transition-colors">
          <select
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="appearance-none bg-transparent text-[10px] font-bold text-content-primary outline-none cursor-pointer pr-1 z-10"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                Page {p}
              </option>
            ))}
          </select>
          <span className="text-[10px] font-medium text-content-muted ml-1">
            of {totalPages}
          </span>
        </div>
      ) : (
        <div className="px-2 text-[10px] font-bold text-content-primary">
          {currentPage} / {totalPages}
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!canNext}
        className={`p-1 rounded-md transition-all ${
          !canNext
            ? "text-neutral-300 cursor-not-allowed"
            : "text-content-default hover:bg-surface hover:shadow-sm"
        }`}
      >
        <Icons.ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// 6. ToolbarSeparator - Vertical line to separate groups
export const ToolbarSeparator: React.FC<{ className?: string }> = ({
  className = "",
}) => <div className={`h-4 w-px bg-surface-muted mx-1 ${className}`}></div>;

// 7. ToolbarSelect - Standardized dropdown for toolbar
export const ToolbarSelect: React.FC<{
  value: string | number;
  onChange: (val: string) => void;
  options: { value: string | number; label: string }[];
  label?: string;
  className?: string;
}> = ({ value, onChange, options, label, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    {label && (
      <label className="text-[9px] font-bold text-content-muted uppercase tracking-wider mb-1 ml-0.5">
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-border-default bg-surface rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-focus-ring focus:border-action outline-none text-content-primary shadow-sm transition-all cursor-pointer appearance-none h-[31px] pr-8"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: `right 0.4rem center`,
        backgroundRepeat: `no-repeat`,
        backgroundSize: `1.2em 1.2em`,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
