"use client";

import * as React from "react";
import { CheckCircle2, HelpCircle, TrendingUp } from "lucide-react";
import { Badge } from "./badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export type ConfidenceLevel = "known_verified" | "statistical_association" | "unverifiable";

interface EvidenceBadgeProps {
  confidence: ConfidenceLevel;
  className?: string;
}

const config = {
  known_verified: {
    label: "Verified",
    icon: CheckCircle2,
    variant: "success" as const,
    tooltip: "High confidence. Data is verified by multiple primary sources.",
  },
  statistical_association: {
    label: "Associated",
    icon: TrendingUp,
    variant: "warning" as const,
    tooltip: "Medium confidence. Based on statistical patterns and indirect indicators.",
  },
  unverifiable: {
    label: "Unverified",
    icon: HelpCircle,
    variant: "outline" as const,
    tooltip: "Low confidence. Sparse or conflicting data sources.",
  },
};

export function EvidenceBadge({ confidence, className }: EvidenceBadgeProps) {
  const { label, icon: Icon, variant, tooltip } = config[confidence] || config.unverifiable;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>
            <Badge variant={variant} className="gap-1 cursor-help">
              <Icon className="h-3 w-3" />
              {label}
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
