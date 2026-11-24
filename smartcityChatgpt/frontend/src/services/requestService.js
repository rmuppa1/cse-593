import api from './api.js';
export const getRequests = async (params) => (await api.get('/requests', { params })).data.serviceRequests;
export const createRequest = async (data) => (await api.post('/requests', data)).data.serviceRequest;
export const updateRequest = async (id, data) => (await api.patch(`/requests/${id}`, data)).data.serviceRequest;
export const getManagers = async () => (await api.get('/requests/managers')).data.managers;
export const getDashboard = async () => (await api.get('/dashboard')).data;

