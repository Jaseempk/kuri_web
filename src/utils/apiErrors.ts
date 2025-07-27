export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Handle API errors and return user-friendly messages
 */
export const handleApiError = (error: any): string => {
  // If it's already a formatted error message
  if (error?.message) return error.message;
  
  // If it's a string error
  if (typeof error === 'string') return error;
  
  // Check for specific error types
  if (error?.code === 'VALIDATION_ERROR') {
    return 'Please check your input and try again.';
  }
  
  if (error?.code === 'UNAUTHORIZED') {
    return 'Authentication failed. Please try signing the message again.';
  }
  
  if (error?.code === 'FORBIDDEN') {
    return 'You do not have permission to perform this action.';
  }
  
  // Default fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if error is a network connectivity issue
 */
export const isNetworkError = (error: any): boolean => {
  return error?.name === 'TypeError' && error?.message?.includes('fetch');
};

/**
 * Check if error is due to user rejecting wallet signature
 */
export const isUserRejectionError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || '';
  return message.includes('user rejected') || 
         message.includes('user denied') || 
         message.includes('rejected');
};

/**
 * Format error for display to user
 */
export const formatErrorForUser = (error: any): string => {
  if (isUserRejectionError(error)) {
    return 'Transaction was cancelled by user.';
  }
  
  if (isNetworkError(error)) {
    return 'Unable to connect to server. Please check your internet connection and try again.';
  }
  
  return handleApiError(error);
};