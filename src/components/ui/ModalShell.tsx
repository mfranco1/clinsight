import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icons } from "./Icons";

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  showCloseButton?: boolean;
  ariaLabel?: string;
  description?: React.ReactNode;
  placement?: "center" | "bottom" | "right";
  closeOnInteractOutside?: boolean;
  closeOnEscape?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
} as const;

const bottomSizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  full: "sm:max-w-full",
} as const;

const ModalShell = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconBgColor = "bg-action-100 text-action-hover",
  size = "lg",
  children,
  footerActions,
  headerActions,
  className = "",
  bodyClassName = "",
  showCloseButton = true,
  ariaLabel,
  description,
  placement = "center",
  closeOnInteractOutside = true,
  closeOnEscape = true,
}: ModalShellProps) => (
  <Dialog.Root
    open={isOpen}
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
  >
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay fixed inset-0 z-[100] bg-neutral-900/50 backdrop-blur-sm" />
      <Dialog.Content
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel || "Dialog"}
        onInteractOutside={(event) => {
          if (!closeOnInteractOutside) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (!closeOnEscape) event.preventDefault();
        }}
        className={`dialog-content fixed z-[101] flex max-h-[85dvh] flex-col overflow-hidden border border-border-default bg-surface shadow-2xl outline-none ${
          placement === "bottom"
            ? `inset-x-0 bottom-0 mx-auto max-h-[90dvh] w-full max-w-full translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl ${bottomSizeClasses[size]}`
            : placement === "right"
              ? "inset-y-0 right-0 h-[100dvh] max-h-none w-full max-w-full translate-x-0 translate-y-0 rounded-none sm:max-w-md sm:rounded-l-2xl"
              : `left-1/2 top-1/2 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl ${sizeClasses[size]}`
        } ${className}`}
      >
        {!title && (
          <Dialog.Title className="sr-only">
            {ariaLabel || "Dialog"}
          </Dialog.Title>
        )}
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-canvas/50 px-6 py-4">
            <div className="flex min-w-0 items-center">
              {Icon && (
                <div className={`mr-3 shrink-0 rounded-lg p-2 ${iconBgColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <Dialog.Title className="truncate text-base font-bold text-content-strong">
                {title}
              </Dialog.Title>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {headerActions}
              {showCloseButton && (
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close modal"
                    className="rounded-full p-1 text-content-muted transition-colors hover:bg-neutral-200 hover:text-content-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <Icons.Close className="h-6 w-6" />
                  </button>
                </Dialog.Close>
              )}
            </div>
          </div>
        )}

        {description && (
          <Dialog.Description className="sr-only">
            {description}
          </Dialog.Description>
        )}

        <div
          className={`custom-scrollbar flex-1 overflow-y-auto ${bodyClassName}`}
        >
          {children}
        </div>

        {footerActions && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border-subtle bg-canvas px-6 py-4">
            {footerActions}
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export default ModalShell;
