import api from './axios';

export const getCampaigns = (params) =>
  api.get('/campaigns', { params });

export const getCampaign = (id) =>
  api.get(`/campaigns/${id}`);

export const createCampaign = (data) =>
  api.post('/campaigns', data);

export const updateCampaign = (id, data) =>
  api.patch(`/campaigns/${id}`, data);

export const assignUsers = (id, userIds) =>
  api.post(`/campaigns/${id}/assign-users`, { userIds });

export const removeUsers = (id, userIds) =>
  api.post(`/campaigns/${id}/remove-users`, { userIds });

export const replaceUsers = (id, userIds) =>
  api.post(`/campaigns/${id}/replace-users`, { userIds });

export const getCampaignStats = (id) =>
  api.get(`/campaigns/${id}/stats`);

export const pauseCampaign = (id) =>
  api.patch(`/campaigns/${id}/pause`);

export const resumeCampaign = (id) =>
  api.patch(`/campaigns/${id}/resume`);
