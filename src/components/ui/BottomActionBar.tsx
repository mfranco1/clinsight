import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

interface BottomActionBarProps {
  isVisible: boolean;
  children: ReactNode;
  label: string;
  className?: string;
}

/** Nonmodal actions anchored above the bottom edge of their owning view. */
export default function BottomActionBar({
  isVisible,
  children,
  label,
  className = "",
}: BottomActionBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="absolute bottom-8 left-0 z-50 flex w-full justify-center px-4 pointer-events-none"
        >
          <div
            role="group"
            aria-label={label}
            className={`pointer-events-auto flex min-w-[280px] max-w-[95vw] items-center justify-between gap-3 rounded-2xl border border-border-default bg-surface bg-opacity-95 px-3 py-2.5 text-content-strong shadow-2xl backdrop-blur-md sm:max-w-[90vw] sm:min-w-fit sm:justify-start sm:gap-6 sm:px-6 sm:py-4 ${className}`}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
