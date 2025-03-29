'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { getDashboardMetrics, generateMockDashboardData } from '@/services/dashboardService';
import { DashboardMetrics } from '@/types';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Paleta de colores más elegante
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#8b5cf6',
  gradient: ['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.0)']
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(true);
  
  const { isAuthenticated, auth, hasUserRole } = useAuth();
  const router = useRouter();
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (useMockData) {
          // Usar datos de demostración
          const mockData = generateMockDashboardData();
          setMetrics(mockData);
        } else {
          // Usar datos reales de Firebase
          // If the user is an admin or superAdmin, get data for their company
          if (isAuthenticated && auth.profile) {
            const companyId = auth.profile.companyId;
            const data = await getDashboardMetrics(companyId);
            setMetrics(data);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos del panel:', error);
        // Usar datos de demostración si falla la carga de datos reales
        const mockData = generateMockDashboardData();
        setMetrics(mockData);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if authenticated
    if (isAuthenticated) {
      fetchData();
    }
  }, [useMockData, isAuthenticated, auth.profile]);

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
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

  if (!metrics) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-10 rounded shadow-2xl">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Error al Cargar el Panel</h1>
          <p className="text-gray-600 mb-6">No se pudieron cargar los datos del panel. Por favor intente nuevamente.</p>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-[2vw] from-gray-50">
      <div className="">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Panel Principal</h1>
            <p className="text-gray-600 text-lg">
              {auth.profile?.companyId
                ? `Resumen de actividades y métricas de ${auth.profile.role === 'admin' ? 'su empresa' : 'la empresa'}`
                : 'Resumen de actividades y métricas del sistema'}
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="bg-white rounded shadow-md p-2 flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMockData}
                  onChange={() => setUseMockData(!useMockData)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-700">
                  Usar Datos de Demostración
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Gráficos Fila 1 - Mejora estética */}
        <div className='bg-white border-b border-gray-200 p-4 justify-between flex items-center'>
          <h2 className="text font-bold text-gray-800">Entradas vs Salidas</h2>
          <div className="flex items-center justify-between">
            <select
              className="border-2 border-gray-200 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors appearance-none bg-right pr-8"
              defaultValue="7days"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1em 1.5em'
              }}
            >
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="7days">Últimos 7 días</option>
              <option value="28days">Últimos 28 días</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-4 bg-white mb-10">

          <div className="col-span-1 relative overflow-hidden  group flex flex-col justify-center">
            <div className="flex items-end justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-800">{metrics.totalEntries}</p>
                <p className="text-gray-600">Entradas</p>
                <div className="my-2 text-2xl font-bold text-gray-400">vs</div>
                <p className="text-4xl font-bold text-gray-800">{metrics.totalExits}</p>
                <p className="text-gray-600">Salidas</p>
              </div>
            </div>
          </div>

          <div className="col-span-3 border border-gray-100 p-6 ">

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.entryExitTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                  <Legend iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="entries"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    name="Entradas"
                  />
                  <Line
                    type="monotone"
                    dataKey="exits"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Salidas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tarjetas de Incidentes */}
        <div className='bg-white border-b border-gray-200 p-4 justify-between flex items-center'>
          <h2 className="text font-bold text-gray-800">Manejo de Incidentes</h2>
          <div className="flex items-center justify-between">
            <select
              className="border-2 border-gray-200 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors appearance-none bg-right pr-8"
              defaultValue="7days"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1em 1.5em'
              }}
            >
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="7days">Últimos 7 días</option>
              <option value="28days">Últimos 28 días</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-10 bg-white">
          <div className="relative overflow-hidden bg-white rounded  border border-t-0 border-gray-100 p-6 ">
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">Sin Atención</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-gray-600">{metrics.incidentStats.open}</p>
              <p className="text-gray-600 ml-3 text-sm ">incidentes</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white rounded  border border-gray-100 p-6 ">
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">En Proceso</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-yellow-500">{metrics.incidentStats.inProgress}</p>
              <p className="text-gray-600 ml-3 text-sm ">incidentes</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white rounded  border border-gray-100 p-6 ">
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">Resueltos</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-green-500">{metrics.incidentStats.resolved}</p>
              <p className="text-gray-600 ml-3 text-sm ">incidentes</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white rounded  border border-gray-100 p-6 ">
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">Con Atraso</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-red-800">2</p>
              <p className="text-gray-600 ml-3 text-sm ">incidentes</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Función para exportar a PDF
const exportToPDF = (metrics: DashboardMetrics) => {
  // En una app real, esto usaría jsPDF para generar un PDF
  alert('La funcionalidad de exportación a PDF se implementaría aquí');
  console.log('Datos a exportar:', metrics);
};

// Función para exportar a Excel
const exportToExcel = (metrics: DashboardMetrics) => {
  // En una app real, esto usaría xlsx para generar un archivo Excel
  alert('La funcionalidad de exportación a Excel se implementaría aquí');
  console.log('Datos a exportar:', metrics);
};
