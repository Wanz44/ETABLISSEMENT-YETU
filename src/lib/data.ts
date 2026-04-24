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
  async bulkAdd(path: string, items: any[]) {
    try {
      return await (dbLocal as any)[path].bulkAdd(items);
    } catch (error) {
      console.error(`Error bulk adding to ${path}:`, error);
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
