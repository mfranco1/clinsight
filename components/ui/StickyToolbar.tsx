import React from 'react';

interface StickyToolbarProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  stickyOffset?: string;
  containerClassName?: string;
  showOverflow?: boolean;
}

/**
 * A reusable sticky toolbar component for clinical views.
 * Handles the sticky positioning, glass effect, and consistent card styling.
 */
const StickyToolbar: React.FC<StickyToolbarProps> = ({
  leftContent,
  rightContent,
  children,
  className = "",
  stickyOffset = "top-0",
  containerClassName = "-mx-4 px-4 -mt-6 pt-6 pb-4 mb-8",
  showOverflow = false
}) => {
  return (
    <div className={`sticky ${stickyOffset} z-30 bg-transparent ${containerClassName} ${className}`}>
      <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 ${showOverflow ? '' : 'overflow-hidden'}`}>
        {children ? (
          children
        ) : (
          <div className="flex items-center justify-between px-4 py-2 min-h-[52px]">
            <div className="flex items-center gap-4 flex-1">
              {leftContent}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {rightContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyToolbar;
