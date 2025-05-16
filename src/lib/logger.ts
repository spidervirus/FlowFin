import { NextResponse } from "next/server";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private static formatMessage(
    message: string,
    error?: Error,
    data?: any,
  ): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      message,
      ...(error && { error: { message: error.message, stack: error.stack } }),
      ...(data && { data }),
    });
  }

  info(message: string, data?: any) {
    console.info(Logger.formatMessage(message, undefined, data));
  }

  warn(message: string, data?: any) {
    console.warn(Logger.formatMessage(message, undefined, data));
  }

  error(message: string, error?: Error, data?: any) {
    console.error(Logger.formatMessage(message, error, data));
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      console.debug(Logger.formatMessage(message, undefined, data));
    }
  }
}

export const logger = new Logger();

// Custom error class for application errors
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public data?: any,
  ) {
    super(message);
    this.name = "AppError";
  }

  public toResponse() {
    return NextResponse.json(
      {
        error: {
          message: this.message,
          code: this.code || "INTERNAL_ERROR",
          data: this.data,
        },
      },
      { status: this.statusCode },
    );
  }
}

// Error handler middleware
export async function errorHandler(error: unknown) {
  if (error instanceof AppError) {
    logger.error(error.message, error, { data: error.data });
    return error.toResponse();
  }

  if (error instanceof Error) {
    logger.error("Unhandled error", error);
    return NextResponse.json(
      {
        error: {
          message: "An unexpected error occurred",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 },
    );
  }

  logger.error("Unknown error type", new Error("Unknown error"), {
    originalError: error,
  });
  return NextResponse.json(
    {
      error: {
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      },
    },
    { status: 500 },
  );
}
