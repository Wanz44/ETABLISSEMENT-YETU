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
  startDate: string;
  endDate: string;
  rentAmount: number;
  currency: Currency;
  chargesIncluded: boolean;
  status: 'active' | 'expired' | 'terminated';
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
