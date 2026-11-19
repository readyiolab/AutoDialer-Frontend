import api from './axios';

export const getFollowUps = (params) =>
  api.get('/followups', { params });

export const createFollowUp = (data) =>
  api.post('/followups', data);

export const updateFollowUp = (id, data) =>
  api.put(`/followups/${id}`, data);

export const reassignFollowUp = (id, userId) =>
  api.post(`/followups/${id}/reassign`, { userId });

export const escalateFollowUp = (id) =>
  api.post(`/followups/${id}/escalate`);
