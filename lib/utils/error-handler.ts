export class HealthcareError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'HealthcareError';
  }
}

export class ValidationError extends HealthcareError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends HealthcareError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends HealthcareError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends HealthcareError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export function handleError(error: unknown): HealthcareError {
  if (error instanceof HealthcareError) {
    return error;
  }

  if (error instanceof Error) {
    return new HealthcareError(error.message, 'UNKNOWN_ERROR');
  }

  return new HealthcareError('An unexpected error occurred', 'UNKNOWN_ERROR');
}

export function logError(error: HealthcareError, context?: Record<string, any>) {
  // In production, send to monitoring service
  console.error('Healthcare Error:', {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    context: error.context,
    additionalContext: context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
  });
} 