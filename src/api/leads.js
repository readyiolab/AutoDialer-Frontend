import api from './axios';

export const getLeads = (params) => api.get('/leads', { params });
export const getLead = (id) => api.get(`/leads/${id}`);
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, data) => api.patch(`/leads/${id}`, data);

export const importExcel = (formData) =>
  api.post('/leads/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const confirmImport = (importHistoryId, columnMapping) =>
  api.post('/leads/import/confirm', { importHistoryId, columnMapping });

export const cancelImport = (id) => api.post(`/leads/import/${id}/cancel`);
export const getImportStatus = (id) => api.get(`/leads/import/${id}/status`);
export const allocateLeads = (data) => api.post('/leads/allocate', data);
export const previewAllocate = (data) => api.post('/leads/allocate/preview', data);
export const transferLeads = (data) => api.post('/leads/transfer', data);
export const getUnworkedLeads = (params) => api.get('/leads/unworked', { params });
export const getLeadAssignments = (id) => api.get(`/leads/${id}/assignments`);
export const getDuplicates = (params) => api.get('/leads/duplicates', { params });
export const getImportHistory = (params) => api.get('/leads/import-history', { params });
