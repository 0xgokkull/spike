import { describe, it, expect } from 'vitest';
import { AppError } from '@/lib/errors';

describe('AppError', () => {
  it('creates error with code and details', () => {
    const err = new AppError('NOT_FOUND', 'Case not found', { id: '123' });
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Case not found');
    expect(err.details).toEqual({ id: '123' });
    expect(err.toJSON()).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Case not found',
        details: { id: '123' },
      },
    });
  });
});

