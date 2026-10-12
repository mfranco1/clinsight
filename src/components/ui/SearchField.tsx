import React from "react";
import { Icons } from "./Icons";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  onClear?: () => void;
  pending?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

/** Branded search input; matching, normalization, and query ownership stay with its caller. */
export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  label,
  placeholder = "Search...",
  onClear,
  pending = false,
  disabled = false,
  className = "",
  inputClassName = "",
}) => (
  <div className={`relative flex-1 ${className}`}>
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icons.Search className="h-3.5 w-3.5 text-content-secondary" />
    </div>
    <input
      type="text"
      aria-label={label}
      aria-busy={pending || undefined}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full bg-surface-muted/50 hover:bg-surface-muted border border-border-default rounded-lg text-xs pl-9 pr-9 py-2 focus:ring-1 focus:ring-focus-ring focus:border-action focus:bg-surface outline-none text-content-primary transition-all font-medium placeholder-neutral-400 shadow-inner disabled:opacity-60 disabled:cursor-not-allowed ${inputClassName}`}
      placeholder={placeholder}
    />
    {pending ? (
      <span
        className="absolute inset-y-0 right-0 flex items-center px-2 text-content-muted"
        aria-hidden="true"
      >
        <Icons.Loader className="h-3.5 w-3.5" />
      </span>
    ) : onClear && value ? (
      <button
        type="button"
        aria-label={`Clear ${label.toLowerCase()}`}
        onClick={onClear}
        disabled={disabled}
        className="absolute inset-y-0 right-0 flex items-center px-2 text-content-muted hover:text-content-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed"
      >
        <Icons.Close className="h-3.5 w-3.5" />
      </button>
    ) : null}
  </div>
);
