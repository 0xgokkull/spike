export type ErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT_STATE'
  | 'ACTION_NOT_AVAILABLE'
  | 'PAYPAL_ERROR'
  | 'LLM_ERROR'
  | 'DAY_CLOSE_BLOCKED'
  | 'FORBIDDEN_DEMO';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

