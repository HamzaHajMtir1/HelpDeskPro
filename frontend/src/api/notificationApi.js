import axios from 'axios';

const api = axios.create({
  baseURL: 'https://helpdesk.4D-gile.com/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// CORRIGÉ : suppression du /api/ en double
export const getNotifications = () => api.get('/notifications');
export const getUnreadCount   = () => api.get('/notifications/count');
export const markAsRead       = (id) => api.put(`/notifications/${id}/lu`);
export const markAllAsRead    = () => api.put('/notifications/toutes-lues');
