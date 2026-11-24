import axios from 'axios';

// Vite proxies /api to Express during local development. A deployed frontend
// can use VITE_API_URL to point to its hosted API instead.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartcity_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('smartcity_token');
    localStorage.removeItem('smartcity_user');
  }
  return Promise.reject(error);
});
export default api;

