"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreRing({ score, label, size = "md", className }: ScoreRingProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  const getColor = (s: number) => {
    if (s >= 80) return "stroke-emerald-500";
    if (s >= 60) return "stroke-amber-500";
    return "stroke-red-500";
  };

  const dimensions = {
    sm: { size: 48, strokeWidth: 4, text: "text-sm" },
    md: { size: 64, strokeWidth: 5, text: "text-lg" },
    lg: { size: 80, strokeWidth: 6, text: "text-xl" },
  };

  const { size: svgSize, strokeWidth, text: textSize } = dimensions[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative flex items-center justify-center">
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-[var(--color-muted)] fill-transparent"
          />
          {/* Progress circle */}
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className={cn("fill-transparent transition-colors duration-300", getColor(normalizedScore))}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <span className={cn("absolute font-semibold tabular-nums text-[var(--color-foreground)]", textSize)}>
          {normalizedScore}
        </span>
      </div>
      {label && <span className="text-xs font-medium text-[var(--color-muted-foreground)]">{label}</span>}
    </div>
  );
}
