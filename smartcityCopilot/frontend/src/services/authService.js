import api from './api';

function register(userData) {
  return api.post('/auth/register', userData).then((res) => res.data);
}

function login(email, password) {
  return api.post('/auth/login', { email, password }).then((res) => res.data);
}

function getMe() {
  return api.get('/auth/me').then((res) => res.data);
}

function changePassword(currentPassword, newPassword) {
  return api.post('/auth/change-password', { currentPassword, newPassword }).then((res) => res.data);
}

function getPendingUsers() {
  return api.get('/auth/pending-users').then((res) => res.data);
}

function approveUser(id) {
  return api.put(`/auth/approve/${id}`).then((res) => res.data);
}

function rejectUser(id) {
  return api.put(`/auth/reject/${id}`).then((res) => res.data);
}

export default { register, login, getMe, changePassword, getPendingUsers, approveUser, rejectUser };
