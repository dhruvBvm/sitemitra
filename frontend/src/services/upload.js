import api from './api';

export const uploadMaterialImages = async (formData) => {
  const response = await api.post('/uploads/material-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
