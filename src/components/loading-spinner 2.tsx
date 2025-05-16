"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: "default" | "primary" | "secondary" | "muted";
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = "md",
  className,
  color = "primary",
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const colorClasses = {
    default: "text-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    muted: "text-muted-foreground",
  };

  const spinner = (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
        {text && (
          <p className={cn("mt-4 text-sm font-medium", colorClasses[color])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex flex-col items-center justify-center">
        {spinner}
        <p className={cn("mt-2 text-sm font-medium", colorClasses[color])}>
          {text}
        </p>
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
