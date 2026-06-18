import api from './api';

export const notificationService = {
  getNotifications: async (unreadOnly = false) => {
    const response = await api.get('/notifications', { params: { unreadOnly } });
    return response.data.data || response.data;
  },
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};
