import { AppError } from './AppError';

export class NetworkError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function handleNetworkError(error: unknown): NetworkError {
  if (error instanceof NetworkError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new NetworkError(error.message, { originalError: error.message });
  }
  
  return new NetworkError('An unknown network error occurred');
}
