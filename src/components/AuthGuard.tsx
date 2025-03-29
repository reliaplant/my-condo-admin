import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/authService';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requiredCompanyId?: string;
  redirectTo?: string;
}

/**
 * Auth Guard component to protect routes
 * Can restrict access by:
 * - Authentication status
 * - User roles
 * - Company membership
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRoles,
  requiredCompanyId,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isInitialized, isLoading, auth, hasUserRole, userBelongsToCompany } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      // Not authenticated, redirect to login
      router.push(redirectTo);
      return;
    }
    
    if (isAuthenticated && auth.profile) {
      // Check role requirements if specified
      if (requiredRoles && !hasUserRole(requiredRoles)) {
        router.push('/unauthorized');
        return;
      }
      
      // Check company requirements if specified
      if (requiredCompanyId && !userBelongsToCompany(requiredCompanyId)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, isInitialized, isLoading, auth.profile, requiredRoles, requiredCompanyId, router, redirectTo, hasUserRole, userBelongsToCompany]);
  
  // Show loading state while initializing auth
  if (!isInitialized || isLoading) {
    return <div>Loading...</div>;
  }
  
  // Not authenticated, don't render children (will redirect in useEffect)
  if (!isAuthenticated) {
    return null;
  }
  
  // Check role requirements
  if (requiredRoles && !hasUserRole(requiredRoles)) {
    return null; // Will redirect in useEffect
  }
  
  // Check company requirements
  if (requiredCompanyId && !userBelongsToCompany(requiredCompanyId)) {
    return null; // Will redirect in useEffect
  }
  
  // All checks passed, render children
  return <>{children}</>;
};

export default AuthGuard;