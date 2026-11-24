import api from './api.js';
export const getEvents = async (params) => (await api.get('/events', { params })).data.events;
export const createEvent = async (data) => (await api.post('/events', data)).data.event;
export const updateEvent = async (id, data) => (await api.patch(`/events/${id}`, data)).data.event;
export const deleteEvent = (id) => api.delete(`/events/${id}`);
export const registerForEvent = (id) => api.post(`/events/${id}/register`);

