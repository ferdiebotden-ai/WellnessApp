import { Request } from 'express';
export declare function extractBearerToken(req: Request): string | null;
export declare function isPatchPayloadAllowed(value: unknown): value is Record<string, unknown>;
