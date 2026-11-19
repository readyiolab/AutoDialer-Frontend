import api from './axios';

export const getCallHistory = (params) =>
  api.get('/calls/history', { params });

export const getLiveActivity = () =>
  api.get('/calls/live');

export const recordCall = (data) =>
  api.post('/calls', data);

export const submitDisposition = (callId, data) =>
  api.post(`/calls/${callId}/disposition`, data);
