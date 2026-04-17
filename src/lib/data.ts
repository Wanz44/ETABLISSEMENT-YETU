import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  QueryConstraint,
  DocumentData,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { dbLocal } from './db';
import { toast } from 'sonner';

/**
 * DataService: Provides a unified API for both Local (IndexedDB) and Cloud (Firestore) storage.
 * This ensures "Pro" performance and offline reliability.
 */
export const DataService = {
  /**
   * Add a document to both local and cloud storage
   */
  async add<T extends DocumentData>(path: string, data: any) {
    try {
      // 1. Save to Local DB (Instant)
      // We don't provide an ID, so Dexie provides one (auto-increment if version 1)
      const localId = await (dbLocal as any)[path].add(data);
      
      // 2. Attempt Cloud Save (Background)
      try {
        const docRef = await addDoc(collection(db, path), { ...data, localId: String(localId) });
        
        // 3. IMPORTANT: Update local document with the Cloud ID 
        // This ensures subsequent updates/deletes in this session can hit the cloud
        await (dbLocal as any)[path].update(localId, { id: docRef.id });
      } catch (cloudError) {
        console.warn('Cloud sync failed, stored locally only:', cloudError);
      }
      
      return localId;
    } catch (error) {
      console.error(`Error adding to ${path}:`, error);
      throw error;
    }
  },

  /**
   * Update a document in both local and cloud storage
   */
  async update<T extends DocumentData>(path: string, id: any, data: Partial<T>) {
    try {
      // 1. Update Local
      await (dbLocal as any)[path].update(id, data);
      
      // 2. Update Cloud (if id is a string, likely firestore ID)
      if (typeof id === 'string' && id.length > 5) {
        try {
          const docRef = doc(db, path, id);
          await updateDoc(docRef, data as any);
        } catch (cloudError) {
          console.warn('Cloud update failed:', cloudError);
        }
      }
    } catch (error) {
      console.error(`Error updating ${path}/${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a document from both
   */
  async delete(path: string, id: any) {
    try {
      await (dbLocal as any)[path].delete(id);
      
      if (typeof id === 'string' && id.length > 5) {
        try {
          const docRef = doc(db, path, id);
          await deleteDoc(docRef);
        } catch (cloudError) {
          console.warn('Cloud delete failed:', cloudError);
        }
      }
    } catch (error) {
      console.error(`Error deleting ${path}/${id}:`, error);
      throw error;
    }
  },

  /**
   * Comprehensive fetch that populates local DB from Cloud if empty
   */
  async getAll<T>(path: string): Promise<T[]> {
    try {
      const localData = await (dbLocal as any)[path].toArray();
      
      // If local is empty, try to fetch from cloud once
      if (localData.length === 0) {
        try {
          const q = query(collection(db, path));
          const querySnapshot = await getDocs(q);
          const cloudData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          if (cloudData.length > 0) {
            await (dbLocal as any)[path].bulkAdd(cloudData);
            return cloudData as T[];
          }
        } catch (cloudError) {
          console.warn('Cloud fetch failed:', cloudError);
        }
      }
      
      return localData as T[];
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      return [];
    }
  }
};
