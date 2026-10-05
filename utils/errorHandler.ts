import { AppError } from './errors/AppError';
import { logger } from './logger';

export function handleError(error: unknown, context?: string): AppError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(error.message, 'UNKNOWN_ERROR', {
      originalError: error.message,
      stack: error.stack,
    });
  } else {
    appError = new AppError('An unknown error occurred', 'UNKNOWN_ERROR', {
      originalError: String(error),
    });
  }

  // Log the error
  logger.error(`Error in ${context || 'unknown context'}:`, {
    error: appError.toJSON(),
    context,
  });

  return appError;
}

export function logError(error: unknown, context?: string): void {
  // handleError already logs through the logger — don't double-log.
  handleError(error, context);
}
