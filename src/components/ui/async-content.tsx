"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type AsyncContentState = "loading" | "success" | "error" | "empty";

interface AsyncContentProps<T = any> {
  /** Content to display when data is loaded */
  children: ReactNode;
  
  /** Current state of the async operation */
  state: AsyncContentState;
  
  /** Optional error message to display */
  error?: string | Error | null;
  
  /** Optional empty state message */
  emptyMessage?: string;
  
  /** Optional callback for retry functionality */
  onRetry?: () => void;
  
  /** Optional loading component or text */
  loadingContent?: ReactNode;
  
  /** Optional height for the loading state */
  minHeight?: string;
  
  /** Optional className for the container */
  className?: string;
  
  /** Whether to show a refresh button in error state */
  showRetry?: boolean;
  
  /** Optional callback for when content is first successfully loaded */
  onLoaded?: () => void;
  
  /** Skip loading state if it's too quick (ms) */
  skipLoadingThreshold?: number;
}

export function AsyncContent<T = any>({
  children,
  state,
  error,
  emptyMessage = "No data available",
  onRetry,
  loadingContent,
  minHeight = "150px",
  className = "",
  showRetry = true,
  onLoaded,
  skipLoadingThreshold = 300,
}: AsyncContentProps<T>) {
  const [showLoading, setShowLoading] = useState(false);
  const [wasSuccessful, setWasSuccessful] = useState(false);
  
  useEffect(() => {
    if (state === "loading") {
      const timer = setTimeout(() => {
        setShowLoading(true);
      }, skipLoadingThreshold);
      
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
      
      if (state === "success" && !wasSuccessful) {
        setWasSuccessful(true);
        onLoaded?.();
      }
    }
  }, [state, skipLoadingThreshold, onLoaded, wasSuccessful]);
  
  // Format error message
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === "string" 
      ? error 
      : "An unexpected error occurred";

  // Render based on state
  return (
    <div 
      style={{ minHeight: state === "loading" && showLoading ? minHeight : undefined }}
      className={className}
      aria-busy={state === "loading"}
    >
      {state === "loading" && showLoading ? (
        loadingContent || (
          <div className="flex flex-col items-center justify-center w-full h-full py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )
      ) : state === "error" ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{errorMessage}</p>
            {showRetry && onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="self-start mt-2"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : state === "empty" ? (
        <div className="flex flex-col items-center justify-center w-full py-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
          {showRetry && onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="mt-4"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * Hook to manage async content state
 */
export function useAsyncContent<T = any>(
  initialState: AsyncContentState = "loading"
) {
  const [state, setState] = useState<AsyncContentState>(initialState);
  const [error, setInternalError] = useState<string | Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  
  const setLoading = () => setState("loading");
  const setSuccess = (data: T) => {
    setState("success");
    setData(data);
    setInternalError(null);
  };
  const setEmpty = () => setState("empty");
  const setError = (err: string | Error) => {
    setState("error");
    setInternalError(err);
  };
  
  return {
    state,
    error,
    data,
    setLoading,
    setSuccess,
    setEmpty,
    setError,
    reset: () => {
      setState("loading");
      setInternalError(null);
      setData(null);
    }
  };
}