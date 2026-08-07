import api from './axios';
 
export const changePassword = (data) => api.post('/auth/change-password', data);
