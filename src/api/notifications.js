import api from './axios';

export const getNotifications = (params) => api.get('/notifications', { params });
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post('/notifications/read-all');
