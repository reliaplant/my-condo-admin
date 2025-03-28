'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { getDashboardMetrics, generateMockDashboardData } from '@/services/dashboardService';
import { DashboardMetrics } from '@/types';
import Link from 'next/link';

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
          const data = await getDashboardMetrics();
          setMetrics(data);
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

    fetchData();
  }, [useMockData]);

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
        <div className="text-center bg-white p-10 rounded-xl shadow-2xl max-w-lg">
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
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Panel Principal</h1>
            <p className="text-gray-600 mt-2 text-lg">Resumen de actividades y métricas del condominio</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="bg-white rounded-xl shadow-md p-2 flex items-center">
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

        {/* KPI Cards - Diseño mejorado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 opacity-10 rounded-full -mt-10 -mr-10 group-hover:bg-blue-600 transition-all duration-300"></div>
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">VISITANTES HOY</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-gray-800">{metrics.totalVisitors.today}</p>
              <p className="text-green-500 ml-3 text-sm font-semibold mb-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
                {Math.floor(metrics.totalVisitors.today * 0.12)} hoy
              </p>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-10 rounded-full -mt-10 -mr-10 group-hover:bg-green-600 transition-all duration-300"></div>
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">TIEMPO PROMEDIO</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-gray-800">{metrics.averageStayTime}</p>
              <p className="text-gray-500 ml-3 text-sm font-medium mb-1">minutos</p>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500 opacity-10 rounded-full -mt-10 -mr-10 group-hover:bg-yellow-600 transition-all duration-300"></div>
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">INCIDENTES ABIERTOS</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-gray-800">{metrics.incidentStats.open}</p>
              <p className="text-yellow-600 ml-3 text-sm font-semibold mb-1">requieren atención</p>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-10 rounded-full -mt-10 -mr-10 group-hover:bg-purple-600 transition-all duration-300"></div>
            <h2 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wider">ENTRADAS/SALIDAS</h2>
            <div className="flex items-end">
              <p className="text-4xl font-bold text-gray-800">{metrics.totalEntries}/{metrics.totalExits}</p>
              <p className="text-purple-600 ml-3 text-sm font-semibold mb-1">este mes</p>
            </div>
          </div>
        </div>
        
        {/* Gráficos Fila 1 - Mejora estética */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Visitantes por Hora</h2>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Hoy</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.entriesByHour}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tickLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value) => [`${value} visitantes`, 'Cantidad']}
                    labelFormatter={(label) => `Hora: ${label}:00`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={CHART_COLORS.primary} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorVisitors)" 
                    name="Visitantes" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Entradas vs Salidas</h2>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Últimos 7 días</div>
            </div>
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
        
        {/* Gráficos Fila 2 - Mejora estética */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Visitas por Bloque</h2>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Este mes</div>
            </div>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(metrics.visitsByBlock).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    stroke="#fff"
                    strokeWidth={2}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(metrics.visitsByBlock).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} visitas`, 'Cantidad']} contentStyle={{ borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Estado de Incidentes</h2>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Actual</div>
            </div>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Abiertos', value: metrics.incidentStats.open },
                      { name: 'En Progreso', value: metrics.incidentStats.inProgress },
                      { name: 'Resueltos', value: metrics.incidentStats.resolved }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    stroke="#fff"
                    strokeWidth={2}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} incidentes`, 'Cantidad']} contentStyle={{ borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Visitantes Frecuentes</h2>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Top 5</div>
            </div>
            <div className="space-y-5">
              {metrics.topVisitors.map((visitor, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold mr-4 ${
                      index === 0 ? 'bg-blue-600' : 
                      index === 1 ? 'bg-blue-500' : 
                      index === 2 ? 'bg-blue-400' : 'bg-blue-300'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-800">{visitor.name}</span>
                  </div>
                  <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-sm font-medium">
                    {visitor.count} visitas
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Acciones Rápidas - Mejora estética */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-10 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/vehicles"
              className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              Registro de Vehículos
            </Link>
            <Link
              href="/incidents"
              className="flex items-center justify-center bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white py-4 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              Gestionar Incidentes
            </Link>
            <Link
              href="/settings"
              className="flex items-center justify-center bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white py-4 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Configuración
            </Link>
          </div>
        </div>
        
        {/* Opciones de Exportación - Mejora estética */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Exportar Datos</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => exportToPDF(metrics)}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              <span>Exportar como PDF</span>
            </button>
            <button
              onClick={() => exportToExcel(metrics)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
              </svg>
              <span>Exportar como Excel</span>
            </button>
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
