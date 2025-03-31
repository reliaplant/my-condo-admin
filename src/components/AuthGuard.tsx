'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/authService';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requiredCompanyId?: string;
  redirectTo?: string;
  loadingComponent?: ReactNode;
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
  redirectTo = '/login',
  loadingComponent = (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-12 h-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  )
}) => {
  const { isAuthenticated, isInitialized, isLoading, auth, hasUserRole, userBelongsToCompany } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Don't make any decisions until auth is initialized
    if (!isInitialized) {
      return;
    }
    
    if (!isAuthenticated) {
      console.log('AuthGuard: Not authenticated, redirecting to', redirectTo);
      setHasAccess(false);
      router.push(redirectTo);
      return;
    }
    
    if (auth.profile) {
      let accessGranted = true;
      
      // Check role requirements if specified
      if (requiredRoles && !hasUserRole(requiredRoles)) {
        console.log('AuthGuard: Role check failed', { 
          userRole: auth.profile.role, 
          requiredRoles 
        });
        accessGranted = false;
      }
      
      // Check company requirements if specified
      if (accessGranted && requiredCompanyId && !userBelongsToCompany(requiredCompanyId)) {
        console.log('AuthGuard: Company check failed', { 
          userCompanyId: auth.profile.companyId, 
          requiredCompanyId 
        });
        accessGranted = false;
      }
      
      if (!accessGranted) {
        console.log('AuthGuard: Access denied, redirecting to /unauthorized');
        setHasAccess(false);
        router.push('/unauthorized');
        return;
      }
      
      console.log('AuthGuard: Access granted');
      setHasAccess(true);
    }
  }, [
    isAuthenticated, 
    isInitialized, 
    auth.profile, 
    requiredRoles, 
    requiredCompanyId, 
    router, 
    redirectTo, 
    hasUserRole, 
    userBelongsToCompany
  ]);
  
  // Show loading state while initializing auth or checking access
  if (!isInitialized || isLoading || hasAccess === null) {
    return <>{loadingComponent}</>;
  }
  
  // If access is denied, don't render children
  if (!hasAccess) {
    return null;
  }
  
  // All checks passed, render children
  return <>{children}</>;
};

export default AuthGuard;