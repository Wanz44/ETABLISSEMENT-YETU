import { dbLocal } from './db';

/**
 * DataService: Provides a unified API for Local (IndexedDB) storage.
 */
export const DataService = {
  /**
   * Add a document to local storage
   */
  async add(path: string, data: any) {
    try {
      // Remove undefined or null id to let Dexie generate it if needed for tables with auto-increment
      if (data && (data.id === undefined || data.id === null)) {
        delete data.id;
      }
      const localId = await (dbLocal as any)[path].add(data);
      return localId;
    } catch (error) {
      console.error(`Error adding to ${path}:`, error);
      throw error;
    }
  },

  /**
   * Update a document in local storage
   */
  async update(path: string, id: any, data: Partial<any>) {
    try {
      await (dbLocal as any)[path].update(id, data);
    } catch (error) {
      console.error(`Error updating ${path}/${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a document from local storage
   */
  async delete(path: string, id: any) {
    try {
      await (dbLocal as any)[path].delete(id);
    } catch (error) {
      console.error(`Error deleting ${path}/${id}:`, error);
      throw error;
    }
  },

  /**
   * Add multiple documents to local storage
   */
  async bulkPut(path: string, items: any[]) {
    try {
      const cleanItems = items.map(item => {
        const clean = { ...item };
        if (clean.id === undefined || clean.id === null) {
          delete clean.id;
        }
        return clean;
      });
      return await (dbLocal as any)[path].bulkPut(cleanItems);
    } catch (error) {
      console.error(`Error bulk putting to ${path}:`, error);
      throw error;
    }
  },

  /**
   * Fetch all documents from local storage
   */
  async getAll<T>(path: string): Promise<T[]> {
    try {
      const localData = await (dbLocal as any)[path].toArray();
      return localData as T[];
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      return [];
    }
  }
};
