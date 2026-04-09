export type UserRole = 'admin' | 'manager' | 'accountant';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
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
  startDate: string;
  endDate: string;
  rentAmount: number;
  chargesIncluded: boolean;
  status: 'active' | 'expired' | 'terminated';
}

export interface Invoice {
  id: string;
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
  status: 'paid' | 'unpaid' | 'partial';
  dueDate: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
  date: string;
  method: 'cash' | 'mobile_money' | 'bank';
  reference: string;
}
