import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { extractBearerToken, isPatchPayloadAllowed } from '../src/utils/http';

describe('extractBearerToken', () => {
  it('returns token when header present', () => {
    const req = { headers: { authorization: 'Bearer token-123' } } as unknown as Request;
    expect(extractBearerToken(req)).toBe('token-123');
  });

  it('returns null when header missing', () => {
    const req = { headers: {} } as unknown as Request;
    expect(extractBearerToken(req)).toBeNull();
  });
});

describe('isPatchPayloadAllowed', () => {
  it('accepts plain objects', () => {
    expect(isPatchPayloadAllowed({})).toBe(true);
  });

  it('rejects arrays', () => {
    expect(isPatchPayloadAllowed([])).toBe(false);
  });
});
