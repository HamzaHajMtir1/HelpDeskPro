import api from './axios';

export const getAllArticles   = ()       => api.get('/knowledge');
export const getArticle      = (id)     => api.get(`/knowledge/${id}`);
export const searchArticles  = (q)      => api.get(`/knowledge/search?q=${q}`);
export const createArticle   = (data)   => api.post('/knowledge', data);
export const updateArticle   = (id, d)  => api.put(`/knowledge/${id}`, d);
export const deleteArticle   = (id)     => api.delete(`/knowledge/${id}`);
export const getByCategory   = (cat)    => api.get(`/knowledge/category/${cat}`);

// ← AJOUTS
export const voteArticle     = (id, type) => {
  // Validate + encode user-controlled data before it reaches the request URL
  // (Sonar jssecurity:S8476 / S7044): the vote type is whitelisted and the id
  // is percent-encoded so it cannot inject extra path or query segments.
  const t = type === 'up' ? 'up' : 'down';
  return api.post(`/knowledge/${encodeURIComponent(id)}/vote?type=${t}`);
};
