import api from './axios';

export const getTemplates = (type) =>
  api.get('/communication/templates', { params: type ? { type } : undefined });

export const createTemplate = (data) =>
  api.post('/communication/templates', data);

export const updateTemplate = (id, data) =>
  api.patch(`/communication/templates/${id}`, data);

export const sendMessage = (data) =>
  api.post('/communication/send', data);

export const getHistory = (params) =>
  api.get('/communication/history', { params });
