'use client';

// Define error types
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  NETWORK = 'network',
  DATABASE = 'database',
  UNKNOWN = 'unknown'
}

// Define error severity
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error interface
export interface AppError {
  type: ErrorType;
  message: string;
  severity: ErrorSeverity;
  originalError?: Error;
  code?: string;
  context?: Record<string, any>;
}

// Map Supabase error codes to user-friendly messages
const errorCodeMessages: Record<string, string> = {
  // Authentication errors
  'auth/invalid-email': 'The email address is not valid.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'This email is already in use by another account.',
  'auth/weak-password': 'The password is too weak. Please use a stronger password.',
  'auth/requires-recent-login': 'This operation requires a more recent login. Please sign in again.',
  'auth/popup-closed-by-user': 'The sign-in popup was closed before completing the sign-in.',
  'auth/cancelled-popup-request': 'The sign-in popup request was cancelled.',
  'auth/popup-blocked': 'The sign-in popup was blocked by the browser.',
  'auth/operation-not-allowed': 'This operation is not allowed.',
  'auth/network-request-failed': 'A network error occurred. Please check your connection and try again.',
  'auth/timeout': 'The operation has timed out. Please try again.',
  'auth/invalid-credential': 'The provided credential is invalid.',
  'auth/invalid-verification-code': 'The verification code is invalid.',
  'auth/invalid-verification-id': 'The verification ID is invalid.',
  'auth/captcha-check-failed': 'The reCAPTCHA verification failed.',
  'auth/missing-verification-code': 'The verification code is missing.',
  'auth/missing-verification-id': 'The verification ID is missing.',
  'auth/phone-number-already-exists': 'This phone number is already in use by another account.',
  'auth/invalid-phone-number': 'The phone number is not valid.',
  'auth/quota-exceeded': 'The quota for this operation has been exceeded.',
  'auth/rejected-credential': 'The credential was rejected.',
  'auth/tenant-id-mismatch': 'The provided tenant ID does not match the Auth instance\'s tenant ID.',
  'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
  'auth/unauthorized-domain': 'The domain of this URL is not authorized.',
  'auth/unsupported-persistence-type': 'The current environment does not support the specified persistence type.',
  'auth/user-token-expired': 'Your session has expired. Please sign in again.',
  'auth/web-storage-unsupported': 'Web storage is not supported or is disabled.',
  'auth/invalid-continue-uri': 'The continue URL provided is invalid.',
  'auth/unauthorized-continue-uri': 'The domain of the continue URL is not whitelisted.',
  'auth/missing-continue-uri': 'A continue URL must be provided in the request.',
  'auth/missing-phone-number': 'The phone number is missing.',
  'auth/missing-app-credential': 'The app credential is missing.',
  'auth/session-expired': 'Your session has expired. Please sign in again.',
  'auth/invalid-app-credential': 'The app credential is invalid.',
  'auth/invalid-app-id': 'The app ID is invalid.',
  'auth/invalid-user-token': 'Your session is no longer valid. Please sign in again.',
  'auth/invalid-auth-event': 'An internal error has occurred.',
  'auth/invalid-tenant-id': 'The tenant ID is invalid.',
  'auth/missing-multi-factor-session': 'The multi-factor session is missing.',
  'auth/missing-multi-factor-info': 'The multi-factor information is missing.',
  'auth/invalid-multi-factor-session': 'The multi-factor session is invalid.',
  'auth/multi-factor-info-not-found': 'The multi-factor information was not found.',
  'auth/multi-factor-auth-required': 'Multi-factor authentication is required to complete this operation.',
  'auth/second-factor-already-in-use': 'The second factor is already enrolled on this account.',
  'auth/maximum-second-factor-count-exceeded': 'The maximum number of second factors has been exceeded.',
  'auth/unsupported-first-factor': 'The first factor is not supported.',
  'auth/unsupported-second-factor': 'The second factor is not supported.',
  'auth/unverified-email': 'The email has not been verified.',
  'auth/second-factor-already-enrolled': 'The second factor is already enrolled.',
  'auth/maximum-tenant-count-exceeded': 'The maximum number of tenants has been exceeded.',
  'auth/unsupported-tenant-operation': 'This operation is not supported in a multi-tenant context.',
  'auth/invalid-dynamic-link-domain': 'The provided dynamic link domain is not configured or authorized for the current project.',
  'auth/argument-error': 'An invalid argument was provided to an Authentication method.',
  'auth/invalid-persistence-type': 'The specified persistence type is invalid.',
  'auth/invalid-oauth-provider': 'The provided OAuth provider is invalid.',
  'auth/invalid-oauth-client-id': 'The provided OAuth client ID is invalid.',
  'auth/invalid-api-key': 'The provided API key is invalid.',
  'auth/invalid-cert-hash': 'The provided SHA-1 certificate hash is invalid.',
  'auth/invalid-credential-or-provider-id': 'The provided credential or provider ID is invalid.',
  'auth/invalid-email-verified': 'The email verified status is invalid.',
  'auth/invalid-id-token': 'The provided ID token is invalid.',
  'auth/invalid-identifier': 'The provided identifier is invalid.',
  'auth/invalid-message-payload': 'The email template corresponding to this action contains invalid characters in its message.',
  'auth/invalid-oauth-response-type': 'The provided OAuth response type is invalid.',
  'auth/invalid-provider-id': 'The provided provider ID is invalid.',
  'auth/invalid-recipient-email': 'The provided recipient email is invalid.',
  'auth/invalid-sender': 'The provided sender is invalid.',
  'auth/missing-android-pkg-name': 'An Android package name must be provided if the Android app is required to be installed.',
  'auth/missing-iframe-start': 'An internal error has occurred.',
  'auth/missing-ios-bundle-id': 'An iOS bundle ID must be provided if an App Store ID is provided.',
  'auth/missing-or-invalid-nonce': 'The provided nonce is invalid.',
  'auth/missing-password': 'The password is missing.',
  'auth/app-deleted': 'This instance of FirebaseApp has been deleted.',
  'auth/null-user': 'A null user object was provided as the argument for an operation which requires a non-null user object.',
  'auth/provider-already-linked': 'The provider has already been linked to the user.',
  'auth/redirect-cancelled-by-user': 'The redirect operation has been cancelled by the user before finalizing.',
  'auth/redirect-operation-pending': 'A redirect sign-in operation is already pending.',
  'auth/user-cancelled': 'The user did not grant your application the permissions it requested.',
  'auth/user-mismatch': 'The supplied credentials do not correspond to the previously signed in user.',
  'auth/user-signed-out': 'The user has been signed out.',
  'auth/already-initialized': 'initializeAuth() has already been called with different options. To avoid this error, call initializeAuth() with the same options as when it was originally called.',
  
  // Database errors
  'database/permission-denied': 'You don\'t have permission to access this data.',
  'database/unavailable': 'The database service is currently unavailable. Please try again later.',
  'database/unknown': 'An unknown database error occurred. Please try again.',
  'database/invalid-argument': 'Invalid data was provided to the database operation.',
  'database/deadline-exceeded': 'The operation took too long to complete. Please try again.',
  'database/not-found': 'The requested data was not found.',
  'database/already-exists': 'The data you\'re trying to create already exists.',
  'database/resource-exhausted': 'The database has reached its resource limits. Please try again later.',
  'database/cancelled': 'The database operation was cancelled.',
  'database/data-loss': 'Unrecoverable data loss or corruption occurred.',
  'database/unauthenticated': 'You must be authenticated to perform this operation.',
  
  // Network errors
  'network/network-request-failed': 'A network error occurred. Please check your connection and try again.',
  'network/timeout': 'The network request timed out. Please try again.',
  'network/abort': 'The network request was aborted.',
  'network/unknown': 'An unknown network error occurred. Please try again.',
  
  // Generic errors
  'unknown-error': 'An unknown error occurred. Please try again.',
  'server-error': 'A server error occurred. Please try again later.',
  'client-error': 'An error occurred in the application. Please try again.',
  'validation-error': 'The data you provided is invalid. Please check your inputs and try again.',
  'not-found': 'The requested resource was not found.',
  'unauthorized': 'You are not authorized to perform this action.',
  'forbidden': 'You don\'t have permission to access this resource.',
  'bad-request': 'The request was invalid or cannot be served.',
  'conflict': 'The request conflicts with the current state of the server.',
  'internal-server-error': 'An internal server error occurred. Please try again later.',
  'service-unavailable': 'The service is currently unavailable. Please try again later.',
  'gateway-timeout': 'The server timed out waiting for another server. Please try again later.',
};

// Create a standardized error object
export function createError(
  type: ErrorType,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  originalError?: Error,
  code?: string,
  context?: Record<string, any>
): AppError {
  return {
    type,
    message,
    severity,
    originalError,
    code,
    context
  };
}

// Get user-friendly message from error code
export function getUserFriendlyMessage(code: string): string {
  return errorCodeMessages[code] || 'An error occurred. Please try again.';
}

// Handle authentication errors
export function handleAuthError(error: any): AppError {
  console.error('Authentication error:', error);
  
  let message = 'Authentication failed. Please try again.';
  let code = 'unknown-error';
  
  if (error.code) {
    code = error.code;
    message = getUserFriendlyMessage(error.code);
  } else if (error.message) {
    message = error.message;
  }
  
  return createError(
    ErrorType.AUTHENTICATION,
    message,
    ErrorSeverity.ERROR,
    error,
    code
  );
}

// Handle database errors
export function handleDatabaseError(error: any): AppError {
  console.error('Database error:', error);
  
  let message = 'A database error occurred. Please try again.';
  let code = 'database/unknown';
  
  if (error.code) {
    code = error.code;
    message = getUserFriendlyMessage(error.code);
  } else if (error.message) {
    message = error.message;
  }
  
  return createError(
    ErrorType.DATABASE,
    message,
    ErrorSeverity.ERROR,
    error,
    code
  );
}

// Handle network errors
export function handleNetworkError(error: any): AppError {
  console.error('Network error:', error);
  
  let message = 'A network error occurred. Please check your connection and try again.';
  let code = 'network/unknown';
  
  if (error.code) {
    code = error.code;
    message = getUserFriendlyMessage(error.code);
  } else if (error.message) {
    message = error.message;
  }
  
  return createError(
    ErrorType.NETWORK,
    message,
    ErrorSeverity.ERROR,
    error,
    code
  );
}

// Handle validation errors
export function handleValidationError(error: any, fieldErrors?: Record<string, string>): AppError {
  console.error('Validation error:', error);
  
  let message = 'Please check your inputs and try again.';
  
  if (error.message) {
    message = error.message;
  }
  
  return createError(
    ErrorType.VALIDATION,
    message,
    ErrorSeverity.WARNING,
    error,
    'validation-error',
    { fieldErrors }
  );
}

// Handle unknown errors
export function handleUnknownError(error: any): AppError {
  console.error('Unknown error:', error);
  
  let message = 'An unexpected error occurred. Please try again.';
  
  if (error.message) {
    message = error.message;
  }
  
  return createError(
    ErrorType.UNKNOWN,
    message,
    ErrorSeverity.ERROR,
    error,
    'unknown-error'
  );
}

// Display error toast
export function showErrorToast(error: AppError): void {
  // Simple console-based toast for now
  console.error(`[${error.type.toUpperCase()}] ${error.message}`);
  
  // Show an alert for critical errors
  if (error.severity === ErrorSeverity.CRITICAL) {
    if (typeof window !== 'undefined') {
      alert(`Critical Error: ${error.message}`);
    }
  }
}

// Get error title based on type
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.AUTHENTICATION:
      return 'Authentication Error';
    case ErrorType.AUTHORIZATION:
      return 'Authorization Error';
    case ErrorType.VALIDATION:
      return 'Validation Error';
    case ErrorType.SERVER:
      return 'Server Error';
    case ErrorType.NETWORK:
      return 'Network Error';
    case ErrorType.DATABASE:
      return 'Database Error';
    case ErrorType.UNKNOWN:
    default:
      return 'Error';
  }
}

// Main error handler function
export function handleError(error: any): AppError {
  // Check if it's already an AppError
  if (error.type && error.message && error.severity) {
    return error as AppError;
  }
  
  // Check error type based on properties or codes
  if (error.code && error.code.startsWith('auth/')) {
    return handleAuthError(error);
  } else if (error.code && error.code.startsWith('database/')) {
    return handleDatabaseError(error);
  } else if (error.code && error.code.startsWith('network/')) {
    return handleNetworkError(error);
  } else if (error.name === 'ValidationError' || (error.errors && Object.keys(error.errors).length > 0)) {
    return handleValidationError(error, error.errors);
  } else {
    return handleUnknownError(error);
  }
}

// Export a function to handle and display errors
export function catchAndDisplayError(fn: (...args: any[]) => Promise<any>) {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error);
      showErrorToast(appError);
      return { error: appError };
    }
  };
}

// Export a function to handle errors in components
export function useErrorHandler() {
  return {
    handleError,
    showErrorToast,
    catchAndDisplayError,
  };
} 