export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export type OnboardingStatus = 'pending' | 'completed';

export interface UserProfile {
  id: string;
  email: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface AuthContextValue {
  state: AuthState;
  user: UserProfile | null;
  onboardingStatus: OnboardingStatus;
  setOnboardingStatusLocal: (status: OnboardingStatus) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

export interface AuthError {
  code: string;
  message: string;
}

