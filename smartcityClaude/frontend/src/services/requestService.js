import api from './api';

export const createRequest = (data) => api.post('/requests', data).then((r) => r.data);
export const getRequests = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return api.get('/requests', { params: clean }).then((r) => r.data);
};
export const getStats = () => api.get('/requests/stats').then((r) => r.data);
export const assignRequest = (id, data) => api.patch(`/requests/${id}/assign`, data).then((r) => r.data);
export const assignByName = (id, assigneeName) => assignRequest(id, { assigneeName });
export const updateStatus = (id, status, managerNote) =>
  api.patch(`/requests/${id}/status`, { status, managerNote }).then((r) => r.data);
