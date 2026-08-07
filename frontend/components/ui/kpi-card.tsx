"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  change?: number;
  format?: "number" | "currency" | "percent";
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  change,
  format = "number",
  className,
}: KpiCardProps) {
  // Simple formatters
  const formattedValue = React.useMemo(() => {
    if (typeof value === "string") return value;
    if (format === "currency") return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    if (format === "percent") return `${value}%`;
    return new Intl.NumberFormat('en-US').format(value);
  }, [value, format]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm transition-all hover:shadow-md hover:border-[var(--color-border)]/80",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--color-muted)]/20 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{title}</p>
          <motion.h3 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-3xl font-bold tracking-tight text-[var(--color-foreground)]"
          >
            {formattedValue}
          </motion.h3>
          
          {(trend || change !== undefined) && (
            <div className="flex items-center gap-1 text-sm font-medium">
              {trend === "up" && <ArrowUpIcon className="h-4 w-4 text-emerald-500" />}
              {trend === "down" && <ArrowDownIcon className="h-4 w-4 text-red-500" />}
              {trend === "neutral" && <ArrowRightIcon className="h-4 w-4 text-[var(--color-muted-foreground)]" />}
              
              <span className={cn(
                trend === "up" ? "text-emerald-500" : 
                trend === "down" ? "text-red-500" : 
                "text-[var(--color-muted-foreground)]"
              )}>
                {change !== undefined ? `${change > 0 ? '+' : ''}${change}%` : trend}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-[var(--color-muted)]/50 p-2 text-[var(--color-muted-foreground)]">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
