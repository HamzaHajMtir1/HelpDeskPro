import api from './axios';

export const getAllArticles   = ()       => api.get('/knowledge');
export const getArticle      = (id)     => api.get(`/knowledge/${id}`);
export const searchArticles  = (q)      => api.get(`/knowledge/search?q=${q}`);
export const createArticle   = (data)   => api.post('/knowledge', data);
export const updateArticle   = (id, d)  => api.put(`/knowledge/${id}`, d);
export const deleteArticle   = (id)     => api.delete(`/knowledge/${id}`);
export const getByCategory   = (cat)    => api.get(`/knowledge/category/${cat}`);

// ← AJOUTS
export const voteArticle     = (id, type) => api.post(`/knowledge/${id}/vote?type=${type}`);
