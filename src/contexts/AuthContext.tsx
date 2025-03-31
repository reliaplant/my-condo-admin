'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  AuthState, 
  getCurrentAuthState, 
  listenToAuthChanges, 
  logOut, 
  signIn, 
  signUp,
  resetPassword,
  LoginCredentials,
  SignUpData,
  UserProfile,
  hasRole,
  belongsToCompany,
  UserRole,
  changePassword,
  changeEmail,
  updateUserProfile
} from '@/lib/authService';

// Define a default state for SSR safety
const defaultAuthState: AuthState = {
  user: null,
  profile: null,
  initialized: false,
  loading: true
};

// Define default context values for SSR safety
const defaultContextValue: AuthContextProps = {
  auth: defaultAuthState,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
  login: async () => { throw new Error('AuthProvider not initialized') },
  logout: async () => { throw new Error('AuthProvider not initialized') },
  register: async () => { throw new Error('AuthProvider not initialized') },
  resetUserPassword: async () => { throw new Error('AuthProvider not initialized') },
  updateProfile: async () => { throw new Error('AuthProvider not initialized') },
  changeUserPassword: async () => { throw new Error('AuthProvider not initialized') },
  changeUserEmail: async () => { throw new Error('AuthProvider not initialized') },
  hasUserRole: () => false,
  userBelongsToCompany: () => false
};

interface AuthContextProps {
  auth: AuthState;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: SignUpData) => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>) => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeUserEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  hasUserRole: (roles: UserRole | UserRole[]) => boolean;
  userBelongsToCompany: (companyId: string) => boolean;
}

// Initialize context with default values for SSR safety
const AuthContext = createContext<AuthContextProps>(defaultContextValue);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);
  
  // Initialize auth state on mount
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // First get the initial auth state
        const initialAuthState = await getCurrentAuthState();
        
        if (mounted) {
          setAuth(initialAuthState);
          
          // Then set up a listener for future changes
          unsubscribe = listenToAuthChanges((authState) => {
            if (mounted) {
              console.log('Auth state changed:', JSON.stringify({
                user: authState.user ? { uid: authState.user.uid, email: authState.user.email } : null,
                profile: authState.profile ? { 
                  uid: authState.profile.uid,
                  email: authState.profile.email,
                  role: authState.profile.role,
                  companyId: authState.profile.companyId
                } : null,
                initialized: authState.initialized
              }));
              
              setAuth(authState);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        if (mounted) {
          setAuth({
            user: null,
            profile: null,
            initialized: true,
            loading: false
          });
        }
      }
    };
    
    initializeAuth();
    
    // Cleanup function
    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);
  
  const login = async (credentials: LoginCredentials) => {
    setAuth((prev) => ({ ...prev, loading: true }));
    try {
      const profile = await signIn(credentials);
      // Auth state listener will update the state automatically
      console.log('Login successful:', profile.email);
    } catch (error) {
      console.error('Login error in context:', error);
      setAuth((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  };
  
  const logout = async () => {
    setAuth((prev) => ({ ...prev, loading: true }));
    try {
      await logOut();
      // Clear the state immediately instead of waiting for listener
      setAuth({
        user: null,
        profile: null,
        initialized: true,
        loading: false
      });
    } catch (error) {
      console.error('Logout error:', error);
      setAuth((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  };
  
  const register = async (data: SignUpData) => {
    setAuth((prev) => ({ ...prev, loading: true }));
    try {
      await signUp(data);
      // Don't auto-login after registration for this app
      setAuth((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Registration error:', error);
      setAuth((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  };
  
  const resetUserPassword = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };
  
  const updateProfileData = async (data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>) => {
    if (!auth.user) {
      throw new Error('No authenticated user');
    }
    
    try {
      const updatedProfile = await updateUserProfile(auth.user.uid, data);
      setAuth((prev) => ({
        ...prev,
        profile: updatedProfile
      }));
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };
  
  const changeUserPassword = async (currentPassword: string, newPassword: string) => {
    try {
      await changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };
  
  const changeUserEmail = async (currentPassword: string, newEmail: string) => {
    try {
      await changeEmail(currentPassword, newEmail);
      // Update the auth state with the new email
      if (auth.profile) {
        setAuth((prev) => ({
          ...prev,
          profile: prev.profile ? { ...prev.profile, email: newEmail } : null
        }));
      }
    } catch (error) {
      console.error('Change email error:', error);
      throw error;
    }
  };
  
  const hasUserRole = (roles: UserRole | UserRole[]): boolean => {
    return hasRole(auth.profile, roles);
  };
  
  const userBelongsToCompany = (companyId: string): boolean => {
    return belongsToCompany(auth.profile, companyId);
  };
  
  const value = {
    auth,
    isAuthenticated: !!auth.user,
    isInitialized: auth.initialized,
    isLoading: auth.loading,
    login,
    logout,
    register,
    resetUserPassword,
    updateProfile: updateProfileData,
    changeUserPassword,
    changeUserEmail,
    hasUserRole,
    userBelongsToCompany
  };
  
  // Add debug info to help troubleshoot deployed auth issues
  useEffect(() => {
    console.log('Auth state updated:', {
      isAuthenticated: !!auth.user,
      isInitialized: auth.initialized,
      isLoading: auth.loading,
      user: auth.user ? { uid: auth.user.uid, email: auth.user.email } : null,
      profile: auth.profile ? { 
        role: auth.profile.role, 
        companyId: auth.profile.companyId 
      } : null
    });
  }, [auth]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Modified useAuth hook that's safe for SSR and doesn't throw errors
export const useAuth = (): AuthContextProps => {
  // Get the context
  const context = useContext(AuthContext);
  // The context should now always have at least the default values
  return context;
};