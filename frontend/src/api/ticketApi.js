import api from './axios';

// ── Tickets ──
export const createTicket       = (data)               => api.post('/tickets', data);
export const getMyTickets       = ()                   => api.get('/tickets/my');
export const getAllTickets       = ()                   => api.get('/tickets');
export const getTicketById      = (id)                 => api.get(`/tickets/${id}`);
export const changeStatus       = (ticketId, statusId) => api.patch(`/tickets/${ticketId}/status/${statusId}`);
export const assignTicket       = (ticketId, techId)   => api.patch(`/tickets/${ticketId}/assign/${techId}`);
export const deleteTicket       = (id)                 => api.delete(`/tickets/${id}`);
export const updateTicket       = (id, data)           => api.put(`/tickets/${id}`, data);

// ── Fermeture définitive ──
export const closeTicket = (ticketId) => api.patch(`/tickets/${ticketId}/close`);

// ── Référentiels ──
export const getCategories  = () => api.get('/admin/categories/active');
export const getPriorities  = () => api.get('/admin/priorities/active');
export const getStatuses    = () => api.get('/admin/statuses/active');
export const getTechniciens = () => api.get('/admin/users');

// ── Technicien ──
export const getAssignedTickets = () => api.get('/tickets/assigned');
export const prendreEnCharge    = (ticketId) => api.post(`/tickets/${ticketId}/prendre-en-charge`);

// ── Catégorie et priorité ──
export const updateCategory = (ticketId, categoryId) =>
  api.patch(`/tickets/${ticketId}/category/${categoryId}`);
export const updatePriority = (ticketId, priorityId) =>
  api.patch(`/tickets/${ticketId}/priority/${priorityId}`);

// ── Stats ──
export const getUserStats = () => api.get('/admin/users/stats');

// ── Pièces jointes ──
export const uploadAttachment = (ticketId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/tickets/${ticketId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const getAttachments = (ticketId) =>
  api.get(`/tickets/${ticketId}/attachments`);

export const downloadAttachment = (ticketId, attachmentId) =>
  api.get(`/tickets/${ticketId}/attachments/${attachmentId}/download`, {
    responseType: 'blob'
  });

// ── Commentaires ──
export const getComments = (ticketId) =>
  api.get(`/tickets/${ticketId}/comments`);
export const addComment = (ticketId, content, interne = false) =>
  api.post(`/tickets/${ticketId}/comments`, { content, interne });
