"use client";

import React from "react";
import { AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrorMessageProps {
  message?: string | null;
  fieldErrors?: Record<string, string>;
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "destructive" | "warning";
  onDismiss?: () => void;
}

export function FormErrorMessage({
  message,
  fieldErrors,
  className,
  showIcon = true,
  variant = "destructive",
  onDismiss,
}: FormErrorMessageProps) {
  if (!message && (!fieldErrors || Object.keys(fieldErrors).length === 0)) {
    return null;
  }

  const variantClasses = {
    default: "bg-background border-border text-foreground",
    destructive: "bg-destructive/10 border-destructive/20 text-destructive",
    warning: "bg-warning/10 border-warning/20 text-warning-foreground",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-sm",
        variantClasses[variant],
        className,
      )}
      role="alert"
    >
      {showIcon && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
      <div className="flex-1">
        {message && <p className="font-medium">{message}</p>}
        {fieldErrors && Object.keys(fieldErrors).length > 0 && (
          <ul className="mt-1.5 list-disc pl-5 space-y-1">
            {Object.entries(fieldErrors).map(([field, error]) => (
              <li key={field}>
                <span className="font-medium">{field}:</span> {error}
              </li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded-full p-0.5 hover:bg-background/20 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Dismiss"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default FormErrorMessage;
