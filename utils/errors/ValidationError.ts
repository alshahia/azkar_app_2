import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`Field "${fieldName}" is required`, { field: fieldName });
  }
}

export function validateString(value: unknown, fieldName: string, options?: { minLength?: number; maxLength?: number }): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`Field "${fieldName}" must be a string`, { field: fieldName });
  }
  
  if (options?.minLength !== undefined && value.length < options.minLength) {
    throw new ValidationError(
      `Field "${fieldName}" must be at least ${options.minLength} characters`,
      { field: fieldName, minLength: options.minLength }
    );
  }
  
  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(
      `Field "${fieldName}" must be at most ${options.maxLength} characters`,
      { field: fieldName, maxLength: options.maxLength }
    );
  }
}

export function validateNumber(value: unknown, fieldName: string, options?: { min?: number; max?: number }): void {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ValidationError(`Field "${fieldName}" must be a number`, { field: fieldName });
  }
  
  if (options?.min !== undefined && value < options.min) {
    throw new ValidationError(
      `Field "${fieldName}" must be at least ${options.min}`,
      { field: fieldName, min: options.min }
    );
  }
  
  if (options?.max !== undefined && value > options.max) {
    throw new ValidationError(
      `Field "${fieldName}" must be at most ${options.max}`,
      { field: fieldName, max: options.max }
    );
  }
}
