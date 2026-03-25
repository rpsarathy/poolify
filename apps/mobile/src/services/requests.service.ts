import { api } from './api';
import type { RideRequest } from '@poolify/shared';

export const requestsService = {
  async create(payload: unknown): Promise<RideRequest> {
    const { data } = await api.post<RideRequest>('/requests', payload);
    return data;
  },

  async getIncoming(): Promise<RideRequest[]> {
    const { data } = await api.get<RideRequest[]>('/requests/incoming');
    return data;
  },

  async getOutgoing(): Promise<RideRequest[]> {
    const { data } = await api.get<RideRequest[]>('/requests/outgoing');
    return data;
  },

  async getRequest(id: string): Promise<RideRequest> {
    const { data } = await api.get<RideRequest>(`/requests/${id}`);
    return data;
  },

  async approve(id: string): Promise<RideRequest> {
    const { data } = await api.patch<RideRequest>(`/requests/${id}/approve`);
    return data;
  },

  async reject(id: string): Promise<RideRequest> {
    const { data } = await api.patch<RideRequest>(`/requests/${id}/reject`);
    return data;
  },

  async cancel(id: string): Promise<RideRequest> {
    const { data } = await api.patch<RideRequest>(`/requests/${id}/cancel`);
    return data;
  },
};
