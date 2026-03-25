import { api } from './api';
import type { User } from '@poolify/shared';

export const usersService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me');
    return data;
  },

  async updateMe(payload: Partial<User>): Promise<User> {
    const { data } = await api.patch<User>('/users/me', payload);
    return data;
  },

  async completeOnboarding(payload: {
    phone: string;
    gender: string;
    role: string;
  }): Promise<{ user: User; accessToken: string }> {
    const { data } = await api.post<{ user: User; accessToken: string }>(
      '/users/me/onboarding',
      payload
    );
    return data;
  },

  async updateDriverProfile(payload: unknown): Promise<User> {
    const { data } = await api.patch<User>('/users/me/driver-profile', payload);
    return data;
  },

  async getUser(id: string): Promise<User> {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },
};
