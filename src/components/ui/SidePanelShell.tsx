import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icons } from "./Icons";

interface SidePanelShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  headerDescription?: React.ReactNode;
  headerActions?: React.ReactNode;
  beforeHeader?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  backdropClassName?: string;
  style?: React.CSSProperties;
  bodyScrollable?: boolean;
  keepMounted?: boolean;
  closeOnEscape?: boolean;
}

/** A nonmodal right panel with a dismissible mobile backdrop. */
const SidePanelShell = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  headerDescription,
  headerActions,
  beforeHeader,
  children,
  className = "",
  bodyClassName = "",
  backdropClassName = "fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm transition-opacity lg:hidden",
  style,
  bodyScrollable = true,
  keepMounted = false,
  closeOnEscape = false,
}: SidePanelShellProps) => (
  <Dialog.Root
    open={isOpen}
    modal={false}
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
  >
    <Dialog.Portal {...(keepMounted ? { forceMount: true } : {})}>
      {(isOpen || keepMounted) && (
        <>
          {isOpen && (
            <div
              aria-hidden="true"
              onClick={onClose}
              className={backdropClassName}
            />
          )}
          <Dialog.Content
            {...(keepMounted ? { forceMount: true } : {})}
            aria-modal="false"
            aria-hidden={!isOpen}
            inert={!isOpen}
            onEscapeKeyDown={(event) => {
              if (!closeOnEscape) event.preventDefault();
            }}
            onInteractOutside={(event) => event.preventDefault()}
            style={style}
            className={`fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-full flex-col border-l border-border-default bg-canvas shadow-2xl outline-none transition-transform duration-300 data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full sm:w-[400px] ${className}`}
          >
            {beforeHeader}
            <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-border-default bg-surface p-4 shadow-sm">
              <div className="flex min-w-0 items-center">
                {Icon && (
                  <div className="mr-3 shrink-0 rounded-lg bg-action-100 p-1.5">
                    <Icon className="h-5 w-5 text-action" />
                  </div>
                )}
                <div className="min-w-0">
                  <Dialog.Title className="truncate text-sm font-bold text-content-strong">
                    {title}
                  </Dialog.Title>
                  {headerDescription && (
                    <p className="text-xs text-content-secondary">
                      {headerDescription}
                    </p>
                  )}
                </div>
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
              className={`${bodyScrollable ? "custom-scrollbar overflow-y-auto" : "overflow-hidden"} min-h-0 flex-1 ${bodyClassName}`}
            >
              {children}
            </div>
          </Dialog.Content>
        </>
      )}
    </Dialog.Portal>
  </Dialog.Root>
);

export default SidePanelShell;
