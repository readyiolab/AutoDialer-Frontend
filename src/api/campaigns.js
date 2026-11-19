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

export const listCampaignRounds = (campaignId) =>
  api.get(`/campaigns/${campaignId}/rounds`);

export const getCampaignRound = (campaignId, roundId) =>
  api.get(`/campaigns/${campaignId}/rounds/${roundId}`);

export const getCampaignRoundAnalytics = (campaignId, roundId) =>
  api.get(`/campaigns/${campaignId}/rounds/${roundId}/analytics`);

export const previewNextRound = (campaignId, data) =>
  api.post(`/campaigns/${campaignId}/rounds/preview`, data);

export const createNextRound = (campaignId, data) =>
  api.post(`/campaigns/${campaignId}/rounds`, data);

export const allocateRound = (campaignId, roundId, data) =>
  api.post(`/campaigns/${campaignId}/rounds/${roundId}/allocate`, data);

export const completeRound = (campaignId, roundId) =>
  api.post(`/campaigns/${campaignId}/rounds/${roundId}/complete`);
