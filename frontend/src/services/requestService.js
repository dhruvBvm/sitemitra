import api from './api';

export const requestService = {
  getAllRequests: async (params = {}) => {
    const authStorage = localStorage.getItem('auth-storage');
    let role = 'owner';
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        if (parsed?.state?.user?.role) role = parsed.state.user.role;
      } catch (e) {}
    }
    const url = role === 'manager' ? '/manager/requests' : (role === 'staff' ? '/staff/requests' : '/requests');
    const response = await api.get(url, { params });
    // Return the array of requests directly
    return response.data?.data || [];
  },

  getRequestById: async (id) => {
    const authStorage = localStorage.getItem('auth-storage');
    let role = 'owner';
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        if (parsed?.state?.user?.role) role = parsed.state.user.role;
      } catch (e) {}
    }
    let url = `/requests/${id}`;
    if (role === 'manager') url = `/manager/requests/${id}`;
    if (role === 'staff') url = `/staff/requests/${id}`;
    
    const response = await api.get(url);
    return response.data?.data || response.data;
  },

  approveRequest: async (id, data) => {
    const authStorage = localStorage.getItem('auth-storage');
    let role = 'owner';
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        if (parsed?.state?.user?.role) role = parsed.state.user.role;
      } catch (e) {}
    }
    const url = role === 'manager' ? `/manager/requests/${id}/approve` : `/requests/${id}/approve`;
    const response = await api.put(url, data);
    return response.data;
  },

  rejectRequest: async (id, data) => {
    const authStorage = localStorage.getItem('auth-storage');
    let role = 'owner';
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        if (parsed?.state?.user?.role) role = parsed.state.user.role;
      } catch (e) {}
    }
    const url = role === 'manager' ? `/manager/requests/${id}/reject` : `/requests/${id}/reject`;
    const response = await api.put(url, data);
    return response.data;
  }
};
