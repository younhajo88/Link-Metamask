import { describe, expect, it } from 'vitest';
import { createActionLog, formatLogDetails, pushActionLog, toErrorDetails } from './logger';

describe('diagnostics logger', () => {
  it('adds newest entries first and keeps the configured limit', () => {
    const first = createActionLog('connect', 'success', { connector: 'walletConnect' });
    const second = createActionLog('sign', 'error', { message: 'Rejected' });

    const log = pushActionLog(pushActionLog([], first, 1), second, 1);

    expect(log).toHaveLength(1);
    expect(log[0].action).toBe('sign');
    expect(log[0].status).toBe('error');
  });

  it('normalizes thrown errors for display', () => {
    const details = toErrorDetails(new Error('User rejected the request'));

    expect(details).toMatchObject({
      name: 'Error',
      message: 'User rejected the request',
    });
  });

  it('formats bigint values without crashing JSON rendering', () => {
    expect(formatLogDetails({ value: 10n })).toContain('"10"');
  });
});
