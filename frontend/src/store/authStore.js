import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isInitializing: true,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials.email, credentials.password);
          const user = {
            _id: response._id,
            name: response.name,
            email: response.email,
            mobile: response.mobile,
            role: response.role,
            assignedSites: response.assignedSites,
            bookmarkedSiteId: response.bookmarkedSiteId,
          };
          set({ user, isLoading: false });
          return user;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (e) {
          console.error('Logout request failed', e);
        }
        set({ user: null });
        window.location.href = '/login';
      },

      // Refresh session on app load
      refreshSession: async () => {
        try {
          const response = await api.post('/auth/refresh');
          const user = {
            _id: response.data.user._id,
            name: response.data.user.name,
            email: response.data.user.email,
            mobile: response.data.user.mobile,
            role: response.data.user.role,
            assignedSites: response.data.user.assignedSites,
            bookmarkedSiteId: response.data.user.bookmarkedSiteId,
          };
          set({ user, isInitializing: false });
        } catch (error) {
          // If refresh fails, ensure user is null
          set({ user: null, isInitializing: false });
          window.location.href = '/login';
        }
      },

      updateBookmark: (siteId) => {
        set((state) => ({
          user: state.user ? { ...state.user, bookmarkedSiteId: siteId } : null
        }));
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ user: state.user }), // only persist the user object
    }
  )
);
