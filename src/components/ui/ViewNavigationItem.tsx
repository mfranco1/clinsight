import type { ComponentType, MouseEventHandler } from "react";

interface ViewNavigationItemProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  displayLabel?: string;
  active: boolean;
  layout: "sidebar" | "bottom";
  collapsed?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

/** A view-navigation control with shared current-page semantics. */
export default function ViewNavigationItem({
  icon: Icon,
  label,
  displayLabel = label,
  active,
  layout,
  collapsed = false,
  onClick,
}: ViewNavigationItemProps) {
  const className =
    layout === "sidebar"
      ? `w-full flex items-center rounded-xl transition-all duration-200 group relative ${collapsed ? "justify-center h-12 p-0" : "px-4 py-3 text-sm font-semibold"} ${active ? "bg-action-subtle text-action-hover ring-1 ring-action-100 font-bold" : "text-content-muted hover:bg-canvas hover:text-content-strong"} cursor-pointer`
      : `flex flex-col items-center justify-center flex-1 h-full px-1 transition-all ${active ? "text-action scale-110" : "text-content-strong"}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={layout === "bottom" || collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={className}
    >
      <span
        className={
          layout === "sidebar"
            ? `transition-colors shrink-0 ${active ? "text-action" : "text-content-secondary group-hover:text-action"}`
            : ""
        }
      >
        <Icon className={layout === "sidebar" ? "h-5 w-5" : "w-5 h-5 mb-1"} />
      </span>
      {layout === "sidebar" ? (
        !collapsed && (
          <span className="ml-3 whitespace-nowrap animate-fade-in">
            {label}
          </span>
        )
      ) : (
        <span className="text-[10px] font-bold uppercase tracking-tighter truncate w-full text-center">
          {displayLabel}
        </span>
      )}
      {layout === "sidebar" && active && collapsed && (
        <span
          aria-hidden="true"
          className="absolute left-0 h-6 w-1 rounded-r-full bg-action-subtle"
        />
      )}
    </button>
  );
}
