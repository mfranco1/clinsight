import React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export interface PopoverContentProps extends React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
> {
  portalContainer?: HTMLElement;
}

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className = "",
      side = "bottom",
      sideOffset = 6,
      align = "start",
      collisionPadding = 8,
      portalContainer,
      children,
      ...props
    },
    ref,
  ) => (
    <PopoverPrimitive.Portal container={portalContainer}>
      <PopoverPrimitive.Content
        ref={ref}
        side={side}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={`z-50 max-h-[var(--radix-popover-content-available-height)] max-w-[var(--radix-popover-content-available-width)] overflow-y-auto border border-border-default bg-surface text-content-primary shadow-xl outline-none data-[state=open]:animate-fade-in ${className}`}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  ),
);

PopoverContent.displayName = "PopoverContent";
