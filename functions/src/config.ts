import assert from 'node:assert';

export interface ServiceConfig {
  firebaseProjectId: string;
  firebaseClientEmail: string;
  firebasePrivateKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  supabaseJwtSecret: string;
  defaultTrialDays: number;
  openAiApiKey: string;
  pineconeApiKey: string;
  pineconeIndexName: string;
  privacyExportUrlTtlHours: number;
}

export interface PrivacyConfig {
  exportTopic: string;
  deletionTopic: string;
  exportBucket: string;
}

const requiredEnv = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'OPENAI_API_KEY',
  'PINECONE_API_KEY'
] as const;

type RequiredEnv = (typeof requiredEnv)[number];

function readEnv(name: RequiredEnv): string {
  const value = process.env[name];
  assert(value, `${name} must be set`);
  return value;
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

let cachedConfig: ServiceConfig | null = null;
let cachedPrivacyConfig: PrivacyConfig | null = null;

export function getConfig(): ServiceConfig {
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
      openAiApiKey: readEnv('OPENAI_API_KEY'),
      pineconeApiKey: readEnv('PINECONE_API_KEY'),
      pineconeIndexName: process.env.PINECONE_INDEX_NAME ?? 'wellness-protocols',
      privacyExportUrlTtlHours: Number.parseInt(process.env.PRIVACY_EXPORT_URL_TTL_HOURS ?? '72', 10),
    };
  }
  return cachedConfig;
}

const privacyEnv = [
  'PRIVACY_EXPORT_TOPIC',
  'PRIVACY_DELETION_TOPIC',
  'PRIVACY_EXPORT_BUCKET',
] as const;

type PrivacyEnv = (typeof privacyEnv)[number];

function readPrivacyEnv(name: PrivacyEnv): string {
  const value = process.env[name];
  assert(value, `${name} must be set to enable privacy workflows`);
  return value;
}

export function getPrivacyConfig(): PrivacyConfig {
  if (!cachedPrivacyConfig) {
    cachedPrivacyConfig = {
      exportTopic: readPrivacyEnv('PRIVACY_EXPORT_TOPIC'),
      deletionTopic: readPrivacyEnv('PRIVACY_DELETION_TOPIC'),
      exportBucket: readPrivacyEnv('PRIVACY_EXPORT_BUCKET'),
    };
  }
  return cachedPrivacyConfig;
}

export { normalizePrivateKey };
