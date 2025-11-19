import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { firebaseAuth } from './services/firebase';
import { revenueCat } from './services/RevenueCatService';
import analytics from './services/AnalyticsService';
import { AuthProvider } from './providers/AuthProvider';
import { RootNavigator } from './navigation/RootNavigator';

/**
 * Root application component.
 * Wraps the app with AuthProvider and renders the appropriate navigation stack.
 */
export const App: React.FC = () => {
  useEffect(() => {
    console.log('🔧 Wellness OS - Development Mode');
    console.log('Platform:', Platform.OS);
    console.log('Backend API:', process.env.EXPO_PUBLIC_API_BASE_URL || 'Not configured (using fallbacks)');
    console.log('Firebase Project:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'Not configured');

    // Add global error handler for web
    if (Platform.OS === 'web') {
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
      });
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
      });
    }

    let unsubscribe: (() => void) | undefined;

    try {
      // Initialize analytics
      analytics
        .init()
        .then(() => {
          console.log('✅ Analytics initialized');
          const currentUser = firebaseAuth.currentUser;
          if (currentUser) {
            void analytics.identifyUser(currentUser.uid, {
              email: currentUser.email ?? null,
            });
          }
        })
        .catch((error) => {
          console.warn('Failed to initialize analytics service', error);
        });

      // Initialize RevenueCat
      const currentUser = firebaseAuth.currentUser;
      void revenueCat.configure(currentUser?.uid ?? null).catch((error) => {
        console.warn('Failed to configure RevenueCat SDK', error);
      });

      // Sync RevenueCat and analytics on auth state changes
      if (typeof firebaseAuth.onAuthStateChanged === 'function') {
        unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
          console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
          void revenueCat.configure(user?.uid ?? null).catch((error) => {
            console.warn('Failed to synchronize RevenueCat user state', error);
          });

          if (user) {
            void analytics.identifyUser(user.uid, { email: user.email ?? null });
          }
        });
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }

    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
};

export default App;
