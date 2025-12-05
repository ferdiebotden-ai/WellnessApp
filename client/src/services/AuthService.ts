import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firebaseAuth, getFirebaseDb, isUsingMemoryPersistenceMode } from './firebase';
import type { UserProfile } from '../types/auth';

const USERS_COLLECTION = 'users';
let hasLoggedFirestoreWarning = false;

/**
 * Creates a new user account with email and password.
 * Also creates a user profile document in Firestore.
 */
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email.trim(),
      password
    );

    const user = userCredential.user;

    // Create user profile document
    const userProfile: Omit<UserProfile, 'id'> = {
      email: user.email,
      onboarding_completed: false,
      created_at: new Date().toISOString(),
    };

    // Only attempt Firestore write if available
    if (!isUsingMemoryPersistenceMode()) {
      try {
        await setDoc(doc(getFirebaseDb(), USERS_COLLECTION, user.uid), userProfile);
      } catch (firestoreError) {
        // Firestore unavailable - continue without error, profile exists in memory
        if (!hasLoggedFirestoreWarning) {
          console.warn('⚠️ Firestore unavailable during signup, profile will be memory-only');
          hasLoggedFirestoreWarning = true;
        }
      }
    }

    return user;
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(
      firebaseError.message || 'Failed to create account. Please try again.'
    );
  }
};

/**
 * Signs in an existing user with email and password.
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      firebaseAuth,
      email.trim(),
      password
    );

    return userCredential.user;
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    const code = firebaseError.code;

    if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      throw new Error('Invalid email or password');
    }
    if (code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    }
    if (code === 'auth/too-many-requests') {
      throw new Error(
        'Too many failed attempts. Please try again later or reset your password.'
      );
    }

    throw new Error(
      firebaseError.message || 'Failed to sign in. Please try again.'
    );
  }
};

/**
 * Sends a password reset email to the specified address.
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(firebaseAuth, email.trim());
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    const code = firebaseError.code;

    if (code === 'auth/user-not-found') {
      // Don't reveal that email doesn't exist for security
      return;
    }

    throw new Error(
      firebaseError.message || 'Failed to send reset email. Please try again.'
    );
  }
};

/**
 * Signs out the current user and clears session data.
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (error) {
    const firebaseError = error as { message?: string };
    throw new Error(
      firebaseError.message || 'Failed to sign out. Please try again.'
    );
  }
};

/**
 * Fetches the user profile from Firestore.
 * Returns null if Firestore is unavailable (memory-only mode) or document doesn't exist.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  // Short-circuit if Firestore is unavailable (memory-only mode)
  if (isUsingMemoryPersistenceMode()) {
    if (!hasLoggedFirestoreWarning) {
      console.log('ℹ️ Firestore unavailable (memory-only mode), skipping profile fetch');
      hasLoggedFirestoreWarning = true;
    }
    return null; // Profile will be created in memory by AuthProvider
  }

  try {
    const userDoc = await getDoc(doc(getFirebaseDb(), USERS_COLLECTION, userId));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      id: userId,
      email: data.email ?? null,
      onboarding_completed: data.onboarding_completed ?? false,
      created_at: data.created_at ?? new Date().toISOString(),
    };
  } catch (error) {
    // Firestore error - return null so AuthProvider can create fallback profile
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!hasLoggedFirestoreWarning) {
      console.warn(`⚠️ Firestore unavailable, using memory-only profile: ${errorMessage}`);
      hasLoggedFirestoreWarning = true;
    }
    return null;
  }
};

/**
 * Updates the onboarding completion status for a user.
 * Silently succeeds if Firestore is unavailable (memory-only mode).
 */
export const updateOnboardingStatus = async (
  userId: string,
  completed: boolean
): Promise<void> => {
  // Short-circuit if Firestore is unavailable (memory-only mode)
  if (isUsingMemoryPersistenceMode()) {
    // Status is tracked in memory by AuthProvider, no need to persist
    return;
  }

  try {
    await setDoc(
      doc(getFirebaseDb(), USERS_COLLECTION, userId),
      {
        onboarding_completed: completed,
      },
      { merge: true }
    );
  } catch (error) {
    // Firestore unavailable - silently succeed in dev mode
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!hasLoggedFirestoreWarning) {
      console.warn(`⚠️ Firestore unavailable, onboarding status update skipped: ${errorMessage}`);
      hasLoggedFirestoreWarning = true;
    }
    // Don't throw - allow app to continue functioning
  }
};

