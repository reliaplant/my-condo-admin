'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { auth, logout, isAuthenticated, hasUserRole } = useAuth();
  const pathname = usePathname();

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  // Navigation links based on user role
  const navigationLinks = () => {
    const links = [];

    if (isAuthenticated) {
      // Dashboard - visible to all authenticated users
      links.push({
        name: 'Dashboard',
        href: '/dashboard',
        active: pathname === '/dashboard'
      });

      // Vehicle Records - visible to all authenticated users
      links.push({
        name: 'Vehículos',
        href: '/vehicles',
        active: pathname === '/vehicles'
      });

      // Admin links
      if (hasUserRole(['admin', 'superAdmin'])) {
        links.push({
          name: 'Incidentes',
          href: '/incidents',
          active: pathname === '/incidents'
        });
      }

      // SuperAdmin links
      if (hasUserRole('superAdmin')) {
        links.push({
          name: 'Empresas',
          href: '/companies',
          active: pathname === '/companies'
        });
        links.push({
          name: 'Usuarios',
          href: '/users',
          active: pathname === '/users'
        });
      }
    }

    return links;
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeMenus();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                MyCondo
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${
                    link.active
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Right side - profile dropdown */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-2">
                      {auth.profile?.displayName.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="mr-2 text-gray-700">{auth.profile?.displayName}</span>
                    <svg
                      className={`h-5 w-5 text-gray-400 ${isProfileOpen ? 'transform rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                
                {/* Profile dropdown */}
                {isProfileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      {auth.profile?.email}
                    </div>
                    <div className="px-4 py-2 text-xs text-gray-500">
                      Rol: {auth.profile?.role === 'superAdmin' ? 'Super Admin' : 
                           auth.profile?.role === 'admin' ? 'Administrador' : 'Empleado'}
                    </div>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeMenus}
                    >
                      Mi Perfil
                    </Link>
                    {hasUserRole(['admin', 'superAdmin']) && (
                      <Link 
                        href="/settings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeMenus}
                      >
                        Configuración
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-700"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Iniciar Sesión
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigationLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  link.active
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={closeMenus}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          {/* Mobile profile section */}
          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {auth.profile?.displayName.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{auth.profile?.displayName}</div>
                  <div className="text-sm font-medium text-gray-500">{auth.profile?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={closeMenus}
                >
                  Mi Perfil
                </Link>
                {hasUserRole(['admin', 'superAdmin']) && (
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={closeMenus}
                  >
                    Configuración
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-4 flex space-x-4">
                <Link
                  href="/login"
                  className="block text-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={closeMenus}
                >
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}