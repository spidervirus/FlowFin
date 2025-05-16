/**
 * Async Utilities
 * 
 * This file provides utilities for handling asynchronous operations safely,
 * including timeouts, retries, debouncing, and race condition prevention.
 */

/**
 * Executes an async function with a timeout
 * @param asyncFn The async function to execute
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutError Custom error to throw on timeout
 */
export async function withTimeout<T>(
  asyncFn: () => Promise<T>,
  timeoutMs: number = 5000,
  timeoutError: Error = new Error('Operation timed out')
): Promise<T> {
  return Promise.race([
    asyncFn(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(timeoutError), timeoutMs);
    }),
  ]);
}

/**
 * Retries an async function with exponential backoff
 * @param asyncFn The async function to retry
 * @param options Configuration options
 */
export async function withRetry<T>(
  asyncFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    retryableErrors?: (error: any) => boolean;
    onRetry?: (error: any, attempt: number, delay: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 200,
    maxDelayMs = 5000,
    backoffFactor = 2,
    retryableErrors = () => true,
    onRetry = () => {},
  } = options;

  let lastError: any;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !retryableErrors(error)) {
        throw error;
      }

      // Calculate next delay with exponential backoff
      const nextDelay = Math.min(delay * backoffFactor, maxDelayMs);
      
      // Notify about retry
      onRetry(error, attempt + 1, nextDelay);
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, nextDelay));
      
      delay = nextDelay;
    }
  }

  throw lastError;
}

/**
 * Debounces an async function
 * @param asyncFn The async function to debounce
 * @param delayMs Time in milliseconds to wait
 */
export function debounceAsync<T, A extends any[]>(
  asyncFn: (...args: A) => Promise<T>,
  delayMs: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<T> | null = null;
  let resolveRef: ((value: T) => void) | null = null;
  let rejectRef: ((reason: any) => void) | null = null;

  return (...args: A): Promise<T> => {
    // Clear previous timeout if any
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Create a new promise if needed or return existing one
    if (!pendingPromise) {
      pendingPromise = new Promise<T>((resolve, reject) => {
        resolveRef = resolve;
        rejectRef = reject;
      });
    }

    // Set up new timeout
    timeoutId = setTimeout(async () => {
      try {
        const result = await asyncFn(...args);
        resolveRef?.(result);
      } catch (error) {
        rejectRef?.(error);
      } finally {
        // Reset for next call
        timeoutId = null;
        pendingPromise = null;
        resolveRef = null;
        rejectRef = null;
      }
    }, delayMs);

    return pendingPromise;
  };
}

/**
 * Throttles an async function
 * @param asyncFn The async function to throttle
 * @param limitMs Minimum time between invocations
 */
export function throttleAsync<T, A extends any[]>(
  asyncFn: (...args: A) => Promise<T>,
  limitMs: number = 300
) {
  let lastCallTime = 0;
  let pendingCall = false;
  let pendingArgs: A | null = null;

  return async (...args: A): Promise<T> => {
    const now = Date.now();
    const timeElapsed = now - lastCallTime;

    if (timeElapsed >= limitMs && !pendingCall) {
      // It's been long enough since the last call
      lastCallTime = now;
      return asyncFn(...args);
    } else {
      // Schedule a call for later
      pendingArgs = args;
      
      if (!pendingCall) {
        pendingCall = true;
        
        // Wait for the throttle period
        const waitTime = Math.max(0, limitMs - timeElapsed);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Execute with the most recent args
        lastCallTime = Date.now();
        pendingCall = false;
        
        const argsToUse = pendingArgs || args;
        pendingArgs = null;
        
        return asyncFn(...argsToUse);
      }
      
      // Return a promise that resolves when the pending call completes
      return new Promise<T>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!pendingCall) {
            clearInterval(checkInterval);
            resolve(asyncFn(...(pendingArgs || args)));
            pendingArgs = null;
          }
        }, 50);
      });
    }
  };
}

/**
 * Creates a cancellable async operation
 */
export function cancellable<T>(
  asyncFn: (signal: AbortSignal) => Promise<T>
): { 
  promise: Promise<T>; 
  cancel: (reason?: string) => void;
} {
  const controller = new AbortController();
  
  const promise = (async () => {
    try {
      return await asyncFn(controller.signal);
    } catch (error) {
      // Re-throw but check for abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Operation cancelled by user');
      }
      throw error;
    }
  })();
  
  return {
    promise,
    cancel: (reason?: string) => controller.abort(reason)
  };
}

/**
 * Creates a cancellable, retriable async operation with timeout
 */
export function createAsyncOperation<T>(
  asyncFn: (signal: AbortSignal) => Promise<T>,
  options: {
    timeoutMs?: number;
    retries?: number;
    retryDelayMs?: number;
    onRetry?: (error: any, attempt: number) => void;
  } = {}
) {
  const { 
    timeoutMs = 10000,
    retries = 2,
    retryDelayMs = 1000,
    onRetry = () => {}
  } = options;
  
  const controller = new AbortController();
  const { signal } = controller;
  
  // Wrapper function for retries
  const executeWithRetries = async (): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (signal.aborted) {
        throw new Error('Operation cancelled');
      }
      
      try {
        // Execute with timeout
        return await withTimeout(
          () => asyncFn(signal),
          timeoutMs,
          new Error(`Operation timed out after ${timeoutMs}ms`)
        );
      } catch (error) {
        lastError = error;
        
        // Don't retry if it was cancelled or final attempt
        if (signal.aborted || attempt === retries) {
          throw error;
        }
        
        // Call retry handler
        onRetry(error, attempt + 1);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
    
    throw lastError;
  };
  
  return {
    promise: executeWithRetries(),
    cancel: (reason?: string) => controller.abort(reason),
    signal
  };
}

/**
 * Race condition prevention through request ID tracking
 */
export function createRequestManager<T, P extends any[]>() {
  let latestRequestId = 0;
  
  return {
    execute: async (
      asyncFn: (...params: P) => Promise<T>,
      ...params: P
    ): Promise<T | null> => {
      const requestId = ++latestRequestId;
      
      try {
        const result = await asyncFn(...params);
        
        // Only return result if this is still the latest request
        if (requestId === latestRequestId) {
          return result;
        } else {
          // This request is stale, discard result
          return null;
        }
      } catch (error) {
        // Only propagate error if this is still the latest request
        if (requestId === latestRequestId) {
          throw error;
        } else {
          // This request is stale, discard error
          return null;
        }
      }
    },
    
    reset: () => {
      latestRequestId = 0;
    }
  };
}

/**
 * Simple async queue for sequential execution
 */
export function createAsyncQueue() {
  let queue: (() => Promise<void>)[] = [];
  let processing = false;
  
  const processQueue = async () => {
    if (processing || queue.length === 0) return;
    
    processing = true;
    
    try {
      const task = queue.shift();
      if (task) {
        await task();
      }
    } finally {
      processing = false;
      
      // Process next item if any
      if (queue.length > 0) {
        processQueue();
      }
    }
  };
  
  return {
    enqueue: async <T>(task: () => Promise<T>): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        queue.push(async () => {
          try {
            const result = await task();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        
        processQueue();
      });
    },
    
    clear: () => {
      queue = [];
    },
    
    get size() {
      return queue.length;
    },
    
    get isProcessing() {
      return processing;
    }
  };
}