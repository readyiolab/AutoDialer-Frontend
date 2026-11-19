import api from './axios';

export const startSession = (data) => api.post('/dialer/sessions', data);
export const pauseSession = (id) => api.post(`/dialer/sessions/${id}/pause`);
export const resumeSession = (id) => api.post(`/dialer/sessions/${id}/resume`);
export const endSession = (id) => api.post(`/dialer/sessions/${id}/end`);
export const dialerEvent = (id, data) => api.post(`/dialer/sessions/${id}/events`, data);
export const nextLead = (id) => api.get(`/dialer/sessions/${id}/next`);
