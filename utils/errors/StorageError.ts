import { AppError } from './AppError';

export class StorageError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}

export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}

export function handleStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new StorageError(error.message, { originalError: error.message });
  }
  
  return new StorageError('An unknown storage error occurred');
}
