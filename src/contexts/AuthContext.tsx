"use client";
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

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    profile: null,
    initialized: false,
    loading: true
  });
  
  useEffect(() => {
    const fetchAuthState = async () => {
      try {
        const initialAuthState = await getCurrentAuthState();
        setAuth(initialAuthState);
      } catch (error) {
        console.error('Error initializing auth state:', error);
        setAuth({
          user: null,
          profile: null,
          initialized: true,
          loading: false
        });
      }
    };
    
    fetchAuthState();
    
    // Listen for auth state changes
    const unsubscribe = listenToAuthChanges((authState) => {
      setAuth(authState);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  const login = async (credentials: LoginCredentials) => {
    setAuth((prev) => ({ ...prev, loading: true }));
    try {
      const profile = await signIn(credentials);
      // Auth state listener will update the state
    } catch (error) {
      setAuth((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  };
  
  const logout = async () => {
    setAuth((prev) => ({ ...prev, loading: true }));
    try {
      await logOut();
      // Auth state listener will update the state
    } catch (error) {
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
      setAuth((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  };
  
  const resetUserPassword = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (error) {
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
      throw error;
    }
  };
  
  const changeUserPassword = async (currentPassword: string, newPassword: string) => {
    try {
      await changePassword(currentPassword, newPassword);
    } catch (error) {
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
      throw error;
    }
  };
  
  const hasUserRole = (roles: UserRole | UserRole[]): boolean => {
    return hasRole(auth.profile, roles);
  };
  
  const userBelongsToCompany = (companyId: string): boolean => {
    return belongsToCompany(auth.profile, companyId);
  };
  
  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};