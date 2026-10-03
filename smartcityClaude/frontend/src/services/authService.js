import api from './api';

export const login = (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data);
export const register = (data) => api.post('/auth/register', data).then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data.user);
export const getPending = () => api.get('/auth/pending').then((r) => r.data);
export const approveUser = (id) => api.patch(`/auth/users/${id}/approve`).then((r) => r.data);
export const rejectUser = (id) => api.delete(`/auth/users/${id}/reject`);
