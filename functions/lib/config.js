"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.getConfigAsync = getConfigAsync;
exports.getPrivacyConfig = getPrivacyConfig;
exports.normalizePrivateKey = normalizePrivateKey;
const node_assert_1 = __importDefault(require("node:assert"));
const requiredEnv = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'PINECONE_API_KEY',
    'REVENUECAT_WEBHOOK_SECRET'
];
function readEnv(name) {
    const value = process.env[name];
    (0, node_assert_1.default)(value, `${name} must be set`);
    return value;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function readEnvWithRetry(name, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const value = process.env[name];
        if (value) {
            return value;
        }
        if (attempt < maxRetries) {
            console.warn(`[Config] ${name} not available, retry ${attempt}/${maxRetries}...`);
            await sleep(100 * attempt);
        }
    }
    throw new Error(`${name} must be set (not found after ${maxRetries} retries)`);
}
function normalizePrivateKey(key) {
    return key.replace(/\\n/g, '\n');
}
let cachedConfig = null;
let cachedPrivacyConfig = null;
function getConfig() {
    if (!cachedConfig) {
        cachedConfig = {
            firebaseProjectId: readEnv('FIREBASE_PROJECT_ID'),
            firebaseClientEmail: readEnv('FIREBASE_CLIENT_EMAIL'),
            firebasePrivateKey: normalizePrivateKey(readEnv('FIREBASE_PRIVATE_KEY')),
            supabaseUrl: readEnv('SUPABASE_URL'),
            supabaseAnonKey: readEnv('SUPABASE_ANON_KEY'),
            supabaseServiceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
            supabaseJwtSecret: readEnv('SUPABASE_JWT_SECRET'),
            defaultTrialDays: Number.parseInt(process.env.DEFAULT_TRIAL_DAYS ?? '14', 10),
            pineconeApiKey: readEnv('PINECONE_API_KEY'),
            pineconeIndexName: process.env.PINECONE_INDEX_NAME ?? 'wellness-protocols',
            privacyExportUrlTtlHours: Number.parseInt(process.env.PRIVACY_EXPORT_URL_TTL_HOURS ?? '72', 10),
            revenuecatWebhookSecret: readEnv('REVENUECAT_WEBHOOK_SECRET'),
        };
    }
    return cachedConfig;
}
/**
 * Async version of getConfig with retry logic for Cloud Run cold start scenarios.
 * Call this on server startup to pre-warm the config cache.
 */
async function getConfigAsync() {
    if (cachedConfig) {
        return cachedConfig;
    }
    cachedConfig = {
        firebaseProjectId: await readEnvWithRetry('FIREBASE_PROJECT_ID'),
        firebaseClientEmail: await readEnvWithRetry('FIREBASE_CLIENT_EMAIL'),
        firebasePrivateKey: normalizePrivateKey(await readEnvWithRetry('FIREBASE_PRIVATE_KEY')),
        supabaseUrl: await readEnvWithRetry('SUPABASE_URL'),
        supabaseAnonKey: await readEnvWithRetry('SUPABASE_ANON_KEY'),
        supabaseServiceRoleKey: await readEnvWithRetry('SUPABASE_SERVICE_ROLE_KEY'),
        supabaseJwtSecret: await readEnvWithRetry('SUPABASE_JWT_SECRET'),
        defaultTrialDays: Number.parseInt(process.env.DEFAULT_TRIAL_DAYS ?? '14', 10),
        pineconeApiKey: await readEnvWithRetry('PINECONE_API_KEY'),
        pineconeIndexName: process.env.PINECONE_INDEX_NAME ?? 'wellness-protocols',
        privacyExportUrlTtlHours: Number.parseInt(process.env.PRIVACY_EXPORT_URL_TTL_HOURS ?? '72', 10),
        revenuecatWebhookSecret: await readEnvWithRetry('REVENUECAT_WEBHOOK_SECRET'),
    };
    console.log('[Config] Configuration loaded successfully');
    return cachedConfig;
}
const privacyEnv = [
    'PRIVACY_EXPORT_TOPIC',
    'PRIVACY_DELETION_TOPIC',
    'PRIVACY_EXPORT_BUCKET',
];
function readPrivacyEnv(name) {
    const value = process.env[name];
    (0, node_assert_1.default)(value, `${name} must be set to enable privacy workflows`);
    return value;
}
function getPrivacyConfig() {
    if (!cachedPrivacyConfig) {
        cachedPrivacyConfig = {
            exportTopic: readPrivacyEnv('PRIVACY_EXPORT_TOPIC'),
            deletionTopic: readPrivacyEnv('PRIVACY_DELETION_TOPIC'),
            exportBucket: readPrivacyEnv('PRIVACY_EXPORT_BUCKET'),
        };
    }
    return cachedPrivacyConfig;
}
