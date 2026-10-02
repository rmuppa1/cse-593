import api from './api';

function getAllRequests(filters = {}) {
  return api.get('/requests', { params: filters }).then((res) => res.data);
}

function getMyRequests() {
  return api.get('/requests/my').then((res) => res.data);
}

function getDepartmentRequests() {
  return api.get('/requests/department').then((res) => res.data);
}

function getRequestById(id) {
  return api.get(`/requests/${id}`).then((res) => res.data);
}

function createRequest(data) {
  return api.post('/requests', data).then((res) => res.data);
}

function updateRequestStatus(id, data) {
  return api.put(`/requests/${id}/status`, data).then((res) => res.data);
}

function assignRequest(id, data) {
  return api.put(`/requests/${id}/assign`, data).then((res) => res.data);
}

function getRequestStats() {
  return api.get('/requests/stats').then((res) => res.data);
}

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
