'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        if (isAuthenticated) {
          await logout();
        }
        // Force a hard navigation to the login page
        window.location.href = '/login';
      } catch (error) {
        console.error('Error during logout:', error);
        router.push('/unauthorized');
      }
    };

    performLogout();
  }, [logout, router, isAuthenticated]);

  return (

    <div className="flex justify-center items-center min-h-screen">
      <div className="w-12 h-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>      
    );
}