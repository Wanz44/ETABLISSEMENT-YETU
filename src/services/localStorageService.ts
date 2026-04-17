import { dbLocal } from '../lib/db';
import { saveAs } from 'file-saver';

export const LocalStorageService = {
  async exportBackup() {
    try {
      const backup: any = {};
      const tables = ['centers', 'buildings', 'units', 'tenants', 'contracts', 'invoices', 'payments', 'expenses'];
      
      for (const table of tables) {
        backup[table] = await (dbLocal as any)[table].toArray();
      }
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      return blob;
    } catch (error) {
      console.error('Backup export failed:', error);
      throw error;
    }
  },

  async importBackup(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      const tables = ['centers', 'buildings', 'units', 'tenants', 'contracts', 'invoices', 'payments', 'expenses'];
      
      await dbLocal.transaction('rw', dbLocal.tables, async () => {
        for (const table of tables) {
          if (data[table]) {
            await (dbLocal as any)[table].clear();
            await (dbLocal as any)[table].bulkAdd(data[table]);
          }
        }
      });
    } catch (error) {
      console.error('Backup import failed:', error);
      throw error;
    }
  },

  async wipeDatabase() {
    const tables = ['centers', 'buildings', 'units', 'tenants', 'contracts', 'invoices', 'payments', 'expenses'];
    await dbLocal.transaction('rw', dbLocal.tables, async () => {
      for (const table of tables) {
        await (dbLocal as any)[table].clear();
      }
    });
  }
};
