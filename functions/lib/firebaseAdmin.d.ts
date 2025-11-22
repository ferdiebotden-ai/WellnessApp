import admin from 'firebase-admin';
export declare function getFirebaseApp(): admin.app.App;
export declare function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken>;
