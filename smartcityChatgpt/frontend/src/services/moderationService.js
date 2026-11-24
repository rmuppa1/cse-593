import api from './api.js';

export const submitFlag = async (data) => (await api.post('/flags', data)).data;
export const getFlags = async () => (await api.get('/flags')).data.flags;
export const reviewFlag = async (id, data) => (await api.patch(`/flags/${id}`, data)).data;
export const getUsers = async () => (await api.get('/admin/users')).data.users;
export const reviewUser = async (id, status) => (await api.patch(`/admin/users/${id}/approval`, { status })).data;

