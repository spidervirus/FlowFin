import { NextResponse } from 'next/server';

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private isProd: boolean;

  private constructor() {
    this.isProd = process.env.NODE_ENV === 'production';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, data?: any, error?: Error): LogMessage {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      error
    };
  }

  private log(logMessage: LogMessage) {
    if (this.isProd) {
      // In production, we would send this to a logging service
      // TODO: Implement production logging service (e.g., CloudWatch, Datadog)
      console.log(JSON.stringify(logMessage));
    } else {
      // In development, pretty print to console
      const { level, message, timestamp, data, error } = logMessage;
      console.log(`[${timestamp}] ${level}: ${message}`);
      if (data) console.log('Data:', data);
      if (error) console.error('Error:', error);
    }
  }

  public debug(message: string, data?: any) {
    if (!this.isProd) {
      this.log(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  public info(message: string, data?: any) {
    this.log(this.formatMessage(LogLevel.INFO, message, data));
  }

  public warn(message: string, data?: any) {
    this.log(this.formatMessage(LogLevel.WARN, message, data));
  }

  public error(message: string, error?: Error, data?: any) {
    this.log(this.formatMessage(LogLevel.ERROR, message, data, error));
  }
}

export const logger = Logger.getInstance();

// Custom error class for application errors
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  public toResponse() {
    return NextResponse.json(
      {
        error: {
          message: this.message,
          code: this.code || 'INTERNAL_ERROR',
          data: this.data
        }
      },
      { status: this.statusCode }
    );
  }
}

// Error handler middleware
export async function errorHandler(error: unknown) {
  if (error instanceof AppError) {
    logger.error(error.message, error, error.data);
    return error.toResponse();
  }

  if (error instanceof Error) {
    logger.error('Unhandled error', error);
    return NextResponse.json(
      {
        error: {
          message: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    );
  }

  logger.error('Unknown error type', new Error('Unknown error'), { error });
  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      }
    },
    { status: 500 }
  );
} 