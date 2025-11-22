"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractBearerToken = extractBearerToken;
exports.isPatchPayloadAllowed = isPatchPayloadAllowed;
function extractBearerToken(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || Array.isArray(authHeader)) {
        return null;
    }
    const match = authHeader.match(/^Bearer\s+(.*)$/i);
    return match ? match[1] : null;
}
function isPatchPayloadAllowed(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
