import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { loginId: email, password });
    return response.data;
  },
  bookmarkSite: async (siteId) => {
    const response = await api.put('/users/bookmark', { siteId });
    return response.data;
  },
  getBookmarkedSite: async () => {
    const response = await api.get('/users/bookmark');
    return response.data;
  }
};
