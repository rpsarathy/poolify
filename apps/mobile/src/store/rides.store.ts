import { create } from 'zustand';
import type { Ride, RideSearchResult } from '@poolify/shared';

interface RidesState {
  myRides: Ride[];
  searchResults: RideSearchResult[];
  isSearching: boolean;

  setMyRides: (rides: Ride[]) => void;
  setSearchResults: (results: RideSearchResult[]) => void;
  setSearching: (loading: boolean) => void;
  removeRide: (id: string) => void;
}

export const useRidesStore = create<RidesState>((set) => ({
  myRides: [],
  searchResults: [],
  isSearching: false,

  setMyRides: (rides) => set({ myRides: rides }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSearching: (isSearching) => set({ isSearching }),
  removeRide: (id) =>
    set((state) => ({ myRides: state.myRides.filter((r) => r._id !== id) })),
}));
