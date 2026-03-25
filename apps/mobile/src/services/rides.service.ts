import { api } from './api';
import type { Ride, RideSearchResult } from '@poolify/shared';

export const ridesService = {
  async getMyRides(): Promise<Ride[]> {
    const { data } = await api.get<Ride[]>('/rides');
    return data;
  },

  async getRide(id: string): Promise<Ride> {
    const { data } = await api.get<Ride>(`/rides/${id}`);
    return data;
  },

  async createRide(payload: unknown): Promise<Ride> {
    const { data } = await api.post<Ride>('/rides', payload);
    return data;
  },

  async updateRide(id: string, payload: unknown): Promise<Ride> {
    const { data } = await api.patch<Ride>(`/rides/${id}`, payload);
    return data;
  },

  async deleteRide(id: string): Promise<void> {
    await api.delete(`/rides/${id}`);
  },

  async search(params: {
    originLng: number;
    originLat: number;
    destLng: number;
    destLat: number;
    date: string;
    time: string;
    timeWindowMins?: number;
    seats?: number;
    genderPref?: string;
  }): Promise<RideSearchResult[]> {
    const { data } = await api.get<RideSearchResult[]>('/rides/search', { params });
    return data;
  },
};
