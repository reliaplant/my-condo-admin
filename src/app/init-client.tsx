'use client';

import { useEffect } from 'react';
import { ensureDefaultCompany } from '@/services/companyService';

export function InitializeApp() {
  useEffect(() => {
    const init = async () => {
      try {
        await ensureDefaultCompany();
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    
    init();
  }, []);
  
  // This component doesn't render anything
  return null;
}
