'use client';

import { useState, useEffect } from 'react';
import { getVehicleRecords, markAsProcessed, deleteVehicleRecord } from '@/services/vehicleRecordService';
import { VehicleRecord } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function VehicleRecordsPage() {
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'entry' | 'exit'>('all');
  const [selectedRecord, setSelectedRecord] = useState<VehicleRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isAuthenticated, isInitialized, auth, hasUserRole } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Wait until auth is initialized before checking
    if (!isInitialized) {
      return;
    }
    
    // After auth is initialized, check if user is authenticated
    if (!isAuthenticated) {

      router.push('/unauthorized'); // or to your unauthorized page
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      return;
    }
    if (isAuthenticated && auth.profile) {
      fetchRecords();
    }
  }, [isAuthenticated, auth.profile]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const companyId = auth.profile?.companyId;
      const data = await getVehicleRecords(companyId);
      // Add console.log to check the exit timestamp data
      console.log('Vehicle records data:', data.map(r => ({ 
        id: r.id, 
        exitTimestamp: r.exitTimestamp, 
        exitPlateImageUrl: r.exitPlateImageUrl 
      })));
      // If the user is authenticated, get records for their company

      setRecords(data);
    } catch (error) {
      console.error('Error fetching vehicle records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (records.length > 0) {
      console.log('Sample record:', records[0]);
      const sampleWithExit = records.find(r => r.exitTimestamp || r.exitPlateImageUrl);
      if (sampleWithExit) {
        console.log('Sample with exit:', sampleWithExit);
        console.log('Exit timestamp type:', typeof sampleWithExit.exitTimestamp);
        if (sampleWithExit.exitTimestamp) {
          try {
            console.log('Exit timestamp date attempt:', new Date(sampleWithExit.exitTimestamp));
          } catch (e) {
            console.error('Failed to create date from exitTimestamp:', e);
          }
        }
      }
    }
  }, [records]);

  // Add more debugging to examine the exitTimestamp format
  useEffect(() => {
    if (records.length > 0) {
      const recordsWithExit = records.filter(r => r.exitPlateImageUrl);
      console.log('Records with exit images:', recordsWithExit.length);
      
      recordsWithExit.forEach(record => {
        console.log('Exit record:', { 
          id: record.id,
          exitTimestamp: record.exitTimestamp,
          exitTimeType: typeof record.exitTimestamp,
          exitPlateImageUrl: record.exitPlateImageUrl ? 'exists' : 'missing'
        });
      });
    }
  }, [records]);

  const handleMarkAsProcessed = async (id: string) => {
    try {
      await markAsProcessed(id);
      setRecords(records.map(record => 
        record.id === id ? { ...record, processed: true } : record
      ));
    } catch (error) {
      console.error('Error marking record as processed:', error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    // Only admin and superadmin can delete records
    if (!hasUserRole(['admin', 'superAdmin'])) {
      alert('No tienes permisos para eliminar registros');
      return;
    }

    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      try {
        const companyId = auth.profile?.companyId;
        await deleteVehicleRecord(id, companyId);
        setRecords(records.filter(record => record.id !== id));
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
          setIsModalOpen(false);
        }
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = records.map(record => ({
      'Driver Name': record.driverName,
      'License Plate': record.licensePlate,
      'House': `${record.houseBlock}-${record.houseNumber}`,
      'Type': record.entryType,
      'Date': format(record.createdAt, 'yyyy-MM-dd'),
      'Time': format(record.createdAt, 'HH:mm:ss'),
      'Processed': record.processed ? 'Yes' : 'No'
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicle Records');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-records-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
  };

  // Helper function to calculate duration
  const calculateDuration = (startDate: Date, endDate: Date): string => {
    const durationMs = endDate.getTime() - startDate.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Add the formatDate function
  const formatDate = (dateString: any) => {
    console.log(dateString)
      const date = new Date(dateString.seconds ? dateString.seconds * 1000 : dateString);
      return format(date, 'dd/MM/yyyy HH:mm');

  };

  const filteredRecords = records.filter(record => {
    // Apply search filter
    const matchesSearch = 
      record.driverName.toLowerCase().includes(search.toLowerCase()) ||
      record.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      `${record.houseBlock}-${record.houseNumber}`.toLowerCase().includes(search.toLowerCase());
    
    // Apply type filter
    const matchesFilter = filter === 'all' || record.entryType === filter;
    
    return matchesSearch && matchesFilter;
  });
  // Don't render anything until auth is initialized
  if (!isInitialized) {
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

  return (
    <div className="min-h-screen">
    
      <div className="px-4 py-2 bg-white">
        <div className="flex flex-row items-center justify-between" >
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight mb-0">Registro de Vehículos</h1>
          </div>
          {/* Filtros */}
        <div className="w-[25vw]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-grow">
              <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
              </div>
              <input
          type="text"
          placeholder="Buscar por nombre, placa o casa"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
               text-sm text-gray-700 placeholder-gray-400
               shadow-sm hover:shadow-md
               focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-500 ease-in-out"
              />
              </div>
            </div>
            </div>
        </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportToExcel}
              className="px-4 py-1.5 bg-black hover:bg-black/80 text-white rounded-full border-2 border-gray-300 cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
              </svg>
              <span className='text-sm'>Exportar a Excel</span>
            </button>
          </div>
        </div>

        

       
        </div>

         {/* Tabla de Registros */}
         <div className="bg-white border border-gray-200 overflow-hidden ">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-gray-500 text-lg mb-2">No se encontraron registros de vehículos</p>
              <p className="text-gray-400">Intente con otros criterios de búsqueda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora de Entrada
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conductor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Casa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora de salida
                    </th>
                  
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-blue-50  cursor-pointer" onClick={() => {
                      setSelectedRecord(record);
                      setIsModalOpen(true);
                    }}>


                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(record.createdAt, 'dd/MM/yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.driverName}</div>
                      </td>
                       <td className="px-6 py-2 whitespace-nowrap">
                       <div className="text-sm font-semibold text-gray-900">{record.licensePlate}</div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Bloque {record.houseBlock}, #{record.houseNumber}</div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(() => {
                            // If there's an exitPlateImageUrl or exitTimestamp, we know there's an exit
                            if (record.exitPlateImageUrl || record.exitTimestamp) {
                              try {
                                // Format exitTimestamp using our simplified function
                                if (record.exitTimestamp) {
                                  const exitTimeFormatted = formatDate(record.exitTimestamp);
                                  
                                  // If we can calculate duration
                                  try {
                                    const entryDate = new Date(record.timestamp || record.createdAt);
                                    const exitDate = new Date(record.exitTimestamp);
                                    
                                    if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime())) {
                                      const duration = calculateDuration(entryDate, exitDate);
                                      return `${exitTimeFormatted} (${duration})`;
                                    }
                                  } catch (e) {
                                    console.error("Error calculating duration:", e);
                                  }
                                  
                                  // Just return the formatted date if calculating duration fails
                                  return exitTimeFormatted;
                                }
                                return "Salida registrada";
                              } catch (error) {
                                console.error("Exit timestamp error:", error);
                                return "Error al procesar fecha";
                              }
                            }
                            
                            // No exit data
                            return (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pendiente
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                     
                     
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {/* Modal de Detalles */}
        {isModalOpen && selectedRecord && (
          <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-2 pl-6 px-4 border-b border-gray-200">
                <h2 className="text font-bold text-gray-800">Detalles del Registro</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedRecord(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Información del vehículo */}
                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="text font-bold text-gray-800 mb-4 flex items-center">

                        Información del Vehículo
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Placa</p>
                          <p className="text font-semibold">{selectedRecord.licensePlate}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Tipo de Vehículo</p>
                          <p className="text font-semibold">{selectedRecord.vehicleType || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="text font-bold text-gray-800 mb-4 flex items-center">

                        Información del Conductor
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Nombre</p>
                          <p className="text font-semibold">{selectedRecord.driverName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Destino</p>
                          <p className="text font-semibold">Bloque {selectedRecord.houseBlock}, #{selectedRecord.houseNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text font-bold text-gray-800 mb-4 flex items-center">

                        Detalles del Registro
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2">
                          <p className="text-sm text-gray-500">Fecha y Hora</p>
                          <p className="text font-semibold">{format(selectedRecord.createdAt, 'PPpp')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Imágenes */}
                  <div className="space-y-6">

                    {selectedRecord.plateImageUrl && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-md font-medium text-gray-800 mb-3">Imagen de Placa</p>
                        <div className="relative h-64 w-full border border-gray-300 rounded-lg overflow-hidden bg-white">
                          <Image 
                          src={selectedRecord.plateImageUrl} 
                          alt="Placa del vehículo" 
                          fill
                          style={{ objectFit: 'cover' }}
                          className=""
                          />
                        </div>
                      </div>
                    )}
                    
                    {selectedRecord.idImageUrl && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-md font-medium text-gray-800 mb-3">Imagen de Identificación</p>
                        <div className="relative h-64 w-full border border-gray-300 rounded-lg overflow-hidden bg-white">
                          <Image 
                            src={selectedRecord.idImageUrl} 
                            alt="Identificación" 
                            fill
                            style={{ objectFit: 'cover' }}
                            className=""
                          />
                        </div>
                      </div>
                    )}

                    {!selectedRecord.plateImageUrl && !selectedRecord.idImageUrl && (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p className="text-gray-500">No hay imágenes disponibles para este registro</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="sticky bottom-0 bg-gray-50 p-4 flex justify-end space-x-3">
                {/* {!selectedRecord.processed && (
                  <button
                    onClick={() => {
                      handleMarkAsProcessed(selectedRecord.id);
                      setIsModalOpen(false);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Marcar como Procesado
                  </button>
                )}
                {/* Only show delete button for admin/superAdmin */}
                {hasUserRole(['admin', 'superAdmin']) && (
                  <button
                    onClick={() => {
                      handleDeleteRecord(selectedRecord.id);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Eliminar Registro
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedRecord(null);
                  }}
                  className="px-5 py-1.5 bg-white border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}