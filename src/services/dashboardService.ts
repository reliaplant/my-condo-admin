import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  startAt,
  endAt,
  startAfter,
  getCountFromServer
} from 'firebase/firestore';
import { db, DEFAULT_COMPANY_ID } from '@/lib/firebase';
import { DashboardMetrics, VehicleRecord, Incident } from '@/types';

// Helper function to get start and end of day/week/month
const getTimeRanges = () => {
  const now = new Date();
  
  // Today range
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  // Week range (last 7 days)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  
  // Month range (last 30 days)
  const startOfMonth = new Date(now);
  startOfMonth.setDate(now.getDate() - 30);
  
  return {
    today: {
      start: startOfToday,
      end: endOfToday
    },
    week: {
      start: startOfWeek,
      end: now
    },
    month: {
      start: startOfMonth,
      end: now
    }
  };
};

export const getDashboardMetrics = async (
  companyId: string = DEFAULT_COMPANY_ID
): Promise<DashboardMetrics> => {
  const timeRanges = getTimeRanges();
  
  // Get vehicle records for different time periods
  const vehicleRecordsToday = await getVehicleRecordsForTimeRange(
    timeRanges.today.start,
    timeRanges.today.end,
    companyId
  );
  
  const vehicleRecordsWeek = await getVehicleRecordsForTimeRange(
    timeRanges.week.start,
    timeRanges.week.end,
    companyId
  );
  
  const vehicleRecordsMonth = await getVehicleRecordsForTimeRange(
    timeRanges.month.start,
    timeRanges.month.end,
    companyId
  );
  
  // Get incidents
  const incidents = await getIncidentStats(companyId);
  
  // Calculate entries by hour
  const entriesByHour = calculateEntriesByHour(vehicleRecordsToday);
  
  // Calculate entry/exit trends
  const entryExitTrend = await calculateEntryExitTrend(companyId);
  
  // Calculate average stay time (mock data for now)
  const averageStayTime = 45; // 45 minutes
  
  // Calculate top visitors
  const topVisitors = calculateTopVisitors(vehicleRecordsMonth);
  
  // Calculate visits by block
  const visitsByBlock = calculateVisitsByBlock(vehicleRecordsMonth);
  
  return {
    totalEntries: vehicleRecordsMonth.filter(record => record.entryType === 'entry').length,
    totalExits: vehicleRecordsMonth.filter(record => record.entryType === 'exit').length,
    totalVisitors: {
      today: vehicleRecordsToday.length,
      week: vehicleRecordsWeek.length,
      month: vehicleRecordsMonth.length
    },
    averageStayTime,
    visitsByBlock,
    incidentStats: incidents,
    topVisitors,
    entriesByHour,
    entryExitTrend
  };
};

const getVehicleRecordsForTimeRange = async (
  startDate: Date,
  endDate: Date,
  companyId: string = DEFAULT_COMPANY_ID
): Promise<VehicleRecord[]> => {
  const vehicleRecordsRef = collection(db, `companies/${companyId}/vehicleRecords`);
  const q = query(
    vehicleRecordsRef,
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      companyId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      timestamp: data.timestamp?.toDate() || new Date()
    } as VehicleRecord;
  });
};

const getIncidentStats = async (
  companyId: string = DEFAULT_COMPANY_ID
): Promise<{ open: number, inProgress: number, resolved: number }> => {
  const incidentsRef = collection(db, `companies/${companyId}/incidents`);
  
  // Query for open incidents
  const openQuery = query(incidentsRef, where('status', '==', 'open'));
  const openSnapshot = await getCountFromServer(openQuery);
  
  // Query for in-progress incidents
  const inProgressQuery = query(incidentsRef, where('status', '==', 'inProgress'));
  const inProgressSnapshot = await getCountFromServer(inProgressQuery);
  
  // Query for resolved incidents
  const resolvedQuery = query(incidentsRef, where('status', '==', 'resolved'));
  const resolvedSnapshot = await getCountFromServer(resolvedQuery);
  
  return {
    open: openSnapshot.data().count,
    inProgress: inProgressSnapshot.data().count,
    resolved: resolvedSnapshot.data().count
  };
};

const calculateEntriesByHour = (records: VehicleRecord[]): Array<{ hour: number, count: number }> => {
  // Initialize array with 24 hours
  const hourCounts = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  
  // Count entries for each hour
  records.forEach(record => {
    if (record.entryType === 'entry') {
      const hour = record.createdAt.getHours();
      hourCounts[hour].count += 1;
    }
  });
  
  return hourCounts;
};

const calculateEntryExitTrend = async (
  companyId: string = DEFAULT_COMPANY_ID
): Promise<Array<{ date: string, entries: number, exits: number }>> => {
  // Get data for last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  const records = await getVehicleRecordsForTimeRange(sevenDaysAgo, now, companyId);
  
  // Initialize array with 7 days
  const result: Array<{ date: string, entries: number, exits: number }> = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    result.unshift({
      date: dateStr,
      entries: 0,
      exits: 0
    });
  }
  
  // Count entries and exits for each day
  records.forEach(record => {
    const dateStr = record.createdAt.toISOString().split('T')[0];
    const dayData = result.find(item => item.date === dateStr);
    
    if (dayData) {
      if (record.entryType === 'entry') {
        dayData.entries += 1;
      } else if (record.entryType === 'exit') {
        dayData.exits += 1;
      }
    }
  });
  
  return result;
};

const calculateTopVisitors = (records: VehicleRecord[]): Array<{ name: string, count: number }> => {
  // Count occurrences of each visitor
  const visitorCounts: Record<string, number> = {};
  records.forEach(record => {
    if (!visitorCounts[record.driverName]) {
      visitorCounts[record.driverName] = 0;
    }
    visitorCounts[record.driverName] += 1;
  });
  
  // Convert to array and sort
  const visitors = Object.entries(visitorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Get top 5
  
  return visitors;
};

const calculateVisitsByBlock = (records: VehicleRecord[]): Record<string, number> => {
  // Count occurrences for each block
  const blockCounts: Record<string, number> = {};
  records.forEach(record => {
    if (!blockCounts[record.houseBlock]) {
      blockCounts[record.houseBlock] = 0;
    }
    blockCounts[record.houseBlock] += 1;
  });
  
  return blockCounts;
};

// Generar datos de demostración para propósitos de visualización
export const generateMockDashboardData = (): DashboardMetrics => {
  return {
    totalEntries: 250,
    totalExits: 220,
    totalVisitors: {
      today: 35,
      week: 178,
      month: 642
    },
    averageStayTime: 45, // 45 minutos
    visitsByBlock: {
      A: 145,
      B: 98,
      C: 210,
      D: 120,
      E: 69
    },
    incidentStats: {
      open: 5,
      inProgress: 3,
      resolved: 12
    },
    topVisitors: [
      { name: "Juan Pérez", count: 15 },
      { name: "María Gómez", count: 12 },
      { name: "Carlos López", count: 10 },
      { name: "Ana Martínez", count: 8 },
      { name: "David Rodríguez", count: 7 }
    ],
    entriesByHour: [
      { hour: 0, count: 2 },
      { hour: 1, count: 1 },
      { hour: 2, count: 0 },
      { hour: 3, count: 0 },
      { hour: 4, count: 0 },
      { hour: 5, count: 0 },
      { hour: 6, count: 3 },
      { hour: 7, count: 5 },
      { hour: 8, count: 12 },
      { hour: 9, count: 8 },
      { hour: 10, count: 7 },
      { hour: 11, count: 6 },
      { hour: 12, count: 9 },
      { hour: 13, count: 11 },
      { hour: 14, count: 8 },
      { hour: 15, count: 7 },
      { hour: 16, count: 10 },
      { hour: 17, count: 15 },
      { hour: 18, count: 14 },
      { hour: 19, count: 12 },
      { hour: 20, count: 9 },
      { hour: 21, count: 6 },
      { hour: 22, count: 4 },
      { hour: 23, count: 3 }
    ],
    entryExitTrend: [
      { date: "2025-03-18", entries: 32, exits: 30 },
      { date: "2025-03-19", entries: 35, exits: 33 },
      { date: "2025-03-20", entries: 38, exits: 36 },
      { date: "2025-03-21", entries: 42, exits: 40 },
      { date: "2025-03-22", entries: 28, exits: 27 },
      { date: "2025-03-23", entries: 30, exits: 28 },
      { date: "2025-03-24", entries: 45, exits: 40 }
    ]
  };
};
