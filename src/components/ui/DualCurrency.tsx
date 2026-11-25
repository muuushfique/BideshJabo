"use client";

import React from "react";
import { convertToBdt, formatBdt, formatLocalCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useCurrency } from "../providers/CurrencyProvider";

interface DualCurrencyProps {
  amount: number;
  currencyCode: string;
  suffix?: string;
  layout?: "inline" | "stack";
  size?: "sm" | "md" | "lg";
  className?: string;
  zeroLabel?: string;
}

export function DualCurrency({
  amount,
  currencyCode,
  suffix = "",
  layout = "stack",
  size = "md",
  className,
  zeroLabel,
}: DualCurrencyProps) {
  const { rateMap, formatMode } = useCurrency();
  const isBdt = currencyCode.toUpperCase() === "BDT";
  const bdt = convertToBdt(amount, currencyCode, rateMap);

  if (amount === 0 && zeroLabel) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <span className="font-mono font-semibold text-emerald-400">{zeroLabel}</span>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] text-emerald-400">
          ≈ 0 BDT
        </span>
      </div>
    );
  }

  const localText = isBdt
    ? formatBdt(amount, formatMode)
    : `${formatLocalCurrency(amount, currencyCode, rateMap)}${suffix}`;

  const bdtText = `≈ ${formatBdt(bdt, formatMode)}${suffix}`;

  const primarySize =
    size === "lg"
      ? "text-lg font-bold"
      : size === "sm"
      ? "text-xs font-semibold"
      : "text-sm font-semibold";

  return (
    <div
      className={cn(
        layout === "inline"
          ? "inline-flex flex-wrap items-center gap-1.5"
          : "flex flex-col items-start gap-0.5",
        className
      )}
    >
      <span className={cn("font-mono tabular-nums tracking-tight text-foreground", primarySize)}>
        {localText}
      </span>
      {!isBdt && (
        <span className="inline-flex items-center rounded border border-border/70 bg-secondary/70 px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-emerald-500 dark:text-emerald-400">
          {bdtText}
        </span>
      )}
    </div>
  );
}
