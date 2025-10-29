import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { getConfig } from './config';

let serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const config = getConfig();
    serviceClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false
      }
    });
  }
  return serviceClient;
}

function signSupabaseAccessToken(uid: string): string {
  const config = getConfig();
  const payload = {
    sub: uid,
    role: 'authenticated',
    aud: 'authenticated'
  };

  return jwt.sign(payload, config.supabaseJwtSecret, {
    issuer: 'supabase/auth/v1',
    expiresIn: '1h'
  });
}

export function getUserClient(uid: string): SupabaseClient {
  const config = getConfig();
  const supabaseJwt = signSupabaseAccessToken(uid);
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${supabaseJwt}`
      }
    }
  });
}

export { getServiceClient, signSupabaseAccessToken };
