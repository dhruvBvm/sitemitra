import api from './api';

export const staffService = {
  getSites: async () => {
    const response = await api.get('/staff/sites');
    return response.data.data || response.data;
  },
  getSiteDetails: async (siteId) => {
    const response = await api.get(`/staff/sites/${siteId}`);
    return response.data.data || response.data;
  },
  getAvailableMaterials: async () => {
    // Try staff materials endpoint if available, otherwise just use /staff/materials based on backend
    const response = await api.get('/staff/materials');
    return response.data.data || response.data;
  },
  createManualOrder: async (orderData) => {
    const response = await api.post('/staff/requests/manual', orderData);
    return response.data;
  },
  createPhotoOrder: async (formData) => {
    // Ensure multipart/form-data header is set so files are sent correctly.
    const response = await api.post('/staff/requests/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  getMyOrders: async (params) => {
    const response = await api.get('/staff/requests', { params });
    return response.data.data || response.data;
  },
  getRequestById: async (requestId) => {
    const response = await api.get(`/staff/requests/${requestId}`);
    return response.data.data || response.data;
  }
};
