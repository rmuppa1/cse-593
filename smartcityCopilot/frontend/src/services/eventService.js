import api from './api';

function getAllEvents(filters = {}) {
  return api.get('/events', { params: filters }).then((res) => res.data);
}

function getEventById(id) {
  return api.get(`/events/${id}`).then((res) => res.data);
}

function createEvent(data) {
  return api.post('/events', data).then((res) => res.data);
}

function updateEvent(id, data) {
  return api.put(`/events/${id}`, data).then((res) => res.data);
}

function deleteEvent(id) {
  return api.delete(`/events/${id}`).then((res) => res.data);
}

function registerForEvent(id) {
  return api.post(`/events/${id}/register`).then((res) => res.data);
}

function getCategories() {
  return api.get('/events/categories').then((res) => res.data);
}

function flagEvent(id, reason) {
  return api.post(`/events/${id}/flag`, { reason }).then((res) => res.data);
}

function getFlags() {
  return api.get('/events/flags').then((res) => res.data);
}

function setEventBlockedStatus(id, isBlocked) {
  return api.put(`/events/${id}/block`, { isBlocked }).then((res) => res.data);
}

export default {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getCategories,
  flagEvent,
  getFlags,
  setEventBlockedStatus,
};
