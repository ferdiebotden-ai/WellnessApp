import admin from 'firebase-admin';
import { getConfig } from './config';

let app: admin.app.App | null = null;

export function getFirebaseApp(): admin.app.App {
  if (app) {
    return app;
  }

  const config = getConfig();

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey
    })
  });

  return app;
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const firebaseApp = getFirebaseApp();
  return firebaseApp.auth().verifyIdToken(idToken);
}
