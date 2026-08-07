"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "glass" | "accent";
  loading?: boolean;
  colSpan?: 1 | 2 | "full";
  delay?: number;
}

export function BentoCard({
  title,
  icon: Icon,
  actions,
  footer,
  children,
  variant = "default",
  loading = false,
  colSpan = 1,
  delay = 0,
  className,
  ...props
}: BentoCardProps) {
  const colSpanClass = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    full: "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4",
  }[colSpan];

  const variantClass = {
    default: "bg-card border-border",
    glass: "bg-card/50 backdrop-blur-md border-border/50",
    accent: "bg-card border-primary/50 relative overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-primary/10 before:to-transparent",
  }[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: "easeOut" }}
      className={cn(
        "group flex flex-col rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80",
        colSpanClass,
        variantClass,
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="font-semibold text-sm leading-none tracking-tight">{title}</h3>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex flex-col gap-3 w-full animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        ) : (
          children
        )}
      </div>

      {footer && (
        <div className="border-t border-border/50 bg-muted/20 px-4 py-3 text-sm">
          {footer}
        </div>
      )}
    </motion.div>
  );
}
