import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authClient } from '../lib/auth-client';

// Define types for our store
type User = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified: boolean;
};

type AuthState = {
  user: User | null;
  isLoadingSignIn: boolean;
  isLoadingSignUp: boolean;
  isLoadingSignOut: boolean;
  isLoadingSession: boolean;
  isAuthenticated: boolean;
  error: {
    code: string;
    message: string;
  } | null;
  // Actions
  signIn: () => Promise<void>;
  signUp: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
};

// Create the store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoadingSignIn: false,
      isLoadingSignUp: false,
      isLoadingSignOut: false,
      isLoadingSession: false,
      isAuthenticated: false,
      error: null,

      // Check for existing session
      checkSession: async () => {
        try {
          console.log('Checking session...');
          set({ isLoadingSession: true });
          const session = await authClient.getSession();
          
          // Detailed logging of the session structure
          console.log('Session result:', session);
          console.log('Session data structure:', {
            hasData: !!session.data,
            dataKeys: session.data ? Object.keys(session.data) : [],
            fullData: JSON.stringify(session.data, null, 2),
            hasUser: !!session.data?.user,
            hasSession: !!session.data?.session,
            hasError: !!session.error,
            errorDetails: session.error ? session.error : null
          });
          
          if (session.data?.user) {
            console.log('User found in session:', session.data.user);
            set({ 
              user: session.data.user, 
              isAuthenticated: true,
              error: null
            });
          } else {
            console.log('No user in session');
          }
        } catch (error) {
          // No session found, that's okay
          console.error('Error checking session:', error);
        } finally {
          set({ isLoadingSession: false });
        }
      },

      // Sign in
      signIn: async () => {
        try {
          console.log('Starting sign in...');
          set({ isLoadingSignIn: true, error: null });
          
          const result = await authClient.signIn.email({
            email: "test@example.com",
            password: "test1234"
          });
          
          console.log('Sign in result:', result);
          
          if (result.error) {
            console.log('Sign in error:', result.error);
            set({ 
              error: { 
                code: result.error.code || 'UNKNOWN_ERROR',
                message: result.error.message || 'Failed to sign in'
              }
            });
          } else if (result.data?.user) {
            console.log('Sign in successful, user:', result.data.user);
            set({ 
              user: result.data.user,
              isAuthenticated: true,
              error: null
            });
            
            // Check session after successful sign-in to get the latest session data
            console.log('Checking session after sign-in...');
            setTimeout(() => {
              // We use setTimeout to ensure the state is updated before checking session
              get().checkSession();
            }, 500);
          }
        } catch (error: any) {
          console.error('Sign in exception:', error);
          set({ 
            error: { 
              code: error?.code || 'UNKNOWN_ERROR',
              message: error?.message || 'Failed to sign in'
            }
          });
        } finally {
          set({ isLoadingSignIn: false });
        }
      },

      // Sign up
      signUp: async () => {
        try {
          console.log('Starting sign up...');
          set({ isLoadingSignUp: true, error: null });
          
          const result = await authClient.signUp.email({
            email: "test@example.com",
            password: "test1234",
            name: "Test User"
          });
          
          console.log('Sign up result:', result);
          
          if (result.error) {
            console.log('Sign up error:', result.error);
            let errorMessage = result.error.message || 'An error occurred';
            
            // Provide more user-friendly error messages
            if (result.error.code === 'USER_ALREADY_EXISTS') {
              errorMessage = 'This email is already registered. Please sign in instead.';
            }
            
            set({ 
              error: { 
                code: result.error.code || 'UNKNOWN_ERROR',
                message: errorMessage
              }
            });
          } else if (result.data?.user) {
            console.log('Sign up successful, user:', result.data.user);
            set({ 
              user: result.data.user,
              isAuthenticated: true,
              error: null
            });
            
            // Check session after successful sign-up to get the latest session data
            console.log('Checking session after sign-up...');
            setTimeout(() => {
              // We use setTimeout to ensure the state is updated before checking session
              get().checkSession();
            }, 500);
          }
        } catch (error: any) {
          console.error('Sign up exception:', error);
          set({ 
            error: { 
              code: error?.code || 'UNKNOWN_ERROR',
              message: error?.message || 'Failed to sign up'
            }
          });
        } finally {
          set({ isLoadingSignUp: false });
        }
      },

      // Sign out
      signOut: async () => {
        try {
          console.log('Starting sign out...');
          const currentState = get();
          console.log('Current auth state:', { 
            isAuthenticated: currentState.isAuthenticated, 
            hasUser: !!currentState.user 
          });
          
          // Always clear the user state first, regardless of API result
          set({ 
            isLoadingSignOut: true, 
            error: null,
            user: null,
            isAuthenticated: false
          });
          
          // If we're already signed out in state, don't make the API call
          if (!currentState.isAuthenticated && !currentState.user) {
            console.log('Already signed out in state, skipping API call');
            set({ isLoadingSignOut: false });
            return;
          }
          
          // Call the improved signOut function from auth-client
          // It will handle all the error cases gracefully
          try {
            console.log('Calling sign out API...');
            const result = await authClient.signOut();
            console.log('Sign out API result:', result);
            
            // We don't need to handle errors here since the auth-client
            // already treats all sign-out errors as successful from the UI perspective
          } catch (apiError) {
            // Just log the error, user is already signed out in UI
            console.error('Sign out API exception:', apiError);
          }
        } catch (error: any) {
          // This should rarely happen - outer try/catch
          console.error('Unexpected error during sign out process:', error);
        } finally {
          set({ isLoadingSignOut: false });
        }
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage', // name of the item in localStorage
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

// Initialize session check
if (typeof window !== 'undefined') {
  // Only run in browser environment
  useAuthStore.getState().checkSession();
}
