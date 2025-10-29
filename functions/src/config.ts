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
}

const requiredEnv = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET'
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
      defaultTrialDays: Number.parseInt(process.env.DEFAULT_TRIAL_DAYS ?? '14', 10)
    };
  }
  return cachedConfig;
}

export { normalizePrivateKey };
