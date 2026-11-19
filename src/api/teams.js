import api from './axios';

export const getTeams = (params) => api.get('/teams', { params });
export const createTeam = (data) => api.post('/teams', data);
export const updateTeam = (id, data) => api.put(`/teams/${id}`, data);
