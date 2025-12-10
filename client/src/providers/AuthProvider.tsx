import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseAuth, getFirebaseDb, isUsingMemoryPersistenceMode } from '../services/firebase';
import {
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  signOut,
  getUserProfile,
  updateOnboardingStatus,
} from '../services/AuthService';
import { syncUser } from '../services/api';
import { setupPushNotifications, deactivatePushToken } from '../services/pushNotifications';
import type {
  AuthContextValue,
  AuthState,
  OnboardingStatus,
  UserProfile,
} from '../types/auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provides authentication state and methods throughout the app.
 * Manages Firebase auth state, user profile, and onboarding status.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus>('pending');

  const setOnboardingStatusLocal = useCallback(
    (status: OnboardingStatus) => {
      console.log(`🔄 Setting onboarding status locally to: ${status}`);
      setOnboardingStatus(status);
      setUser((previous) => {
        if (previous) {
          const updated = {
            ...previous,
            onboarding_completed: status === 'completed',
          };
          console.log('👤 Updated user profile:', updated);
          return updated;
        }
        return previous;
      });
    },
    []
  );

  const refreshUserProfile = useCallback(async (firebaseUser: User) => {
    // Always create a profile in memory first for immediate UI rendering
    const createMemoryProfile = (): UserProfile => ({
      id: firebaseUser.uid,
      email: firebaseUser.email,
      onboarding_completed: false,
      created_at: new Date().toISOString(),
    });

    try {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        setUser(profile);
        setOnboardingStatus(
          profile.onboarding_completed ? 'completed' : 'pending'
        );
        return; // Success - exit early
      }
    } catch (error) {
      // getUserProfile failed - will create fallback below
    }

    // Profile doesn't exist or Firestore unavailable - create memory profile
    const newProfile = createMemoryProfile();
    
    // Try to persist to Firestore if available (non-blocking)
    if (!isUsingMemoryPersistenceMode()) {
      try {
        await setDoc(doc(getFirebaseDb(), 'users', firebaseUser.uid), {
          email: newProfile.email,
          onboarding_completed: newProfile.onboarding_completed,
          created_at: newProfile.created_at,
        });
      } catch (createError) {
        // Firestore write failed - continue with memory-only profile
        // Error already logged by AuthService
      }
    }
    
    // Always set profile in memory so UI can render
    setUser(newProfile);
    setOnboardingStatus('pending');
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Ensure user has a Supabase record (bridges Firebase Auth with Supabase DB)
          // This handles both fresh logins and session restores
          try {
            const syncResult = await syncUser();
            console.log(`✅ User synced to Supabase: ${syncResult.created ? 'created' : 'existing'}`);
          } catch (syncError) {
            // Non-critical - backend endpoints may still work if user exists
            console.warn('⚠️ Failed to sync user to Supabase on session restore:', syncError);
          }

          // Register for push notifications after successful auth sync
          try {
            const pushResult = await setupPushNotifications();
            console.log(`✅ Push: ${pushResult ? 'registered' : 'skipped (web/simulator)'}`);
          } catch (pushError) {
            // Non-critical - app works without push notifications
            console.warn('⚠️ Push setup failed:', pushError);
          }

          await refreshUserProfile(firebaseUser);
          setState('authenticated');
        } catch (profileError) {
          console.error('Critical: refreshUserProfile failed:', profileError);
          // Still set authenticated state with fallback profile
          setState('authenticated');
        }
      } else {
        setUser(null);
        setOnboardingStatus('pending');
        setState('unauthenticated');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshUserProfile]);

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      await signInWithEmail(email, password);
      // Auth state change will be handled by onAuthStateChanged listener
    },
    []
  );

  const handleSignUp = useCallback(
    async (email: string, password: string) => {
      await signUpWithEmail(email, password);
      // Auth state change will be handled by onAuthStateChanged listener
    },
    []
  );

  const handleSignOut = useCallback(async () => {
    // Deactivate push token before signing out
    try {
      await deactivatePushToken();
    } catch (error) {
      console.warn('⚠️ Push token deactivation failed:', error);
    }

    await signOut();
    setUser(null);
    setOnboardingStatus('pending');
    setState('unauthenticated');
  }, []);

  const handlePasswordReset = useCallback(
    async (email: string) => {
      await sendPasswordReset(email);
    },
    []
  );

  const handleRefreshUserProfile = useCallback(async () => {
    const firebaseUser = firebaseAuth.currentUser;
    if (firebaseUser) {
      await refreshUserProfile(firebaseUser);
    }
  }, [refreshUserProfile]);

  const value: AuthContextValue = {
    state,
    user,
    onboardingStatus,
    setOnboardingStatusLocal,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    sendPasswordReset: handlePasswordReset,
    refreshUserProfile: handleRefreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access authentication context.
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Updates onboarding status for the current user.
 */
export const useUpdateOnboarding = () => {
  const { user, setOnboardingStatusLocal } = useAuth();

  return useCallback(
    async (completed: boolean) => {
      if (!user) {
        throw new Error('No user is authenticated');
      }

      console.log(`🎯 useUpdateOnboarding called with completed=${completed}, memory mode=${isUsingMemoryPersistenceMode()}`);
      
      // Always update local state first for immediate UI feedback
      setOnboardingStatusLocal(completed ? 'completed' : 'pending');
      
      // Try to persist to Firestore if available (fire-and-forget)
      // Don't call refreshUserProfile() - local state is already correct
      // and refreshing would overwrite it if Firestore fails
      if (!isUsingMemoryPersistenceMode()) {
        try {
          await updateOnboardingStatus(user.id, completed);
        } catch (error) {
          console.warn('⚠️ Failed to persist onboarding status to Firestore:', error);
          // Local state already updated, so continue
        }
      }
      
      console.log('✅ Onboarding status update complete');
    },
    [user, setOnboardingStatusLocal]
  );
};

