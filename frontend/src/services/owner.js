import api from './api';
// Updated owner service endpoints
export const ownerService = {
  // Users
  getUsers: async (params) => {
    const response = await api.get('/owner/users', { params });
    return response.data.data || response.data;
  },
  getUser: async (userId) => {
    const response = await api.get(`/owner/users/${userId}`);
    return response.data.data || response.data;
  },
  createManager: async (userData) => {
    const response = await api.post('/owner/users/manager', userData);
    return response.data;
  },
  createStaff: async (userData) => {
    const response = await api.post('/owner/users/staff', userData);
    return response.data;
  },
  updateUserStatus: async (userId, status) => {
    const response = await api.put(`/owner/users/${userId}/status`, { status });
    return response.data;
  },
  assignUserSites: async (userId, siteIds) => {
    const response = await api.put(`/owner/users/${userId}/sites`, { siteIds });
    return response.data;
  },
  // User CRUD
  updateUser: async (userId, data) => {
    const response = await api.put(`/owner/users/${userId}`, data);
    return response.data;
  },
  deleteUser: async (userId) => {
    const response = await api.delete(`/owner/users/${userId}`);
    return response.data;
  },

  // Sites
  getSites: async (params) => {
    const response = await api.get('/owner/sites', { params });
    return response.data.data || response.data;
  },
  createSite: async (siteData) => {
    const response = await api.post('/owner/sites', siteData);
    return response.data;
  },
  updateSite: async (siteId, siteData) => {
    const response = await api.put(`/owner/sites/${siteId}`, siteData);
    return response.data;
  },
  deleteSite: async (siteId) => {
    const response = await api.delete(`/owner/sites/${siteId}`);
    return response.data;
  },
  assignSiteManager: async (siteId, managerId) => {
    const response = await api.put(`/owner/sites/${siteId}/manager`, { managerId });
    return response.data;
  },

  // Materials
  getMaterials: async (params = {}) => {
    // Force backend to return all materials (active + inactive) so UI can group them
    const mergedParams = { status: 'all', ...params };
    const response = await api.get('/materials', { params: mergedParams });
    return response.data.data || response.data;
  },
  getMaterial: async (materialId) => {
    const response = await api.get(`/owner/materials/${materialId}`);
    return response.data.data || response.data;
  },
  createMaterial: async (materialData) => {
    const response = await api.post('/owner/materials', materialData);
    return response.data;
  },
  updateMaterial: async (materialId, materialData) => {
    const response = await api.put(`/owner/materials/${materialId}`, materialData);
    return response.data;
  },
  deleteMaterial: async (materialId) => {
    const response = await api.delete(`/owner/materials/${materialId}`);
    return response.data;
  },



  // Orders
  getOrders: async (params) => {
    const response = await api.get('/requests', { params });
    return response.data.data || response.data;
  },
  getOrder: async (orderId) => {
    const response = await api.get(`/requests/${orderId}`);
    return response.data.data || response.data;
  },
  approveOrder: async (orderId, comment) => {
    const response = await api.put(`/requests/${orderId}/approve`, { comment });
    return response.data;
  },
  rejectOrder: async (orderId, comment) => {
    const response = await api.put(`/requests/${orderId}/reject`, { comment });
    return response.data;
  },
  updateOrderStatus: async (orderId, status, comment) => {
    const response = await api.put(`/requests/${orderId}/status`, { status, comment });
    return response.data;
  },

  // Manager CRUD (owner) – use generic user endpoints
  updateManager: async (managerId, data) => {
    const response = await api.put(`/owner/users/${managerId}`, data);
    return response.data;
  },
  deleteManager: async (managerId) => {
    const response = await api.delete(`/owner/users/${managerId}`);
    return response.data;
  },


  // Deprecated report methods (features removed)
  getDashboardStats: async () => {
    const response = await api.get('/owner/reports/dashboard');
    return response.data.data || response.data;
  },
  getSiteWiseOrders: async () => {
    const response = await api.get('/owner/reports/site-wise');
    return response.data.data || response.data;
  },
  getMonthlyOrders: async (year) => {
    const response = await api.get('/owner/reports/monthly', { params: { year } });
    return response.data.data || response.data;
  },
  getStatusBreakdown: async () => {
    const response = await api.get('/owner/reports/status-breakdown');
    return response.data.data || response.data;
  },
};
