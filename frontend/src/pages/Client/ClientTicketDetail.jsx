import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, AlertCircle, MessageSquare,
  Send, Paperclip, Eye, History, User, X,
} from 'lucide-react';
import ClientLayout from '../../layouts/ClientLayout';
import {
  getTicketById, getStatuses, getAttachments,
  uploadAttachment, getComments, addComment,
} from '../../api/ticketApi';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/axios';

export default function ClientTicketDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const bottomRef  = useRef(null);
  const fileInputRef = useRef(null);
  const { settings } = useSettings();
  const prefix       = settings?.ticketPrefix || 'TKT';

  const [ticket,      setTicket]      = useState(null);
  const [statuses,    setStatuses]    = useState([]);
  const [comments,    setComments]    = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [newComment,  setNewComment]  = useState('');
  const [fichier,     setFichier]     = useState(null);
  const [sending,     setSending]     = useState(false);
  const [sendError,   setSendError]   = useState('');
  const [activeTab,   setActiveTab]   = useState('messages');

  const myEmail = localStorage.getItem('email');

  const fetchAll = async () => {
    try {
      const [ticketRes, statusRes] = await Promise.all([
        getTicketById(id),
        getStatuses(),
      ]);
      setTicket(ticketRes.data);
      setStatuses(statusRes.data);
      try { const r = await getComments(id);                   setComments(r.data);    } catch { setComments([]); }
      try { const r = await getAttachments(id);                setAttachments(r.data); } catch { setAttachments([]); }
      try { const r = await api.get(`/tickets/${id}/history`); setHistory(r.data);     } catch { setHistory([]); }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments, attachments]);

  const timeline = [
    ...comments.filter(c => !c.interne).map(c => ({ ...c, _type: 'comment' })),
    ...attachments.map(a => ({ ...a, _type: 'attachment' })),
  ].sort((a, b) =>
    new Date(a.createdAt || a.uploadedAt) - new Date(b.createdAt || b.uploadedAt)
  );

  const isClosed = ticket?.status?.finalStatus === true;

  const handleSendComment = async () => {
    if ((!newComment.trim() && !fichier) || sending) return;
    setSending(true);
    setSendError('');
    try {
      if (newComment.trim()) {
        await addComment(id, newComment, false);
        setNewComment('');
      }
      if (fichier) {
        await uploadAttachment(id, fichier);
        setFichier(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      await fetchAll();
    } catch (e) {
      console.error('Erreur envoi:', e);
      const msg = e.response?.data?.message || e.response?.data || 'Erreur lors de l\'envoi';
      setSendError(typeof msg === 'string' ? msg : 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  // ── CORRIGÉ : utilisait event.attachmentId au lieu de attachmentId ──
  const handleDownload = (attachmentId, fileName) => {
    const token = localStorage.getItem('token');
    const url = `/api/tickets/${id}/attachments/${attachmentId}/download`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(console.error);
  };

  const getHistoryStyle = (actionType) => {
    const map = {
      TICKET_CREATED:   { icon: '🎫', color: '#6b7280', bg: '#f3f4f6' },
      STATUS_CHANGED:   { icon: '🔄', color: '#3b82f6', bg: '#dbeafe' },
      COMMENT_ADDED:    { icon: '💬', color: '#8b5cf6', bg: '#ede9fe' },
      ATTACHMENT_ADDED: { icon: '📎', color: '#0891b2', bg: '#cffafe' },
      TICKET_RESOLVED:  { icon: '✅', color: '#16a34a', bg: '#dcfce7' },
      TICKET_CLOSED:    { icon: '🔒', color: '#E31E24', bg: '#fee2e2' },
    };
    return map[actionType] || { icon: '📋', color: '#6b7280', bg: '#f3f4f6' };
  };

  const statusColors = {
    'Nouveau':  'bg-gray-100 text-gray-700',
    'En cours': 'bg-blue-100 text-blue-700',
    'Résolu':   'bg-green-100 text-green-700',
    'Fermé':    'bg-red-100 text-red-700',
  };

  const priorityColors = {
    'Critique': { bg: '#fef2f2', text: '#E31E24', border: '#fecaca' },
    'Haute':    { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    'Moyenne':  { bg: '#fefce8', text: '#ca8a04', border: '#fde68a' },
    'Basse':    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  };

  if (loading) return (
    <ClientLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: '#E31E24', borderTopColor: 'transparent' }} />
      </div>
    </ClientLayout>
  );

  if (!ticket) return (
    <ClientLayout>
      <div className="text-center py-20 text-gray-500">Ticket introuvable</div>
    </ClientLayout>
  );

  const priority = priorityColors[ticket.priority.name] || priorityColors['Basse'];
  const canSend  = !isClosed && (newComment.trim() || fichier);

  return (
    <ClientLayout>
      <div className="max-w-3xl mx-auto">

        <button onClick={() => navigate('/tickets')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition">
          <ArrowLeft className="w-4 h-4" />
          Retour à mes tickets
        </button>

        {/* ── En-tête ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-gray-400">
                  #{prefix}-{String(ticket.id).padStart(3, '0')}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ticket.status.name]}`}>
                  {ticket.status.name}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            </div>
            <div className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0"
                 style={{ backgroundColor: priority.bg, color: priority.text, border: `1px solid ${priority.border}` }}>
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              {ticket.priority.name}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Catégorie</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ticket.category.color }} />
                <p className="text-sm font-medium text-gray-700">{ticket.category.name}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Créé par</p>
              <p className="text-sm font-medium text-gray-700">{ticket.createdBy.firstName} {ticket.createdBy.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Assigné à</p>
              <p className="text-sm font-medium text-gray-700">
                {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Non assigné'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">SLA</p>
              <p className="text-sm font-medium text-gray-700">{ticket.priority.slaHours}h</p>
            </div>
          </div>
        </div>

        {/* ── Suivi avancement ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Suivi de l'avancement</h2>
          <div className="flex items-center gap-0">
            {statuses.map((s, index) => {
              const isPassed = statuses.findIndex(st => st.name === ticket.status.name) >= index;
              const isLast   = index === statuses.length - 1;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                         style={{ backgroundColor: isPassed ? '#E31E24' : '#f3f4f6', borderColor: isPassed ? '#E31E24' : '#e5e7eb', color: isPassed ? '#fff' : '#9ca3af' }}>
                      {isPassed ? '✓' : index + 1}
                    </div>
                    <p className="text-xs mt-1 font-medium text-center max-w-16"
                       style={{ color: isPassed ? '#E31E24' : '#9ca3af' }}>
                      {s.name}
                    </p>
                  </div>
                  {!isLast && (
                    <div className="h-0.5 flex-1 mx-1 transition-all"
                         style={{ backgroundColor: statuses.findIndex(st => st.name === ticket.status.name) > index ? '#E31E24' : '#e5e7eb' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Onglets Messages / Historique ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">

          <div className="flex border-b border-gray-100">
            {[
              { key: 'messages',   label: 'Messages',   icon: MessageSquare, count: timeline.length },
              { key: 'historique', label: 'Historique', icon: History,       count: history.length  },
            ].map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2"
                style={{ borderColor: activeTab === key ? '#E31E24' : 'transparent', color: activeTab === key ? '#E31E24' : '#6b7280' }}>
                <Icon className="w-4 h-4" />
                {label}
                {count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: activeTab === key ? '#fff1f1' : '#f3f4f6', color: activeTab === key ? '#E31E24' : '#6b7280' }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab Messages ── */}
          {activeTab === 'messages' && (
            <div className="p-5">
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
                {timeline.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucun message — posez votre question ici</p>
                  </div>
                ) : timeline.map((item) => {
                  if (item._type === 'attachment') {
                    const isMe = item.uploadedBy === myEmail;
                    return (
                      <div key={`att-${item.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm border ${isMe ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                 style={{ backgroundColor: isMe ? '#fff1f1' : '#dbeafe' }}>
                              <Paperclip className="w-4 h-4" style={{ color: isMe ? '#E31E24' : '#2563eb' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: isMe ? '#b91c1c' : '#1d4ed8' }}>{item.fileName}</p>
                              <p className="text-xs" style={{ color: isMe ? '#fca5a5' : '#93c5fd' }}>
                                {new Date(item.uploadedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <button onClick={() => handleDownload(item.id, item.fileName)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition flex-shrink-0"
                              style={{ backgroundColor: isMe ? '#fff1f1' : '#dbeafe', color: isMe ? '#E31E24' : '#2563eb', border: `1px solid ${isMe ? '#fecaca' : '#bfdbfe'}` }}>
                              <Eye className="w-3 h-3" /> Ouvrir
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const isMe = item.authorEmail === myEmail;
                  return (
                    <div key={`msg-${item.id}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && <span className="text-xs font-semibold text-gray-500">{item.authorName}</span>}
                        <span className="text-xs text-gray-400">
                          {new Date(item.createdAt).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <span className="text-xs font-semibold text-gray-500">Vous</span>}
                      </div>
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'rounded-br-sm text-white' : 'rounded-bl-sm bg-gray-100 text-gray-800'}`}
                             style={isMe ? { backgroundColor: '#E31E24' } : {}}>
                          <p className="leading-relaxed">{item.content}</p>
                          <p className={`text-xs mt-1 text-right ${isMe ? 'text-red-200' : 'text-gray-400'}`}>
                            {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* ── Formulaire envoi ── */}
              {isClosed ? (
                <div className="border-t border-gray-100 pt-4 text-center">
                  <p className="text-xs text-gray-400">Ce ticket est clôturé — les messages ne sont plus disponibles</p>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  {fichier && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-xl">
                      <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <p className="text-xs text-blue-700 flex-1 truncate">{fichier.name}</p>
                      <button onClick={() => { setFichier(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-blue-400 hover:text-blue-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {sendError && (
                    <p className="text-xs text-red-600 px-1">{sendError}</p>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300 transition flex-shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={e => setFichier(e.target.files[0] || null)} />
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSendComment(); }}
                      placeholder="Écrivez un message au technicien..."
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition"
                      onFocus={e => e.target.style.borderColor = '#E31E24'}
                      onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <button onClick={handleSendComment} disabled={!canSend || sending}
                      className="px-4 py-2.5 rounded-xl text-white transition flex items-center justify-center"
                      style={{ backgroundColor: canSend ? '#E31E24' : '#e5e7eb', cursor: canSend ? 'pointer' : 'not-allowed' }}
                      onMouseEnter={e => { if (canSend) e.currentTarget.style.backgroundColor = '#b81519'; }}
                      onMouseLeave={e => { if (canSend) e.currentTarget.style.backgroundColor = '#E31E24'; }}>
                      {sending
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab Historique ── */}
          {activeTab === 'historique' && (
            <div className="p-5">
              {history.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-400">Aucun historique disponible</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
                  <div className="space-y-4">
                    {history.map((event, index) => {
                      const style = getHistoryStyle(event.action);
                      return (
                        <div key={event.id || index} className="flex items-start gap-4 relative">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 z-10 border-2 border-white shadow-sm"
                               style={{ backgroundColor: style.bg }}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0 pb-2">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-800">{event.actionLabel}</p>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(event.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {event.performedBy && (
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {event.performedBy.firstName} {event.performedBy.lastName}
                              </p>
                            )}
                            {event.oldValue && event.newValue && (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 line-through">{event.oldValue}</span>
                                <span className="text-xs text-gray-400">→</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: style.bg, color: style.color }}>{event.newValue}</span>
                              </div>
                            )}
                            {/* ── newValue sans oldValue + bouton Ouvrir si pièce jointe ── */}
                            {event.newValue && !event.oldValue && (
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className="text-xs text-gray-500 italic truncate">{event.newValue}</p>
                                {event.attachmentId && (
                                  <button
                                    onClick={() => handleDownload(event.attachmentId, event.attachmentName || event.newValue)}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition flex-shrink-0"
                                    style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                  >
                                    📎 Ouvrir
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Dates ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Créé le {new Date(ticket.createdAt).toLocaleString('fr-FR')}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Mis à jour le {new Date(ticket.updatedAt).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>

      </div>
    </ClientLayout>
  );
}
