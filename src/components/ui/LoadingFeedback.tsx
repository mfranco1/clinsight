import type { HTMLAttributes, ReactNode } from "react";
import BrandMark from "../brand/BrandMark";
import { BRAND } from "../../config/brand";

interface LoadingIndicatorProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingIndicator({
  label = "Loading…",
  size = "md",
}: LoadingIndicatorProps) {
  const sizeClass = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-9 w-9 border-[3px]",
  }[size];

  return (
    <span
      className="inline-flex items-center gap-2 text-sm text-content-secondary"
      role="status"
    >
      <span
        aria-hidden="true"
        className={`${sizeClass} inline-block animate-spin rounded-full border-action border-t-transparent motion-reduce:animate-none`}
      />
      <span>{label}</span>
    </span>
  );
}

export function LoadingScreen({
  label = `Loading ${BRAND.name}…`,
}: {
  label?: string;
}) {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-canvas"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <BrandMark size="lg" className="mb-1" />
        <LoadingIndicator label={label} />
      </div>
    </main>
  );
}

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "line" | "circle";
};

export function Skeleton({
  className = "",
  variant = "line",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer ${variant === "circle" ? "rounded-full" : "rounded-control"} ${className}`}
      {...props}
    />
  );
}

interface SkeletonSectionProps {
  titleWidth?: string;
  rows?: number;
}

export function SkeletonSection({
  titleWidth = "w-40",
  rows = 3,
}: SkeletonSectionProps) {
  return (
    <section
      className="mb-5 rounded-xl border border-border-default bg-surface p-5"
      aria-hidden="true"
    >
      <Skeleton className={`mb-5 h-5 ${titleWidth}`} />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton
            key={index}
            className={`h-4 ${index === rows - 1 ? "w-2/3" : "w-full"}`}
          />
        ))}
      </div>
    </section>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <section
      className="m-4 rounded-control border border-danger-200 bg-danger-50 p-4 text-sm text-content-default"
      role="alert"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}
