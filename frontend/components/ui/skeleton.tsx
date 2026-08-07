"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "text" | "circular" | "rectangular";
  }
>(({ className, variant = "rectangular", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "animate-pulse bg-[var(--color-muted)]",
        {
          "rounded-md": variant === "rectangular",
          "rounded-full": variant === "circular",
          "rounded h-4 w-full": variant === "text",
        },
        className
      )}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";

export { Skeleton };
