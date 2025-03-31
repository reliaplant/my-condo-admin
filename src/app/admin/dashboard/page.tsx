'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSystemStats } from '@/services/superAdminService';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { isAuthenticated, hasUserRole } = useAuth();
  const router = useRouter();
  
  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/unauthorized');
      return;
    }
    
    // Check if the user is a superAdmin
    if (!hasUserRole('superAdmin')) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, hasUserRole, router]);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isAuthenticated && hasUserRole('superAdmin')) {
          const systemStats = await getSystemStats();
          setStats(systemStats);
        }
      } catch (error) {
        console.error('Error fetching system stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [isAuthenticated, hasUserRole]);
  
  if (!isAuthenticated || !hasUserRole('superAdmin')) {
    return null; // Will redirect in useEffect
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-16 h-16">
          <svg className="animate-spin w-full h-full text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Panel de Super Admin</h1>
          <p className="text-gray-600 mt-2 text-lg">Administración del sistema y empresas</p>
        </div>
        
        {/* System Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 opacity-10 rounded-full -mt-10 -mr-10 group-hover:bg-blue-600 transition-all duration-300"></div>
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">EMPRESAS</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-gray-800">{stats?.totalCompanies || 0}</p>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-10 rounded-full -mt-10 -mr-10 group-hover:bg-green-600 transition-all duration-300"></div>
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">USUARIOS TOTALES</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-gray-800">{stats?.totalUsers || 0}</p>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 opacity-10 rounded-full -mt-10 -mr-10 group-hover:bg-indigo-600 transition-all duration-300"></div>
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">ADMINISTRADORES</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-gray-800">{stats?.usersByRole?.admin || 0}</p>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-10 rounded-full -mt-10 -mr-10 group-hover:bg-purple-600 transition-all duration-300"></div>
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">USUARIOS ACTIVOS</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-gray-800">{stats?.activeUsers || 0}</p>
              <p className="text-purple-600 ml-3 text-sm font-semibold mb-1">
                {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/companies/new"
              className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              Crear Nueva Empresa
            </Link>
            <Link
              href="/users/new"
              className="flex items-center justify-center bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
              Crear Nuevo Usuario
            </Link>
            <Link
              href="/companies"
              className="flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Gestionar Empresas
            </Link>
          </div>
        </div>
        
        {/* Companies Preview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Empresas Recientes</h2>
            <Link href="/companies" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              Ver Todas
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
          
          {/* Sample company list - would be replaced with actual data */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuarios
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Editar</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        TI
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Thandi Inc.</div>
                        <div className="text-sm text-gray-500">Admin por defecto</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Admin User</div>
                    <div className="text-sm text-gray-500">admin@thandi.com</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    10 usuarios
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Activa
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href="/companies/thandi" className="text-blue-600 hover:text-blue-900">Gestionar</Link>
                  </td>
                </tr>
                {/* Additional company rows would be populated from actual data */}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Usuarios Recientes</h2>
            <Link href="/users" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              Ver Todos
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
          
          {/* Sample users list - would be replaced with actual data */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Editar</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        A
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Admin User</div>
                        <div className="text-sm text-gray-500">admin@thandi.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Administrador</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Thandi Inc.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href="/users/1" className="text-blue-600 hover:text-blue-900">Editar</Link>
                  </td>
                </tr>
                {/* Additional user rows would be populated from actual data */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}