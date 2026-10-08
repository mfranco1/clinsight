import React, { useRef, useState } from "react";
import { Icons } from "./Icons";
import { usePortalDropdownPosition } from "../../hooks/usePortalDropdownPosition";
import PortalMenu from "./PortalMenu";

interface StatusDropdownProps<TStatus extends string> {
  status: TStatus;
  options: readonly TStatus[];
  onChange: (status: TStatus) => void;
  getTriggerColor: (status: TStatus) => string;
  isDesktop?: boolean;
  className?: string;
}

const StatusDropdown = <TStatus extends string>({
  status,
  options,
  onChange,
  getTriggerColor,
  isDesktop = false,
  className = "",
}: StatusDropdownProps<TStatus>) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownPosition = usePortalDropdownPosition(
    isOpen,
    isDesktop,
    buttonRef,
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-center px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all shadow-sm w-full min-w-[80px] ${getTriggerColor(status)}`}
      >
        <span className="truncate">{status}</span>
        <Icons.ChevronDown
          className={`w-3 h-3 ml-1 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <PortalMenu
        isOpen={isOpen}
        isDesktop={isDesktop}
        position={dropdownPosition}
        onClose={() => setIsOpen(false)}
      >
        <div className="max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((option) => (
            <button
              key={option}
              onClick={(event) => {
                event.stopPropagation();
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                status === option
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {option}
              {status === option && (
                <Icons.Check className="w-3 h-3 text-teal-600" />
              )}
            </button>
          ))}
        </div>
      </PortalMenu>
    </div>
  );
};

export default StatusDropdown;
