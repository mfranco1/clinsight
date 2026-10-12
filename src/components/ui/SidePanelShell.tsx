import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icons } from "./Icons";

interface SidePanelShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  closeOnEscape?: boolean;
}

/** A nonmodal right panel with a dismissible mobile backdrop. */
const SidePanelShell = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  headerActions,
  children,
  className = "",
  bodyClassName = "",
  closeOnEscape = false,
}: SidePanelShellProps) => (
  <Dialog.Root
    open={isOpen}
    modal={false}
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
  >
    <Dialog.Portal>
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm transition-opacity lg:hidden"
        />
      )}
      <Dialog.Content
        aria-modal="false"
        onEscapeKeyDown={(event) => {
          if (!closeOnEscape) event.preventDefault();
        }}
        onInteractOutside={(event) => event.preventDefault()}
        className={`fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-full flex-col border-l border-border-default bg-canvas shadow-2xl outline-none transition-transform duration-300 sm:w-[400px] ${className}`}
      >
        <div className="relative z-10 flex items-center justify-between border-b border-border-default bg-surface p-4 shadow-sm">
          <div className="flex min-w-0 items-center">
            {Icon && (
              <div className="mr-3 shrink-0 rounded-lg bg-action-100 p-1.5">
                <Icon className="h-5 w-5 text-action" />
              </div>
            )}
            <Dialog.Title className="truncate text-sm font-bold text-content-strong">
              {title}
            </Dialog.Title>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={`Close ${title}`}
                className="rounded-full p-1 text-content-muted transition-colors hover:bg-neutral-200 hover:text-content-default"
              >
                <Icons.Close className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
        </div>
        <div
          className={`custom-scrollbar min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}
        >
          {children}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export default SidePanelShell;
