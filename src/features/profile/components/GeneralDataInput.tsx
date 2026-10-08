import React from "react";

export const GeneralDataItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col">
    <span className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-1">
      {label}
    </span>
    <span className="text-sm font-medium text-content-strong">
      {value || "Not Recorded"}
    </span>
  </div>
);

export const GeneralDataInput: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex flex-col">
    <label className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1 -ml-2 rounded border border-action-300 shadow-sm text-sm font-medium text-content-strong focus:ring-1 focus:ring-focus-ring focus:border-action outline-none bg-surface"
    />
  </div>
);
