import Dexie, { type Table } from 'dexie';
import { Center, Building, Unit, Tenant, Contract, Invoice, Payment, Expense, MaintenanceTicket, AppNotification, AppSettings } from '../types';

import { cryptoUtils } from './crypto';

const SENSITIVE_FIELDS = ['email', 'phone', 'additionalInfo'];

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
  settings!: Table<AppSettings>;

  constructor() {
    super('YetuLocalDB');
    this.version(5).stores({
      centers: '++id, name, location',
      buildings: '++id, centerId, name',
      units: '++id, buildingId, centerId, name, status',
      tenants: '++id, name, company, email',
      contracts: '++id, tenantId, unitId, centerId, status',
      invoices: '++id, contractId, tenantId, month, year, status',
      payments: '++id, invoiceId, tenantId, date, serialNumber',
      expenses: '++id, category, centerId, date',
      maintenance: '++id, unitId, centerId, status, priority',
      notifications: '++id, type, date, read',
      settings: 'id'
    });

    // Add hooks for encryption/decryption
    this.tenants.hook('creating', (primaryKey, obj) => {
      const encrypted = { ...obj };
      SENSITIVE_FIELDS.forEach(f => {
        if (encrypted[f]) encrypted[f] = cryptoUtils.encrypt(encrypted[f]);
      });
      return encrypted;
    });

    this.tenants.hook('updating', (mods, primaryKey, obj) => {
      const encryptedMods = { ...mods };
      SENSITIVE_FIELDS.forEach(f => {
        if (encryptedMods[f]) encryptedMods[f] = cryptoUtils.encrypt(encryptedMods[f]);
      });
      return encryptedMods;
    });

    this.tenants.hook('reading', (obj) => {
      const decrypted = { ...obj };
      SENSITIVE_FIELDS.forEach(f => {
        if (decrypted[f]) decrypted[f] = cryptoUtils.decrypt(decrypted[f]);
      });
      return decrypted;
    });
  }
}

export const dbLocal = new AppDatabase();
