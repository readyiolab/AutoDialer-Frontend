import api from './axios';

export const getDashboard = () =>
  api.get('/reports/dashboard');

export const getDailyCallingMIS = (params) =>
  api.get('/reports/daily-calling', { params });

export const getEmployeeMIS = (params) =>
  api.get('/reports/employee', { params });

export const getTelecallerLeadOverview = (params) =>
  api.get('/reports/telecaller-lead-overview', { params });

export const getEmployeeLeads = (userId, params) =>
  api.get(`/reports/employees/${userId}/leads`, { params });

export const getCampaignMIS = (params) =>
  api.get('/reports/campaign', { params });

export const getCampaignRoundsComparison = (campaignId) =>
  api.get(`/reports/campaign/${campaignId}/rounds`);

export const getFollowUpMIS = (params) =>
  api.get('/reports/followup', { params });

export const getCommunicationMIS = (params) =>
  api.get('/reports/communication', { params });

export const exportReport = (type, params) =>
  api.get(`/reports/export/${type}`, { params, responseType: 'blob' });
