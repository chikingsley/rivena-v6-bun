import { createAuthClient } from "better-auth/react"

// Define error codes based on Better Auth documentation
const ERROR_CODES = {
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FAILED_TO_GET_SESSION: 'FAILED_TO_GET_SESSION',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// Define response types for better type safety
type AuthResult<T = any> = {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    status?: number;
  } | null;
};

// Create the auth client instance
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  debug: true, // Enable debug mode for more detailed logs
  cookieName: "better_auth_session" // Make sure this matches the cookie name in Better Auth
});

// Map of user-friendly error messages by error code
const errorMessages = {
  [ERROR_CODES.USER_ALREADY_EXISTS]: 'This email is already registered. Please sign in instead.',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
  [ERROR_CODES.FAILED_TO_GET_SESSION]: 'You are not signed in.',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found. Please check your email or sign up.',
  [ERROR_CODES.INVALID_PASSWORD]: 'Invalid password. Please try again.',
  [ERROR_CODES.INVALID_EMAIL]: 'Invalid email format. Please enter a valid email.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error occurred. Please try again later.'
};

// Get a user-friendly error message for a given error code
const getErrorMessage = (code: string | undefined, defaultMessage: string): string => {
  if (!code) return defaultMessage;
  return errorMessages[code as keyof typeof errorMessages] || defaultMessage;
};

// Helper function to handle auth operations and standardize responses
const handleAuthOperation = async <T>(operation: () => Promise<any>, operationName: string): Promise<AuthResult<T>> => {
  try {
    // Call the Better Auth operation
    const result = await operation();
    
    // If the operation returned an error, format it consistently
    if (result.error) {
      const errorCode = result.error.code || ERROR_CODES.UNKNOWN_ERROR;
      const errorMessage = getErrorMessage(errorCode, result.error.message || `${operationName} failed`);
      
      return {
        success: false,
        data: null,
        error: {
          code: errorCode,
          message: errorMessage,
          status: result.error.status
        }
      };
    }
    
    // Operation succeeded
    return {
      success: true,
      data: result.data,
      error: null
    };
  } catch (error: any) {
    console.error(`${operationName} error:`, error);
    
    // Extract error details
    const errorCode = error?.code || error?.response?.data?.code || ERROR_CODES.UNKNOWN_ERROR;
    const defaultMessage = `${operationName} failed. Please try again.`;
    
    // Special case for sign out when already signed out
    if (errorCode === ERROR_CODES.FAILED_TO_GET_SESSION && operationName === 'Sign out') {
      return {
        success: true,
        data: { alreadySignedOut: true } as unknown as T,
        error: null
      };
    }
    
    // Return a standardized error response
    return {
      success: false,
      data: null,
      error: {
        code: errorCode,
        message: getErrorMessage(errorCode, error?.message || 'An error occurred'),
        status: error?.response?.status
      }
    };
  }
};

// Sign in with email and password
export const signIn = async () => {
  console.log('Starting sign in with auth client...');
  console.log('Current cookies:', typeof document !== 'undefined' ? document.cookie : 'Not in browser context');
  
  const result = await handleAuthOperation(
    () => authClient.signIn.email({
      email: "test@example.com",
      password: "test1234",
      fetchOptions: {
        onError: (ctx) => {
          console.log('Sign in error context:', ctx);
        },
        onSuccess: (ctx) => {
          console.log('Sign in success context:', ctx);
          console.log('Response headers:', ctx.response.headers);
          console.log('Cookies after sign in:', typeof document !== 'undefined' ? document.cookie : 'Not in browser context');
        }
      }
    }),
    'Sign in'
  );
  
  console.log('Sign in completed, result:', {
    success: result.success,
    hasData: !!result.data,
    dataKeys: result.data ? Object.keys(result.data) : [],
    // Use type assertion to avoid TypeScript error
    hasUser: !!result.data && 'user' in (result.data as any) ? !!(result.data as any).user : false,
    hasError: !!result.error
  });
  
  return result;
};

// Sign up with email, password and name
export const signUp = async () => {
  return handleAuthOperation(
    () => authClient.signUp.email({
      email: "test@example.com",
      password: "test1234",
      name: "Test User",
      fetchOptions: {
        onError: (ctx) => {
          console.log('Sign up error context:', ctx);
        }
      }
    }),
    'Sign up'
  );
};

// Sign out the current user
export const signOut = async () => {
  try {
    // First check if there's an active session
    console.log('Checking session before sign out...');
    console.log('Current cookies:', typeof document !== 'undefined' ? document.cookie : 'Not in browser context');
    
    const sessionResult = await authClient.getSession();
    console.log('Session check before sign out:', {
      hasData: !!sessionResult.data,
      dataKeys: sessionResult.data ? Object.keys(sessionResult.data) : [],
      fullData: JSON.stringify(sessionResult.data, null, 2),
      // Use type assertion to avoid TypeScript error
      hasUser: !!sessionResult.data && 'user' in (sessionResult.data as any) ? !!(sessionResult.data as any).user : false,
      hasSession: !!sessionResult.data && 'session' in (sessionResult.data as any) ? !!(sessionResult.data as any).session : false,
      hasError: !!sessionResult.error,
      errorDetails: sessionResult.error ? sessionResult.error : null
    });
    
    // If no active session data at all, return success with alreadySignedOut flag
    if (!sessionResult.data) {
      console.log('No session data available, already signed out');
      return {
        success: true,
        data: { alreadySignedOut: true },
        error: null
      };
    }
    
    // Try to sign out anyway, but catch any errors
    try {
      const { data, error } = await authClient.signOut();
      
      // If successful, return success
      if (!error) {
        return {
          success: true,
          data,
          error: null
        };
      }
      
      // If the error is that the user is not signed in, still return success
      if (error.code === ERROR_CODES.FAILED_TO_GET_SESSION || error.status === 400) {
        console.log('Sign out failed with 400 or session error, treating as already signed out');
        return {
          success: true,
          data: { alreadySignedOut: true },
          error: null
        };
      }
      
      // Otherwise, return the error
      return {
        success: false,
        data: null,
        error: {
          code: error.code,
          message: getErrorMessage(error.code, error.message || 'An error occurred'),
          status: error.status
        }
      };
    } catch (signOutError) {
      console.log('Error during sign out API call:', signOutError);
      // Treat as successful from the UI perspective
      return {
        success: true,
        data: { alreadySignedOut: true },
        error: null
      };
    }
  } catch (error: any) {
    // For network errors or other exceptions
    console.log('Sign out exception:', error);
    
    // Always treat sign out as successful from the UI perspective
    // The user should be able to sign out even if there's a server error
    return {
      success: true,
      data: { alreadySignedOut: true },
      error: null
    };
  }
};

// Export the useSession hook from the auth client
export const { useSession } = authClient;
