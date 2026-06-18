import api from './api';

export const inventoryService = {
  // Get sites with inventory (filtered by role)
  getSitesInventory: async () => {
    const response = await api.get('/inventory/sites');
    return response.data;
  },
  getSites: async () => {
    const response = await api.get('/inventory/sites');
    return response.data.data;
  },
  
  getSiteInventory: async (siteId) => {
    const response = await api.get(`/inventory/site/${siteId}`);
    return response.data.data;
  },
  
  getInventoryBySite: async (siteId) => {
    return await inventoryService.getSiteInventory(siteId);
  },
  
  getMaterialHistory: async (siteId, materialId) => {
    const response = await api.get(`/inventory/site/${siteId}/material/${materialId}/history`);
    return response.data.data;
  },

  // Received entries list
  getReceivedEntries: async (params = {}) => {
    const response = await api.get('/inventory/received', { params });
    // Return full response including data and pagination
    return response.data;
  },

  // Get a single received entry by ID
  getReceivedEntryById: async (entryId) => {
    const response = await api.get(`/inventory/received/${entryId}`);
    return response.data.data;
  },
  // Alias for component usage
  getReceivedEntryDetails: async (entryId) => {
    return await inventoryService.getReceivedEntryById(entryId);
  },

  // Used entries list
  getUsedEntries: async (params = {}) => {
    const response = await api.get('/inventory/used', { params });
    return response.data;
  },

  // Get a single used entry by ID
  getUsedEntryById: async (entryId) => {
    const response = await api.get(`/inventory/used/${entryId}`);
    return response.data.data;
  },
  // Alias for component usage
  getUsedEntryDetails: async (entryId) => {
    return await inventoryService.getUsedEntryById(entryId);
  },
  
  createReceivedEntry: async (data) => {
    const response = await api.post('/inventory/received', data);
    return response.data.data;
  },
  // Create a used entry (consumption)
  createUsedEntry: async (data) => {
    const response = await api.post('/inventory/used', data);
    return response.data.data;
  },
    getStock: async (siteId, materialId) => {
    const response = await api.get('/inventory/stock', { params: { siteId, materialId } });
    return response.data;
  },
};
