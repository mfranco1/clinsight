import type { ReactNode } from "react";

interface ResponsiveTableSurfaceProps {
  label: string;
  children: ReactNode;
  contentClassName?: string;
  className?: string;
}

/** Shared frame for responsive record lists whose rows retain feature semantics. */
export default function ResponsiveTableSurface({
  label,
  children,
  contentClassName = "",
  className = "",
}: ResponsiveTableSurfaceProps) {
  return (
    <section
      role="region"
      aria-label={label}
      className={`overflow-hidden rounded-3xl border border-border-default bg-surface shadow-sm ${className}`}
    >
      <div className="overflow-x-auto no-scrollbar">
        <div className={`w-full min-w-full ${contentClassName}`}>
          {children}
        </div>
      </div>
    </section>
  );
}
