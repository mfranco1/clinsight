import * as Select from "@radix-ui/react-select";
import { Icons } from "./Icons";

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
}: StatusDropdownProps<TStatus>) => (
  <Select.Root
    value={status}
    onValueChange={(value) => onChange(value as TStatus)}
  >
    <Select.Trigger
      aria-label={status}
      onClick={(event) => event.stopPropagation()}
      className={`flex min-w-[80px] w-full items-center justify-center rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${getTriggerColor(status)} ${className}`}
    >
      <Select.Value>{status}</Select.Value>
      <Select.Icon asChild>
        <Icons.ChevronDown className="ml-1 h-3 w-3 shrink-0" />
      </Select.Icon>
    </Select.Trigger>

    <Select.Portal>
      <Select.Content
        position="popper"
        align={isDesktop ? "center" : "start"}
        sideOffset={4}
        className="z-[110] max-h-[min(var(--radix-select-content-available-height),15rem)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-border-subtle bg-surface p-1.5 shadow-2xl"
      >
        <Select.Viewport className="custom-scrollbar max-h-[inherit] overflow-y-auto">
          {options.map((option) => (
            <Select.Item
              key={option}
              value={option}
              className="relative flex cursor-default select-none items-center justify-between rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-content-default outline-none data-[highlighted]:bg-canvas data-[highlighted]:text-content-strong data-[state=checked]:bg-action-subtle data-[state=checked]:text-action-hover"
            >
              <Select.ItemText>{option}</Select.ItemText>
              <Select.ItemIndicator>
                <Icons.Check className="h-3 w-3 text-action" />
              </Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
);

export default StatusDropdown;
