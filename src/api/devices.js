import api from './axios';

export const listDevices = (params) => api.get('/admin/devices', { params });
export const getDevice = (id) => api.get(`/admin/devices/${id}`);
export const getDeviceHistory = (id) => api.get(`/admin/devices/${id}/history`);
export const blockDevice = (id) => api.post(`/admin/devices/${id}/block`);
export const revokeDevice = (id) => api.post(`/admin/devices/${id}/revoke`);
export const resetDevice = (id) => api.post(`/admin/devices/${id}/reset`);
export const authorizeReplacement = (userId) =>
  api.post('/admin/devices/authorize-replacement', { userId });
export const revokeAllSessions = (userId) =>
  api.post('/auth/sessions/revoke-all', { userId });
