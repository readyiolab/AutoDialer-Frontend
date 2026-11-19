import api from './axios';

export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const setUserStatus = (id, status) => api.post(`/users/${id}/status`, { status });
export const resendInvitation = (id) => api.post(`/users/${id}/resend-invitation`);
export const resetPassword = (id, newPassword) =>
  api.post(`/users/${id}/reset-password`, { newPassword });
export const getOnlineUsers = () => api.get('/users/online');
export const getUserPerformance = (id, params) =>
  api.get(`/users/${id}/performance`, { params });
