import { Request } from 'express';

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || Array.isArray(authHeader)) {
    return null;
  }
  const match = authHeader.match(/^Bearer\s+(.*)$/i);
  return match ? match[1] : null;
}

export function isPatchPayloadAllowed(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
