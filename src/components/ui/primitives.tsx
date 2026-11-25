"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/90 text-card-foreground shadow-sm backdrop-blur-sm transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: "default" | "success" | "warning" | "danger" | "indigo" | "outline";
  className?: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground border-border",
    success:
      "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    warning:
      "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25",
    danger:
      "bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/25",
    indigo:
      "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
    outline: "bg-transparent text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    outline:
      "border border-border bg-transparent hover:bg-secondary/60 text-foreground",
    ghost: "hover:bg-secondary/70 text-muted-foreground hover:text-foreground",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs rounded-lg",
    md: "h-9 px-4 text-sm rounded-lg",
    lg: "h-11 px-5 text-sm rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ProgressRing({
  percentage,
  size = 64,
  strokeWidth = 6,
  label,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-indigo-500 transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-mono text-xs font-bold">{clamped}%</span>
        {label && <span className="text-[9px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

export function visaBadgeVariant(visa: string): "success" | "warning" | "danger" {
  const v = visa.toLowerCase();
  if (v === "high") return "success";
  if (v === "risky" || v === "severe") return "danger";
  return "warning";
}
