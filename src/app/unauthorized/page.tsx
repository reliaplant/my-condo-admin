'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/authService';

export default function UnauthorizedPage() {
  const { isAuthenticated, auth } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center">
        <div className="bg-red-100 text-red-600 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-lg text-gray-600 mb-8">
          No tienes permisos para acceder a esta página.
        </p>
        
        {isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Estás conectado como <span className="font-semibold">{auth.profile?.displayName}</span> con rol de <span className="font-semibold">{getRoleLabel(auth.profile?.role)}</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Ir al Dashboard
              </Link>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Volver Atrás
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Iniciar Sesión
            </Link>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Volver Atrás
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getRoleLabel(role?: UserRole): string {
  switch (role) {
    case 'superAdmin':
      return 'Super Administrador';
    case 'admin':
      return 'Administrador';
    case 'employee':
      return 'Empleado';
    default:
      return 'Usuario';
  }
}