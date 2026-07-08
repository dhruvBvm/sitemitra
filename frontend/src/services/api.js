import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly cookies
});

api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not intercept 401s from the login or refresh endpoints
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        // Call refresh endpoint using axios directly to avoid interceptors
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
        
        const newAccessToken = response.data.accessToken;
        useAuthStore.setState({
          accessToken: newAccessToken,
          user: response.data.user
        });
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed – clear auth storage to remove stale user data, then redirect
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
