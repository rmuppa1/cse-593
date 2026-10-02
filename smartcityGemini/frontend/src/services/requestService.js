import api from './api';

export const getAllRequests = (filters = {}) => {
  return api.get('/requests', { params: filters });
};

export const getMyRequests = () => {
  return api.get('/requests/my');
};

export const getDepartmentRequests = () => {
  return api.get('/requests/department');
};

export const getRequestById = (id) => {
  return api.get(`/requests/${id}`);
};

export const createRequest = (data) => {
  return api.post('/requests', data);
};

export const updateRequestStatus = (id, data) => {
  return api.put(`/requests/${id}/status`, data);
};

export const assignRequest = (id, data) => {
  return api.put(`/requests/${id}/assign`, data);
};

export const getRequestStats = () => {
  return api.get('/requests/stats');
};

export default {
  getAllRequests,
  getMyRequests,
  getDepartmentRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  assignRequest,
  getRequestStats,
};
