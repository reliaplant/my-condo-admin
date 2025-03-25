export interface Company {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  logo?: string; // URL to the logo image
}

export interface EntryRecord {
  id: string;
  companyId: string;
  visitorName: string;
  visitorId: string;
  entryTime: Date;
  exitTime?: Date;
  purpose: string;
  hostName: string;
  visitorPhoto?: string; // URL to the visitor's photo
}

export interface Incident {
  id: string;
  companyId: string;
  title: string;
  description: string;
  date: Date;
  reportedBy: string;
  status: 'open' | 'inProgress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  images: string[]; // URLs to the incident images
}

export interface VehicleRecord {
  id: string;
  companyId: string;
  driverName: string;
  entryType: 'entry' | 'exit';
  houseBlock: string;
  houseNumber: string;
  idImageUrl: string;
  idImageLocalUri?: string;
  licensePlate: string;
  plateImageUrl: string;
  plateImageLocalUri?: string;
  vehicleType: string;
  createdAt: Date;
  timestamp: Date;
  processed: boolean;
}

export interface DashboardMetrics {
  totalEntries: number;
  totalExits: number;
  totalVisitors: {
    today: number;
    week: number;
    month: number;
  };
  averageStayTime: number; // in minutes
  visitsByBlock: Record<string, number>;
  incidentStats: {
    open: number;
    inProgress: number;
    resolved: number;
  };
  topVisitors: Array<{
    name: string;
    count: number;
  }>;
  entriesByHour: Array<{
    hour: number;
    count: number;
  }>;
  entryExitTrend: Array<{
    date: string;
    entries: number;
    exits: number;
  }>;
}
