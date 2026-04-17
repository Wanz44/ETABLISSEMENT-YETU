import Dexie, { type Table } from 'dexie';
import { Center, Building, Unit, Tenant, Contract, Invoice, Payment, Expense, MaintenanceTicket, AppNotification } from '../types';

export class AppDatabase extends Dexie {
  centers!: Table<Center>;
  buildings!: Table<Building>;
  units!: Table<Unit>;
  tenants!: Table<Tenant>;
  contracts!: Table<Contract>;
  invoices!: Table<Invoice>;
  payments!: Table<Payment>;
  expenses!: Table<Expense>;
  maintenance!: Table<MaintenanceTicket>;
  notifications!: Table<AppNotification>;

  constructor() {
    super('YetuLocalDB');
    this.version(4).stores({
      centers: '++id, name, location',
      buildings: '++id, centerId, name',
      units: '++id, buildingId, centerId, name, status',
      tenants: '++id, name, company, email',
      contracts: '++id, tenantId, unitId, centerId, status',
      invoices: '++id, contractId, tenantId, month, year, status',
      payments: '++id, invoiceId, tenantId, date, serialNumber',
      expenses: '++id, category, centerId, date',
      maintenance: '++id, unitId, centerId, status, priority',
      notifications: '++id, type, date, read'
    });
  }
}

export const dbLocal = new AppDatabase();
