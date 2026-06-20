import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ItemPriceConfig } from '../types';

interface AppState {
  currentUser: string | null;
  hotelId: string | null;
  prices: Record<string, ItemPriceConfig>;
  setCurrentUser: (user: string | null) => void;
  setHotelId: (id: string | null) => void;
  setPrices: (prices: Record<string, ItemPriceConfig>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      hotelId: null,
      prices: {},
      setCurrentUser: (user) => set({ currentUser: user }),
      setHotelId: (id) => set({ hotelId: id }),
      setPrices: (prices) => set({ prices }),
    }),
    {
      name: 'ciclo-app-storage',
      partialize: (state) => ({ prices: state.prices }),
    }
  )
);
