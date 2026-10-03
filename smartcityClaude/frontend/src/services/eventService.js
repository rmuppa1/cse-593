import api from './api';

export const getEvents = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return api.get('/events', { params: clean }).then((r) => r.data);
};
export const createEvent = (data) => api.post('/events', data).then((r) => r.data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data).then((r) => r.data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);
export const toggleRsvp = (id) => api.post(`/events/${id}/rsvp`).then((r) => r.data);
export const flagEvent = (id, reason) => api.post(`/events/${id}/flag`, { reason }).then((r) => r.data);
export const getFlags = () => api.get('/events/flags').then((r) => r.data);
export const reviewFlag = (id, decision) => api.patch(`/events/flags/${id}/review`, { decision }).then((r) => r.data);
export const setEventBlocked = (id, blocked) => api.patch(`/events/${id}/block`, { blocked }).then((r) => r.data);
