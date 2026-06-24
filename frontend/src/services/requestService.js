import api from './api';
import { useAuthStore } from '../store/authStore';

export const requestService = {
  getAllRequests: async (params = {}) => {
    const role = useAuthStore.getState().user?.role || 'owner';
    const url = role === 'manager' ? '/manager/requests' : (role === 'staff' ? '/staff/requests' : '/requests');
    const response = await api.get(url, { params });
    // Return the array of requests directly
    return response.data?.data || [];
  },

  getRequestById: async (id) => {
    const role = useAuthStore.getState().user?.role || 'owner';
    let url = `/requests/${id}`;
    if (role === 'manager') url = `/manager/requests/${id}`;
    if (role === 'staff') url = `/staff/requests/${id}`;
    
    const response = await api.get(url);
    return response.data?.data || response.data;
  },

  approveRequest: async (id, data) => {
    const role = useAuthStore.getState().user?.role || 'owner';
    const url = role === 'manager' ? `/manager/requests/${id}/approve` : `/requests/${id}/approve`;
    const response = await api.put(url, data);
    return response.data;
  },

  rejectRequest: async (id, data) => {
    const role = useAuthStore.getState().user?.role || 'owner';
    const url = role === 'manager' ? `/manager/requests/${id}/reject` : `/requests/${id}/reject`;
    const response = await api.put(url, data);
    return response.data;
  }
};
