import { describe, expect, it } from 'vitest';
import { AppError, getErrorMessage } from '../services/appErrors';

describe('application error contract', () => {
  it('preserves typed code and cause', () => {
    const cause = new Error('root cause');
    const error = new AppError('Storage failed', 'STORAGE_READ_FAILED', cause);

    expect(error).toMatchObject({ name: 'AppError', code: 'STORAGE_READ_FAILED', cause });
    expect(error.message).toBe('Storage failed');
  });

  it('normalizes unknown errors to a user-safe fallback', () => {
    expect(getErrorMessage(new Error('known'), 'fallback')).toBe('known');
    expect(getErrorMessage({ message: 'not an Error' }, 'fallback')).toBe('fallback');
  });
});
