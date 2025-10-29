import * as admin from 'firebase-admin';

let initialized = false;

export const getFirebaseAdmin = (): admin.app.App => {
  if (!initialized) {
    admin.initializeApp();
    initialized = true;
  }

  return admin.app();
};

export const verifyFirebaseIdToken = async (token: string) => {
  const app = getFirebaseAdmin();
  return app.auth().verifyIdToken(token);
};

export const getFirestore = (): admin.firestore.Firestore => {
  return getFirebaseAdmin().firestore();
};
