import api from './api';

export const getAllEvents = (filters = {}) => {
  return api.get('/events', { params: filters });
};

export const getEventById = (id) => {
  return api.get(`/events/${id}`);
};

export const createEvent = (data) => {
  return api.post('/events', data);
};

export const updateEvent = (id, data) => {
  return api.put(`/events/${id}`, data);
};

export const deleteEvent = (id) => {
  return api.delete(`/events/${id}`);
};

export const registerForEvent = (id) => {
  return api.post(`/events/${id}/register`);
};

export const getCategories = () => {
  return api.get('/events/categories');
};

export default {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getCategories,
};
