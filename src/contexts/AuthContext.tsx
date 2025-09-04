import React, { createContext, useContext, ReactNode } from 'react';
import { useOptimizedAuth, AuthFlowState, AuthMachineContext } from '../hooks/useOptimizedAuth';
import type { KuriUserProfile } from '../types/user';

// Re-export types for backward compatibility
export { AuthFlowState } from '../hooks/useOptimizedAuth';
export type { AuthMachineContext } from '../hooks/useOptimizedAuth';

interface AuthContextType {
  authState: AuthFlowState;
  context: AuthMachineContext;
  account: any;
  profile: KuriUserProfile | null;
  smartAddress: string | null;
  isLoading: boolean;
  isTransitioning: boolean;
  updateProfile: (updates: Partial<KuriUserProfile> & { image?: File }) => Promise<KuriUserProfile | undefined>;
  paraAccount: any;
  smartWallet: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Single useOptimizedAuth call for entire app
  const authData = useOptimizedAuth();
  
  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider. Make sure App.tsx wraps components with <AuthProvider>.');
  }
  return context;
}

// Backward compatibility hook (optional - for gradual migration)
export function useOptimizedAuthContext(): AuthContextType {
  console.warn('useOptimizedAuthContext is deprecated. Use useAuthContext instead.');
  return useAuthContext();
}