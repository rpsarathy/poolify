import { api } from './api';
import type { Notification } from '@poolify/shared';

export const notificationsService = {
  async getAll(page = 1): Promise<{ notifications: Notification[]; total: number }> {
    const { data } = await api.get<{ notifications: Notification[]; total: number }>(
      '/notifications',
      { params: { page } }
    );
    return data;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
