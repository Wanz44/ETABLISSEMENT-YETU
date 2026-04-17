import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
  currency: 'USD' | 'CDF';
  setCurrency: (currency: 'USD' | 'CDF') => void;
  lastSync: number | null;
  setLastSync: (time: number) => void;
  useLocalStorageOnly: boolean;
  toggleLocalStorageOnly: () => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currency: 'USD',
      setCurrency: (currency) => set({ currency }),
      lastSync: null,
      setLastSync: (lastSync) => set({ lastSync }),
      useLocalStorageOnly: false,
      toggleLocalStorageOnly: () => set((state) => ({ useLocalStorageOnly: !state.useLocalStorageOnly })),
      isSidebarCollapsed: false,
      setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
    }),
    {
      name: 'yetu-app-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
