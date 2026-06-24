import api from './api';

export const managerService = {
  getDashboardStats: async () => {
    const response = await api.get('/manager/dashboard-stats');
    return response.data.data;
  },
  getSites: async () => {
    const response = await api.get('/manager/sites');
    return response.data.data;
  },
  createStaff: async (staffData) => {
    const response = await api.post('/manager/staff', staffData);
    return response.data;
  },
  getTeam: async (params) => {
    const response = await api.get('/manager/team', { params });
    return response.data.data || response.data;
  },
  getTeamMemberById: async (staffId) => {
    const response = await api.get(`/manager/team/${staffId}`);
    return response.data.data || response.data;
  },
  getAllStaff: async () => {
    const response = await api.get('/manager/staff/all');
    return response.data.data || response.data;
  },
  updateStaffStatus: async (staffId, status) => {
    const response = await api.put(`/manager/staff/${staffId}/status`, { status });
    return response.data;
  },
  updateTeamMember: async (staffId, data) => {
    const response = await api.put(`/manager/team/${staffId}`, data);
    return response.data;
  },
  assignSitesToTeamStaff: async (staffId, siteIds) => {
    const response = await api.put(`/manager/team/${staffId}/sites`, { siteIds });
    return response.data;
  },
  deleteTeamMember: async (staffId) => {
    const response = await api.delete(`/manager/team/${staffId}`);
    return response.data;
  },


  getTeamReports: async () => {
    const response = await api.get('/manager/reports/team');
    return response.data.data || response.data;
  },
  assignSiteToManager: async (siteId, managerId) => {
    const response = await api.put(`/manager/sites/${siteId}/manager`, { managerId });
    return response.data;
  },
}