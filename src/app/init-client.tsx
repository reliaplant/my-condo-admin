'use client';

import { useEffect } from 'react';
import { ensureDefaultCompany } from '@/services/companyService';
import { useAuth } from '@/contexts/AuthContext';

export function InitializeApp() {
  const { auth, isAuthenticated } = useAuth();

  useEffect(() => {
    const init = async () => {
      try {
        // Only initialize if user is authenticated
        if (isAuthenticated && auth.profile) {
          // For superadmin and admin only
          if (auth.profile.role === 'superAdmin' || auth.profile.role === 'admin') {
            await ensureDefaultCompany();
            console.log('App initialized successfully');
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    
    init();
  }, [isAuthenticated, auth.profile]);
  
  // This component doesn't render anything
  return null;
}