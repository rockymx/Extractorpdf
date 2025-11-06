import { Session, User } from '@supabase/supabase-js';

export interface AuthValidationResult {
  isValid: boolean;
  reason?: string;
}

export const validateSession = (user: User | null, session: Session | null): AuthValidationResult => {
  if (!user) {
    return {
      isValid: false,
      reason: 'No user object'
    };
  }

  if (!session) {
    return {
      isValid: false,
      reason: 'No session object'
    };
  }

  if (!session.access_token) {
    return {
      isValid: false,
      reason: 'No access token in session'
    };
  }

  const expiresAt = session.expires_at;
  if (expiresAt) {
    const now = Math.floor(Date.now() / 1000);
    if (now >= expiresAt) {
      return {
        isValid: false,
        reason: 'Session expired'
      };
    }
  }

  return {
    isValid: true
  };
};

export const isAuthenticationError = (errorCode?: string): boolean => {
  if (!errorCode) return false;

  const authErrorCodes = [
    '42501',
    'PGRST301',
    'PGRST302',
    '401'
  ];

  return authErrorCodes.includes(errorCode);
};

export const isRateLimitError = (errorCode?: string, status?: number): boolean => {
  return errorCode === '429' || status === 429;
};

export const isDuplicateRecordError = (errorCode?: string): boolean => {
  return errorCode === 'PGRST116';
};
