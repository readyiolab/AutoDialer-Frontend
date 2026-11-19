import api from './axios';

export const getTemplates = (type, params) =>
  api.get(`/communication/templates/${type}`, { params });

export const createTemplate = (data) =>
  api.post('/communication/templates', data);

export const updateTemplate = (id, data) =>
  api.put(`/communication/templates/${id}`, data);

export const sendMessage = (data) =>
  api.post('/communication/send', data);

export const getHistory = (params) =>
  api.get('/communication/history', { params });
