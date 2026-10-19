export type DriverCategory = 'management' | 'production';

export interface Driver {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  nationalId?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  defaultCategory: DriverCategory;
  status: 'active' | 'inactive';
  joinedDate?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DriverPayoutTransaction {
  id: string;
  driverId: string;
  driverName: string;
  weekPeriod: string; // e.g. '2026-10-12'
  date: string;
  amount: number;
  category: DriverCategory;
  description?: string | null;
  vehiclePlate?: string | null;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod: 'cash' | 'transfer' | 'cheque';
  receiptNumber?: string | null;
  orderIndex: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface WeeklyPayoutSummary {
  weekPeriod: string;
  weekLabel: string;
  date: string;
  totalDrivers: number;
  totalAmount: number;
  totalOperations: number;
  averagePayout: number;
  managementTotal: number;
  productionTotal: number;
  status: 'open' | 'locked';
  lockedAt?: Date | string | null;
  lockedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface DriverWeeklyColumn {
  driver: Driver;
  transactions: DriverPayoutTransaction[];
  totalAmount: number;
  operationsCount: number;
  managementAmount: number;
  productionAmount: number;
}
