import api from './axios';

export const getAutomationRules = () => api.get('/automation/rules');
export const updateAutomationRule = (id, data) => api.patch(`/automation/rules/${id}`, data);
export const runAutomation = () => api.post('/automation/run');
