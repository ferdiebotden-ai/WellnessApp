import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const firebaseApp = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const firebaseAuth = getAuth(firebaseApp);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl || !supabaseAnonKey || !supabaseJwtSecret) {
  throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_JWT_SECRET must be configured.');
}

const TARGET_TABLE = 'users';

async function verifyFirebaseIdToken(authHeader?: string | string[]) {
  if (!authHeader) {
    throw new Error('Missing Authorization header.');
  }

  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const cleanedToken = token.replace('Bearer ', '').trim();

  if (!cleanedToken) {
    throw new Error('Authorization header is malformed.');
  }

  return firebaseAuth.verifyIdToken(cleanedToken, true);
}

function mintSupabaseToken(payload: { uid: string; email?: string | undefined }) {
  const claims = {
    aud: 'authenticated',
    role: 'authenticated',
    iss: 'firebase-auth',
    sub: payload.uid,
    email: payload.email,
  };

  return jwt.sign(claims, supabaseJwtSecret, { expiresIn: '1h' });
}

async function fetchSupabaseUserRow(accessToken: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${TARGET_TABLE}?select=*`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase query failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export const testAuthHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const decodedToken = await verifyFirebaseIdToken(req.headers.authorization);
    const supabaseToken = mintSupabaseToken({ uid: decodedToken.uid, email: decodedToken.email });
    const userRows = await fetchSupabaseUserRow(supabaseToken);

    res.status(200).json({
      message: 'Firebase JWT validated. Supabase query succeeded under RLS.',
      firebaseUid: decodedToken.uid,
      supabaseRows: userRows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(401).json({ error: message });
  }
};
