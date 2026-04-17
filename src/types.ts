export type UserRole = 'admin' | 'manager' | 'accountant';
export type Currency = 'USD' | 'CDF';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  preferredCurrency?: Currency;
}

export interface Center {
  id: string;
  name: string;
  location: string;
  description: string;
  createdAt: string;
}

export interface Building {
  id: string;
  centerId: string;
  name: string;
  description: string;
}

export interface Unit {
  id: string;
  buildingId: string;
  centerId: string;
  name: string;
  type: 'shop' | 'office';
  status: 'occupied' | 'free' | 'maintenance';
  floor: string;
}

export interface Tenant {
  id: string;
  name: string;
  company: string;
  manager: string;
  phone: string;
  email: string;
  activityType: string;
}

export interface Contract {
  id: string;
  tenantId: string;
  unitId: string;
  centerId: string; // Adding centerId for easier filtering
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  currency: Currency;
  chargesIncluded: boolean;
  status: 'active' | 'expired' | 'terminated';
  type: 'commercial' | 'professional' | 'residential';
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceCode: string;
  contractId: string;
  tenantId: string;
  unitId: string;
  month: number;
  year: number;
  amountRent: number;
  amountWater: number;
  amountElectricity: number;
  totalAmount: number;
  amountPaid: number;
  currency: Currency;
  status: 'paid' | 'unpaid' | 'partial';
  dueDate: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
  currency: Currency;
  date: string;
  method: 'cash' | 'mobile_money' | 'bank';
  reference: string;
  serialNumber: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  category: string;
  date: string;
  centerId?: string;
}

export interface MaintenanceTicket {
  id: string;
  unitId: string;
  centerId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  estimatedCost?: number;
  actualCost?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  date: string;
  read: boolean;
}
