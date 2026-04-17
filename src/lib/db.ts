import Dexie, { type Table } from 'dexie';
import { Center, Building, Unit, Tenant, Contract, Invoice, Payment, Expense } from '../types';

export class AppDatabase extends Dexie {
  centers!: Table<Center>;
  buildings!: Table<Building>;
  units!: Table<Unit>;
  tenants!: Table<Tenant>;
  contracts!: Table<Contract>;
  invoices!: Table<Invoice>;
  payments!: Table<Payment>;
  expenses!: Table<Expense>;

  constructor() {
    super('YetuLocalDB');
    this.version(1).stores({
      centers: '++id, name, location',
      buildings: '++id, centerId, name',
      units: '++id, buildingId, centerId, name, status',
      tenants: '++id, name, company, email',
      contracts: '++id, tenantId, unitId, status',
      invoices: '++id, contractId, tenantId, month, year, status',
      payments: '++id, invoiceId, tenantId, date',
      expenses: '++id, category, centerId, date'
    });
  }
}

export const dbLocal = new AppDatabase();
