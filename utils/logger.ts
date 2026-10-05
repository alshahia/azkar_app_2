/**
 * Centralized logging service.
 * 
 * In development, logs go to the console. In production, error-level logs
 * can be forwarded to a telemetry service. Respects log levels and provides
 * structured logging with context.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private static instance: Logger;
  private level: LogLevel;
  private isProduction: boolean;

  private constructor() {
    this.level = (import.meta.env?.VITE_LOG_LEVEL as LogLevel) || 'debug';
    this.isProduction = import.meta.env?.PROD ?? false;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ' ' + JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        // In production, forward to telemetry service
        if (this.isProduction) {
          this.forwardToTelemetry();
        }
        break;
    }
  }

  private forwardToTelemetry(): void {
    // Placeholder for telemetry integration (Sentry, LogRocket, etc.)
    // This would be replaced with actual telemetry calls
    // Example: Sentry.captureMessage(message, { extra: context });
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }
}

export const logger = Logger.getInstance();
export default logger;
