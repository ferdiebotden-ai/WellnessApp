import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  signUpWithEmail,
  signInWithEmail,
  sendPasswordReset,
  signOut,
  getUserProfile,
  updateOnboardingStatus,
} from './AuthService';
import { firebaseAuth, firebaseDb } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('./firebase');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUpWithEmail', () => {
    it('should create a new user account and user profile document', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      const mockUserCredential = { user: mockUser };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await signUpWithEmail('test@example.com', 'password123');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        firebaseAuth,
        'test@example.com',
        'password123'
      );
      expect(setDoc).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw error for invalid email', async () => {
      const error = { code: 'auth/invalid-email', message: 'Invalid email' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(signUpWithEmail('invalid-email', 'password123')).rejects.toThrow();
    });
  });

  describe('signInWithEmail', () => {
    it('should sign in with valid credentials', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      const mockUserCredential = { user: mockUser };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        firebaseAuth,
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw user-friendly error for invalid credentials', async () => {
      const error = { code: 'auth/wrong-password', message: 'Wrong password' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(signInWithEmail('test@example.com', 'wrong')).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await sendPasswordReset('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        firebaseAuth,
        'test@example.com'
      );
    });

    it('should silently handle user-not-found error', async () => {
      const error = { code: 'auth/user-not-found', message: 'User not found' };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(error);

      await expect(sendPasswordReset('nonexistent@example.com')).resolves.not.toThrow();
    });
  });

  describe('signOut', () => {
    it('should sign out the current user', async () => {
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

      await signOut();

      expect(firebaseSignOut).toHaveBeenCalledWith(firebaseAuth);
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile from Firestore', async () => {
      const mockDocData = {
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          onboarding_completed: false,
          created_at: '2024-01-01T00:00:00Z',
        }),
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocData);

      const result = await getUserProfile('user123');

      expect(getDoc).toHaveBeenCalledWith(doc(firebaseDb, 'users', 'user123'));
      expect(result).toEqual({
        id: 'user123',
        email: 'test@example.com',
        onboarding_completed: false,
        created_at: '2024-01-01T00:00:00Z',
      });
    });

    it('should return null if user document does not exist', async () => {
      const mockDocData = {
        exists: () => false,
        data: () => null,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocData);

      const result = await getUserProfile('user123');

      expect(result).toBeNull();
    });
  });

  describe('updateOnboardingStatus', () => {
    it('should update onboarding status in Firestore', async () => {
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await updateOnboardingStatus('user123', true);

      expect(setDoc).toHaveBeenCalledWith(
        doc(firebaseDb, 'users', 'user123'),
        { onboarding_completed: true },
        { merge: true }
      );
    });
  });
});

