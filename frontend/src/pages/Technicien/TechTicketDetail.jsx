import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, User, Tag, AlertCircle,
  MessageSquare, Send, Lock, CheckCircle, RefreshCw,
  Paperclip, Eye, X, ShieldOff, History,
  Loader2, Pin, PinOff, Bot, ChevronRight, ChevronLeft,
  ChevronDown, ChevronUp,
  Ticket, Edit, UserCheck, UserX, ArrowLeftRight,
  AlarmClock, TrendingUp, Flame, ShieldCheck,
} from 'lucide-react';
import TechnicienLayout from '../../layouts/TechnicienLayout';
import {
  getTicketById, changeStatus, getStatuses,
  getComments, addComment, getAttachments, uploadAttachment
} from '../../api/ticketApi';
import api from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import Agent2Chat from '../../components/Agent2Chat';

/* ─────────────────────────────────────────────────────────────────────────────
   StatusSelect — position:fixed, recalcule au scroll/resize
   ──────────────────────────────────────────────────────────────────────────── */
const StatusSelect = ({ value, onChange, options, disabled, statusColor }) => {
  const [open, setOpen]           = useState(false);
  const [listStyle, setListStyle] = useState({});
  const btnRef = useRef(null);
  const ref    = useRef(null);

  const calcPosition = () => {
    if (!btnRef.current) return;
    const rect       = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const fitsBelow  = spaceBelow >= 120;
    const listH      = Math.min(260, Math.max(80, spaceBelow));
    setListStyle(fitsBelow ? {
      position : 'fixed',
      top      : rect.bottom + 6,
      left     : rect.left,
      width    : Math.max(rect.width, 200),
      zIndex   : 99999,
      maxHeight: listH,
    } : {
      position : 'fixed',
      bottom   : window.innerHeight - rect.top + 6,
      left     : rect.left,
      width    : Math.max(rect.width, 200),
      zIndex   : 99999,
      maxHeight: Math.min(260, rect.top - 20),
    });
  };

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => calcPosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const handleOpen = () => {
    if (disabled) return;
    if (!open) calcPosition();
    setOpen(o => !o);
  };

  const selected    = options.find(o => String(o.value) === String(value));
  const activeColor = statusColor || '#6b7280';
  const activeBg    = activeColor + '18';

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        style={{
          display        : 'flex',
          alignItems     : 'center',
          gap            : 8,
          padding        : '8px 14px',
          border         : `2px solid ${open ? activeColor : activeColor + '60'}`,
          borderRadius   : 12,
          fontSize       : 13,
          fontWeight     : 600,
          backgroundColor: activeBg,
          outline        : 'none',
          cursor         : disabled ? 'not-allowed' : 'pointer',
          color          : activeColor,
          opacity        : disabled ? 0.6 : 1,
          boxShadow      : open ? `0 0 0 3px ${activeColor}20` : 'none',
          transition     : 'all 0.15s',
          whiteSpace     : 'nowrap',
          minWidth       : 140,
          maxWidth       : '100%',
        }}
      >
        <span style={{
          width          : 7,
          height         : 7,
          borderRadius   : '50%',
          backgroundColor: activeColor,
          flexShrink     : 0,
          boxShadow      : `0 0 6px ${activeColor}80`,
        }} />
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected?.label || 'Statut'}
        </span>
        {open
          ? <ChevronUp   style={{ width: 13, height: 13, flexShrink: 0 }} />
          : <ChevronDown style={{ width: 13, height: 13, flexShrink: 0 }} />
        }
      </button>

      {open && (
        <ul
          style={{
            ...listStyle,
            backgroundColor: '#fff',
            border         : '1.5px solid #e5e7eb',
            borderRadius   : 12,
            boxShadow      : '0 12px 32px rgba(0,0,0,0.14)',
            overflowY      : 'auto',
            margin         : 0,
            padding        : '5px',
            listStyle      : 'none',
            scrollbarWidth : 'thin',
            scrollbarColor : '#e5e7eb #fff',
          }}
        >
          {options.map(opt => {
            const isActive  = String(opt.value) === String(value);
            const optColor  = opt.color || '#6b7280';
            const optBg     = optColor + '15';
            return (
              <li
                key={opt.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!isActive) onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display        : 'flex',
                  alignItems     : 'center',
                  gap            : 10,
                  padding        : '9px 12px',
                  fontSize       : 13,
                  fontWeight     : isActive ? 600 : 500,
                  cursor         : isActive ? 'default' : 'pointer',
                  borderRadius   : 8,
                  backgroundColor: isActive ? optBg : 'transparent',
                  color          : isActive ? optColor : '#374151',
                  transition     : 'background-color 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{
                  width          : 8,
                  height         : 8,
                  borderRadius   : '50%',
                  backgroundColor: optColor,
                  flexShrink     : 0,
                  boxShadow      : isActive ? `0 0 5px ${optColor}70` : 'none',
                }} />
                <span style={{ flex: 1 }}>{opt.label}</span>
                {isActive && (
                  <CheckCircle style={{ width: 13, height: 13, color: optColor, flexShrink: 0 }} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/* ─── Helpers ─── */
function formatDuration(ms) {
  const totalMin = Math.round(Math.abs(ms) / 60000);
  const days  = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins  = totalMin % 60;
  if (days > 0)  return hours > 0 ? `${days}j ${hours}h` : `${days}j`;
  if (hours > 0) return mins  > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

function computeSlaPercent(ticket) {
  if (!ticket.slaDeadline || !ticket.slaTotalMinutes) return null;
  const totalMs  = ticket.slaTotalMinutes * 60000;
  const deadline = new Date(ticket.slaDeadline).getTime();
  const elapsed  = Math.min(Math.max(Date.now() - (deadline - totalMs), 0), totalMs);
  return Math.round((elapsed / totalMs) * 100);
}

/* ─── Toast ─── */
function Toast({ toast }) {
  if (!toast) return null;
  const configs = {
    success: {
      bg: '#f0fdf4', border: '#86efac', text: '#15803d',
      icon: <CheckCircle style={{ width: 18, height: 18, flexShrink: 0 }} />,
    },
    info: {
      bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8',
      icon: <Loader2 style={{ width: 18, height: 18, flexShrink: 0 }} className="animate-spin" />,
    },
    error: {
      bg: '#fff1f1', border: '#fecaca', text: '#b91c1c',
      icon: <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />,
    },
  };
  const c = configs[toast.type] || configs.info;
  return (
    <>
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        className="fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-medium"
        style={{
          backgroundColor : c.bg,
          borderColor     : c.border,
          borderLeftWidth : '4px',
          color           : c.text,
          maxWidth        : '380px',
          animation       : 'slideInToast 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {c.icon}
        <span className="break-words min-w-0 leading-relaxed">{toast.msg}</span>
      </div>
    </>
  );
}

function ActionButton({ onClick, loading, loadingLabel, children, style, hoverStyle, className = '', disabled = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} disabled={loading || disabled}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${className}`}
      style={{ ...style, opacity: loading ? 0.85 : 1, cursor: loading ? 'not-allowed' : 'pointer',
               ...(hovered && !loading ? hoverStyle : {}) }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{loadingLabel}</> : children}
    </button>
  );
}

const ACTION_CONFIG = {
  TICKET_CREATED:     { label: 'Ticket créé',                          color: '#6b7280', bg: '#f3f4f6', Icon: Ticket       },
  TICKET_UPDATED:     { label: 'Ticket modifié',                       color: '#6b7280', bg: '#f3f4f6', Icon: Edit         },
  TICKET_RESOLVED:    { label: 'Ticket résolu',                        color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle  },
  TICKET_CLOSED:      { label: 'Ticket clôturé',                       color: '#6b7280', bg: '#f3f4f6', Icon: Lock         },
  STATUS_CHANGED:     { label: 'Statut modifié',                       color: '#3b82f6', bg: '#eff6ff', Icon: RefreshCw    },
  PRIORITY_CHANGED:   { label: 'Priorité modifiée',                    color: '#ea580c', bg: '#fff7ed', Icon: Flame        },
  CATEGORY_CHANGED:   { label: 'Catégorie modifiée',                   color: '#8b5cf6', bg: '#f5f3ff', Icon: Tag         },
  ASSIGNED:           { label: 'Ticket assigné',                       color: '#0891b2', bg: '#ecfeff', Icon: UserCheck    },
  UNASSIGNED:         { label: 'Assignation retirée',                  color: '#dc2626', bg: '#fef2f2', Icon: UserX        },
  REASSIGNED:         { label: 'Ticket réassigné',                     color: '#0891b2', bg: '#ecfeff', Icon: ArrowLeftRight},
  SLA_BREACHED:       { label: 'SLA dépassé',                          color: '#dc2626', bg: '#fef2f2', Icon: AlarmClock   },
  SLA_ESCALATED:      { label: 'Escalade SLA',                         color: '#dc2626', bg: '#fef2f2', Icon: TrendingUp   },
  SLA_RESET:          { label: 'SLA réinitialisé',                     color: '#16a34a', bg: '#f0fdf4', Icon: RefreshCw    },
  COMMENT_ADDED:      { label: 'Commentaire ajouté',                   color: '#6b7280', bg: '#f9fafb', Icon: MessageSquare},
  NOTE_INTERNE_ADDED: { label: 'Note interne ajoutée',                 color: '#ca8a04', bg: '#fefce8', Icon: Lock         },
  ATTACHMENT_ADDED:   { label: 'Pièce jointe ajoutée',                 color: '#2563eb', bg: '#eff6ff', Icon: Paperclip    },
  ADMIN_INTERVENTION: { label: "Intervention de l'administrateur",     color: '#7c3aed', bg: '#f5f3ff', Icon: ShieldCheck  },
};

function HistoryTimeline({ history, loading }) {
  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin"
           style={{ borderColor: '#E31E24', borderTopColor: 'transparent' }} />
    </div>
  );
  if (!history.length) return (
    <div className="text-center py-10">
      <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-400">Aucun événement enregistré</p>
    </div>
  );
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
      <div className="space-y-1">
        {history.map((entry, idx) => {
          const cfg    = ACTION_CONFIG[entry.action] || { label: entry.actionLabel, color: '#6b7280', bg: '#f3f4f6', Icon: History };
          const isLast = idx === history.length - 1;
          const IconComponent = cfg.Icon;
          return (
            <div key={entry.id} className="relative flex gap-3 pl-1">
              <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 border-white shadow-sm"
                   style={{ backgroundColor: cfg.bg }}>
                {IconComponent && <IconComponent style={{ width: 13, height: 13, color: cfg.color }} strokeWidth={1.8} />}
              </div>
              <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-4'}`}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(entry.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap min-w-0">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white flex-shrink-0"
                         style={{ backgroundColor: '#E31E24', fontSize: '9px' }}>
                      {entry.performedBy?.firstName?.[0]}{entry.performedBy?.lastName?.[0]}
                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate">{entry.performedBy?.firstName} {entry.performedBy?.lastName}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400 capitalize">{entry.performedBy?.role?.toLowerCase()}</span>
                  </div>
                  {(entry.oldValue || entry.newValue) && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {entry.oldValue && <span className="text-xs px-2 py-0.5 rounded-md bg-red-50 text-red-600 line-through break-all">{entry.oldValue}</span>}
                      {entry.oldValue && entry.newValue && <span className="text-xs text-gray-400">→</span>}
                      {entry.newValue && <span className="text-xs px-2 py-0.5 rounded-md bg-green-50 text-green-700 font-medium break-all">{entry.newValue}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SolutionPanel({ comments, attachments, pinnedMessageId, pinnedAttachmentIds, onDownload }) {
  const pinnedComment    = comments.find(c => !Number.isNaN(Number(c.id)) && Number(c.id) === pinnedMessageId);
  const pinnedAttachList = attachments.filter(a => pinnedAttachmentIds.includes(Number(a.id)));
  if (!pinnedComment && pinnedAttachList.length === 0) return null;
  return (
    <div className="mb-6 rounded-2xl border-2 overflow-hidden"
         style={{ borderColor: '#22c55e', backgroundColor: '#f0fdf4' }}>
      <div className="flex items-center gap-2 px-5 py-3"
           style={{ backgroundColor: '#dcfce7', borderBottom: '1px solid #bbf7d0' }}>
        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
        <span className="text-sm font-bold" style={{ color: '#15803d' }}>Solution officielle épinglée</span>
      </div>
      <div className="px-5 py-4 space-y-3">
        {pinnedComment && (
          <div>
            <p className="text-xs font-semibold text-green-600 mb-1.5 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Message solution
            </p>
            <div className="bg-white rounded-xl border border-green-200 px-4 py-3">
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{pinnedComment.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                Par {pinnedComment.authorName} · {new Date(pinnedComment.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )}
        {pinnedAttachList.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-600 mb-1.5 flex items-center gap-1">
              <Paperclip className="w-3 h-3" /> Pièce{pinnedAttachList.length > 1 ? 's' : ''} jointe{pinnedAttachList.length > 1 ? 's' : ''} solution
            </p>
            <div className="space-y-2">
              {pinnedAttachList.map(att => (
                <div key={att.id} className="bg-white rounded-xl border border-green-200 px-3 py-2.5 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#dcfce7' }}>
                    <Paperclip className="w-4 h-4" style={{ color: '#16a34a' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-800 truncate">{att.fileName}</p>
                    <p className="text-xs text-gray-400">{new Date(att.uploadedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button onClick={() => onDownload(att.id, att.fileName)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition flex-shrink-0"
                    style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #86efac' }}>
                    <Eye className="w-3 h-3" /> Ouvrir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Page principale
   ══════════════════════════════════════════════════════════════ */
export default function TechTicketDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);

  const { settings } = useSettings();
  const prefix = settings?.ticketPrefix || 'TKT';

  const [agent2Open, setAgent2Open] = useState(false);
  const [ticket,          setTicket]          = useState(null);
  const [statuses,        setStatuses]        = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [priorities,      setPriorities]      = useState([]);
  const [comments,        setComments]        = useState([]);
  const [attachments,     setAttachments]     = useState([]);
  const [history,         setHistory]         = useState([]);
  const [historyLoading,  setHistoryLoading]  = useState(false);
  const [activeTab,       setActiveTab]       = useState('messages');
  const [loading,         setLoading]         = useState(true);
  const [newComment,      setNewComment]      = useState('');
  const [isInterne,       setIsInterne]       = useState(false);
  const [sending,         setSending]         = useState(false);
  const [sendError,       setSendError]       = useState('');
  const [saving,          setSaving]          = useState(false);
  const [fichierComment,  setFichierComment]  = useState(null);
  const [confirmFermer,   setConfirmFermer]   = useState(false);
  const [localClosed,     setLocalClosed]     = useState(false);
  const [toast,           setToast]           = useState(null);
  const [pinnedMessageId,     setPinnedMessageId]     = useState(null);
  const [pinnedAttachmentIds, setPinnedAttachmentIds] = useState([]);
  const [loadingBtn,     setLoadingBtn]     = useState(null);
  const [loadingPinAtt,  setLoadingPinAtt]  = useState(null);
  const [solutionError,  setSolutionError]  = useState(false);

  const myEmail = localStorage.getItem('email');

  const showToast = useCallback((type, msg, duration = 3000) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), duration);
  }, []);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setHistoryLoading(true);
    try {
      const r = await api.get(`/tickets/${id}/history`);
      setHistory(r.data);
    } catch (e) { console.error(e); }
    finally { if (!silent) setHistoryLoading(false); }
  }, [id]);

  const fetchAll = useCallback(async (silent = false, skipPinUpdate = false) => {
    try {
      const [ticketRes, statusRes, catRes, priRes] = await Promise.all([
        getTicketById(id),
        getStatuses(),
        api.get('/admin/categories/active'),
        api.get('/admin/priorities/active'),
      ]);
      setTicket(ticketRes.data);
      if (!skipPinUpdate) {
        const pinned = ticketRes.data?.solutionCommentId;
        setPinnedMessageId(pinned != null ? Number(pinned) : null);
        const pinnedAtts = ticketRes.data?.solutionAttachmentIds ?? [];
        setPinnedAttachmentIds(pinnedAtts.map(Number));
      }
      setStatuses(statusRes.data);
      setCategories(catRes.data);
      setPriorities(priRes.data);
      if (ticketRes.data?.status?.finalStatus === true) setLocalClosed(true);
      const [commentsRes, attachRes] = await Promise.all([
        getComments(id).catch(() => ({ data: [] })),
        getAttachments(id).catch(() => ({ data: [] })),
      ]);
      setComments(commentsRes.data);
      setAttachments(attachRes.data);
    } catch (e) { console.error(e); }
    finally { if (!silent) setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(false, false); fetchHistory(false); }, [fetchAll, fetchHistory]);

  useEffect(() => {
    if (activeTab === 'messages') bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, attachments, activeTab]);

  const isAssigned    = ticket?.assignedTo?.email === myEmail;
  const isClosed      = localClosed || ticket?.status?.finalStatus === true;
  const isReadOnly    = isClosed || !isAssigned;
  const isInfoRequise = ticket?.status?.name?.toLowerCase().includes('information') ||
                        ticket?.status?.name?.toLowerCase().includes('requise');

  const timeline = [
    ...comments.map(c => ({ ...c, _type: 'comment' })),
    ...attachments.map(a => ({ ...a, _type: 'attachment' })),
  ].sort((a, b) => new Date(a.createdAt || a.uploadedAt) - new Date(b.createdAt || b.uploadedAt));

  const handlePinSolution = useCallback(async (commentId) => {
    if (loadingBtn === 'pin') return;
    const commentIdNum    = Number(commentId);
    const isAlreadyPinned = pinnedMessageId === commentIdNum;
    const newPinned       = isAlreadyPinned ? null : commentIdNum;
    setPinnedMessageId(newPinned);
    setSolutionError(false);
    setLoadingBtn('pin');
    try {
      await api.patch(`/tickets/${id}/solution`, { solutionCommentId: newPinned });
      showToast('success', newPinned !== null ? '📌 Solution épinglée' : '✕ Épinglage retiré');
      await fetchAll(true, true);
    } catch (e) {
      showToast('error', "Erreur lors de l'épinglage");
      setPinnedMessageId(isAlreadyPinned ? commentIdNum : null);
    } finally { setLoadingBtn(null); }
  }, [id, pinnedMessageId, loadingBtn, fetchAll, showToast]);

  const handleToggleAttachmentPin = useCallback(async (attachmentId) => {
    if (loadingPinAtt !== null) return;
    const attIdNum        = Number(attachmentId);
    const isAlreadyPinned = pinnedAttachmentIds.includes(attIdNum);
    const newPinnedAtts   = isAlreadyPinned
      ? pinnedAttachmentIds.filter(x => x !== attIdNum)
      : [...pinnedAttachmentIds, attIdNum];
    setPinnedAttachmentIds(newPinnedAtts);
    setSolutionError(false);
    setLoadingPinAtt(attIdNum);
    try {
      await api.patch(`/tickets/${id}/solution/attachment/${attachmentId}`);
      showToast('success', isAlreadyPinned ? '✕ Pièce jointe désépinglée' : '📎 Pièce jointe épinglée comme solution');
      await fetchAll(true, true);
    } catch (e) {
      showToast('error', "Erreur lors de l'épinglage de la pièce jointe");
      setPinnedAttachmentIds(pinnedAttachmentIds);
    } finally { setLoadingPinAtt(null); }
  }, [id, pinnedAttachmentIds, loadingPinAtt, fetchAll, showToast]);

  const handleChangeStatus = useCallback(async (statusId, btnKey, toastMsg) => {
    if (isClosed || loadingBtn) return;
    const targetStatus = statuses.find(s => s.id === Number(statusId) || s.id === statusId);
    if (!targetStatus) return;
    setLoadingBtn(btnKey);
    showToast('info', toastMsg || 'Mise à jour en cours…', 8000);
    setTicket(prev => ({ ...prev, status: targetStatus }));
    try {
      await changeStatus(id, statusId);
      showToast('success', 'Statut mis à jour avec succès');
      fetchAll(true, false); fetchHistory(true);
    } catch (e) {
      showToast('error', 'Erreur lors de la mise à jour');
      fetchAll(true, false);
    } finally { setLoadingBtn(null); }
  }, [id, isClosed, loadingBtn, statuses, fetchAll, fetchHistory, showToast]);

  const handleDemanderInfos = useCallback(async () => {
    const s = statuses.find(s => s.name.toLowerCase().includes('information') || s.name.toLowerCase().includes('requise'));
    if (s) await handleChangeStatus(s.id, 'infos', "Demande d'informations en cours…");
  }, [statuses, handleChangeStatus]);

  const handleReprendreTraitement = useCallback(async () => {
    const s = statuses.find(s => s.name.toLowerCase().includes('cours'));
    if (s) await handleChangeStatus(s.id, 'reprendre', 'Reprise du traitement en cours…');
  }, [statuses, handleChangeStatus]);

  const handleResoudre = useCallback(async () => {
    const s = statuses.find(s => s.name.toLowerCase().includes('résolu') || s.name.toLowerCase().includes('resolu'));
    if (s) await handleChangeStatus(s.id, 'resoudre', 'Marquage comme résolu…');
  }, [statuses, handleChangeStatus]);

  const handleChangeStatusSelect = useCallback(async (statusId) => {
    if (isClosed || loadingBtn) return;
    const targetStatus = statuses.find(s => s.id === Number(statusId));
    if (!targetStatus) return;
    setLoadingBtn('select');
    showToast('info', `Passage à "${targetStatus.name}"…`, 8000);
    setTicket(prev => ({ ...prev, status: targetStatus }));
    try {
      await changeStatus(id, statusId);
      showToast('success', 'Statut mis à jour');
      fetchAll(true, false); fetchHistory(true);
    } catch (e) {
      showToast('error', 'Erreur lors de la mise à jour');
      fetchAll(true, false);
    } finally { setLoadingBtn(null); }
  }, [id, isClosed, loadingBtn, statuses, fetchAll, fetchHistory, showToast]);

  /* ── Clôture avec vérification solution épinglée ── */
  const handleClickFermer = useCallback(() => {
    const hasPinnedSolution = pinnedMessageId !== null || pinnedAttachmentIds.length > 0;
    if (!hasPinnedSolution) {
      setSolutionError(true);
      showToast('error', '📌 Veuillez épingler une solution avant de clôturer le ticket', 4000);
      return;
    }
    setSolutionError(false);
    setConfirmFermer(true);
  }, [pinnedMessageId, pinnedAttachmentIds, showToast]);

  const handleFermer = useCallback(async () => {
    const s = statuses.find(s => s.name.toLowerCase().includes('fermé') || s.name.toLowerCase().includes('ferme'));
    if (!s) return;
    setLoadingBtn('fermer');
    showToast('info', 'Clôture du ticket en cours…', 8000);
    setTicket(prev => ({ ...prev, status: s }));
    setLocalClosed(true);
    setConfirmFermer(false);
    try {
      await changeStatus(id, s.id);
      showToast('success', 'Ticket clôturé avec succès');
      fetchAll(true, false); fetchHistory(true);
    } catch (e) {
      showToast('error', 'Erreur lors de la clôture');
      setLocalClosed(false);
      fetchAll(true, false);
    } finally { setLoadingBtn(null); }
  }, [id, statuses, fetchAll, fetchHistory, showToast]);

  const handleChangeCategory = useCallback(async (categoryId) => {
    if (isReadOnly) return;
    const targetCat = categories.find(c => c.id === categoryId);
    if (!targetCat) return;
    setTicket(prev => ({ ...prev, category: targetCat }));
    setSaving(true);
    try {
      await api.patch(`/tickets/${id}/category/${categoryId}`);
      fetchAll(true, false); fetchHistory(true);
    } catch (e) { fetchAll(true, false); }
    finally { setSaving(false); }
  }, [id, isReadOnly, categories, fetchAll, fetchHistory]);

  const handleChangePriority = useCallback(async (priorityId) => {
    if (isReadOnly) return;
    const targetPri = priorities.find(p => p.id === priorityId);
    if (!targetPri) return;
    setTicket(prev => ({ ...prev, priority: targetPri }));
    setSaving(true);
    try {
      await api.patch(`/tickets/${id}/priority/${priorityId}`);
      fetchAll(true, false); fetchHistory(true);
    } catch (e) { fetchAll(true, false); }
    finally { setSaving(false); }
  }, [id, isReadOnly, priorities, fetchAll, fetchHistory]);

  const handleSendComment = useCallback(async () => {
    if ((!newComment.trim() && !fichierComment) || isClosed || sending) return;
    setSending(true);
    setSendError('');
    const tempId = `temp-${Date.now()}`;
    const tempComment = newComment.trim() ? {
      id: tempId, content: newComment, interne: isAssigned ? isInterne : true,
      authorEmail: myEmail, authorName: 'Vous', createdAt: new Date().toISOString(),
      _type: 'comment', _pending: true,
    } : null;
    if (tempComment) { setComments(prev => [...prev, tempComment]); setNewComment(''); }
    try {
      if (tempComment) await addComment(id, tempComment.content, tempComment.interne);
      if (fichierComment) {
        await uploadAttachment(id, fichierComment);
        setFichierComment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      const [commentsRes, attachRes] = await Promise.all([
        getComments(id).catch(() => ({ data: [] })),
        getAttachments(id).catch(() => ({ data: [] })),
      ]);
      setComments(commentsRes.data);
      setAttachments(attachRes.data);
      fetchHistory(true);
    } catch (e) {
      if (tempComment) { setComments(prev => prev.filter(c => c.id !== tempId)); setNewComment(tempComment.content); }
      const raw = e.response?.data;
      setSendError(typeof raw === 'string' ? raw : raw?.message || raw?.error || "Erreur lors de l'envoi");
    } finally { setSending(false); }
  }, [id, newComment, fichierComment, isClosed, sending, isAssigned, isInterne, myEmail, fetchHistory]);

  const handleDownload = useCallback((attachmentId, fileName) => {
    const token = localStorage.getItem('token');
    const url   = `https://helpdesk.4d-gile.com/api/tickets/${id}/attachments/${attachmentId}/download`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
        URL.revokeObjectURL(a.href);
      }).catch(console.error);
  }, [id]);

  const priorityStyle = {
    'Critique': { bg: '#fee2e2', color: '#dc2626' },
    'Haute':    { bg: '#ffedd5', color: '#ea580c' },
    'Moyenne':  { bg: '#fef9c3', color: '#ca8a04' },
    'Basse':    { bg: '#f3f4f6', color: '#6b7280' },
  };

  if (loading) return (
    <TechnicienLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: '#E31E24', borderTopColor: 'transparent' }} />
      </div>
    </TechnicienLayout>
  );

  if (!ticket) return (
    <TechnicienLayout>
      <div className="text-center py-20 text-gray-400">Ticket introuvable</div>
    </TechnicienLayout>
  );

  const pStyle     = priorityStyle[ticket.priority?.name] || { bg: '#f3f4f6', color: '#6b7280' };
  const slaPercent = computeSlaPercent(ticket);

  const slaTimeLeft = (() => {
    if (!ticket.slaDeadline) return null;
    const diffMs = new Date(ticket.slaDeadline) - new Date();
    if (diffMs <= 0) return null;
    return formatDuration(diffMs);
  })();

  const slaTimeElapsed = (() => {
    if (!ticket.slaDeadline || !ticket.slaTotalMinutes) return null;
    const totalMs  = ticket.slaTotalMinutes * 60000;
    const deadline = new Date(ticket.slaDeadline).getTime();
    const elapsed  = Math.max(Date.now() - (deadline - totalMs), 0);
    return formatDuration(elapsed);
  })();

  const slaPhaseLabel = ticket.slaPhase === 'PRISE_EN_CHARGE'
    ? `Délai prise en charge (${ticket.priority?.escaladeMinutes ?? ticket.slaTotalMinutes ?? 30} min)`
    : ticket.slaPhase === 'TRAITEMENT'
      ? `Délai traitement (${ticket.priority?.slaHours}h)`
      : null;

  const canSend    = !isClosed && (newComment.trim() || fichierComment);
  const anyLoading = loadingBtn !== null;

  const statusOptions = statuses
    .filter(s => !s.finalStatus)
    .map(s => ({ value: s.id, label: s.name, color: s.color }));

  const incidentForAgent = {
    id:          ticket.id,
    title:       ticket.title,
    description: ticket.description,
    category:    ticket.category?.name  || '',
    status:      ticket.status?.name    || '',
    ticketsCount: 1,
    attachments: attachments.map(att => ({
      id:       att.id,
      fileName: att.fileName,
      filePath: att.filePath,
      fileType: att.fileType,
    })),
  };

  return (
    <TechnicienLayout>
      <div className="overflow-x-hidden w-full">

        <Toast toast={toast} />

        {/* Modal confirmation fermeture */}
        {confirmFermer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
               style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: '#fff1f1' }}>
                  <ShieldOff className="w-6 h-6" style={{ color: '#E31E24' }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900">Clôturer ce ticket ?</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                Une fois clôturé, le ticket passera en <strong>lecture seule</strong>.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmFermer(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition text-gray-600">
                  Annuler
                </button>
                <button onClick={handleFermer} disabled={loadingBtn === 'fermer'}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#E31E24' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b81519'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E31E24'}>
                  {loadingBtn === 'fermer' ? <><Loader2 className="w-4 h-4 animate-spin" /> Clôture…</> : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ LAYOUT PRINCIPAL ══ */}
        <div className="flex gap-0 relative" style={{ minHeight: 'calc(100vh - 80px)' }}>

          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="max-w-7xl mx-auto px-1 sm:px-2">

              {/* ══ EN-TÊTE ══ */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 sm:px-6 py-4 mb-4 sm:mb-6">
                <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">

                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <button onClick={() => navigate('/tech/tickets')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition flex-shrink-0 mt-0.5 sm:mt-0">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-xs font-bold text-gray-400 font-mono whitespace-nowrap">
                          #{prefix}-{String(ticket.id).padStart(3, '0')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 whitespace-nowrap"
                          style={{ backgroundColor: (ticket.status?.color || '#6b7280') + '20', color: ticket.status?.color || '#6b7280' }}>
                          {anyLoading && loadingBtn !== 'pin' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {ticket.status?.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                          style={{ backgroundColor: pStyle.bg, color: pStyle.color }}>
                          {ticket.priority?.name}
                        </span>
                        {isClosed ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 whitespace-nowrap">Lecture seule</span>
                        ) : isAssigned ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 whitespace-nowrap">Vous traitez</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 whitespace-nowrap">
                            {ticket.assignedTo?.firstName} {ticket.assignedTo?.lastName}
                          </span>
                        )}
                      </div>
                      <h1 className="text-base sm:text-lg font-bold text-gray-900 break-words leading-snug">{ticket.title}</h1>
                      {ticket.createdBy && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{ticket.createdBy.firstName} {ticket.createdBy.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    <button onClick={() => { fetchAll(false, false); fetchHistory(false); }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition flex-shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setAgent2Open(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm border-2 whitespace-nowrap"
                      style={{
                        backgroundColor: agent2Open ? '#E31E24' : '#fff1f1',
                        borderColor    : agent2Open ? '#E31E24' : '#fecaca',
                        color          : agent2Open ? '#fff'    : '#E31E24',
                      }}>
                      <Bot className="w-4 h-4 flex-shrink-0" />
                      <span>Agent 2</span>
                      {agent2Open
                        ? <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                        : <ChevronLeft  className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>

                    {!isClosed && isAssigned && (
                      <StatusSelect
                        value={ticket.status?.id || ''}
                        onChange={val => handleChangeStatusSelect(Number(val))}
                        options={statusOptions}
                        disabled={anyLoading}
                        statusColor={ticket.status?.color}
                      />
                    )}

                    {isAssigned && !isClosed && (
                      <button
                        onClick={handleClickFermer}
                        disabled={anyLoading}
                        className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition shadow-sm whitespace-nowrap"
                        style={{ backgroundColor: '#16a34a', opacity: anyLoading ? 0.6 : 1 }}
                        onMouseEnter={e => { if (!anyLoading) e.currentTarget.style.backgroundColor = '#15803d'; }}
                        onMouseLeave={e => { if (!anyLoading) e.currentTarget.style.backgroundColor = '#16a34a'; }}>
                        <ShieldOff className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Clôturer le ticket</span>
                        <span className="sm:hidden">Clôturer</span>
                      </button>
                    )}
                    {isClosed && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap">
                        <ShieldOff className="w-4 h-4 flex-shrink-0" /> Clôturé
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Bannière erreur solution non épinglée ── */}
              {solutionError && !isClosed && (
                <div className="mb-4 flex items-start gap-3 px-5 py-4 rounded-2xl border-2"
                     style={{
                       backgroundColor: '#fff1f1',
                       borderColor    : '#fca5a5',
                       borderLeftWidth: '5px',
                       borderLeftColor: '#E31E24',
                       animation      : 'slideInToast 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
                     }}>
                  <style>{`
                    @keyframes slideInToast {
                      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
                      to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                  `}</style>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ backgroundColor: '#fee2e2' }}>
                    <Pin className="w-4 h-4" style={{ color: '#E31E24' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#b91c1c' }}>
                      Solution requise avant la clôture
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#ef4444' }}>
                      Veuillez épingler un message ou une pièce jointe comme solution officielle avant de clôturer ce ticket.
                    </p>
                  </div>
                  <button
                    onClick={() => setSolutionError(false)}
                    className="text-red-300 hover:text-red-500 transition flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bannière fermé */}
              {isClosed && (
                <div className="mb-4 p-4 rounded-2xl border flex items-center gap-3"
                     style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                  <ShieldOff className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700">Ce ticket est clôturé</p>
                    <p className="text-xs text-gray-400 mt-0.5">Aucune modification n'est possible.</p>
                  </div>
                </div>
              )}

              {isClosed && (
                <SolutionPanel
                  comments={comments} attachments={attachments}
                  pinnedMessageId={pinnedMessageId} pinnedAttachmentIds={pinnedAttachmentIds}
                  onDownload={handleDownload}
                />
              )}

              {isInfoRequise && isAssigned && !isClosed && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">⏳</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-amber-800">En attente d'informations du client</p>
                    <p className="text-xs text-amber-600 mt-1">Répondez dans la messagerie une fois les détails reçus.</p>
                  </div>
                </div>
              )}

              {/* ══ CORPS ══ */}
              <div className={`grid gap-4 ${agent2Open ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-4'}`}>

                {/* Colonne 1 : Infos + SLA + Actions */}
                <div className="space-y-4 min-w-0">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 min-w-0">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informations</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">Client</p>
                          <p className="text-sm font-medium text-gray-800 truncate">{ticket.createdBy?.firstName} {ticket.createdBy?.lastName}</p>
                          <p className="text-xs text-gray-400 break-all leading-relaxed mt-0.5">{ticket.createdBy?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 min-w-0">
                        <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">Type</p>
                          <p className="text-sm font-medium text-gray-800 break-words">{ticket.type}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 min-w-0">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">Créé le</p>
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {ticket.assignedTo && (
                        <div className="flex items-start gap-3 min-w-0">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400">Technicien</p>
                            <p className="text-sm font-medium text-gray-800 truncate">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SLA */}
                  {ticket.slaDeadline && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 min-w-0">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" /> Gestion SLA
                      </h3>
                      {slaPhaseLabel && (
                        <div className="mb-3 px-2.5 py-1.5 rounded-lg text-xs font-medium break-words"
                             style={{ backgroundColor: ticket.slaPhase === 'PRISE_EN_CHARGE' ? '#f3f4f6' : '#f0fdf4',
                                      color: ticket.slaPhase === 'PRISE_EN_CHARGE' ? '#6b7280' : '#15803d' }}>
                          {slaPhaseLabel}
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500">Statut :</span>
                          {ticket.slaBreached
                            ? <span className="text-xs font-semibold text-red-600">Dépassé</span>
                            : <span className="text-xs font-semibold text-green-600">Dans les temps</span>}
                        </div>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <span className="text-xs text-gray-500 flex-shrink-0">Échéance :</span>
                          <span className="text-xs font-semibold text-gray-800 text-right">
                            {new Date(ticket.slaDeadline).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {slaTimeElapsed && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">Écoulé :</span>
                            <span className="text-xs font-semibold text-gray-800">{slaTimeElapsed}</span>
                          </div>
                        )}
                        {slaTimeLeft && !ticket.slaBreached && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">Restant :</span>
                            <span className="text-xs font-semibold" style={{ color: (slaPercent || 0) >= 80 ? '#ea580c' : '#16a34a' }}>{slaTimeLeft}</span>
                          </div>
                        )}
                        {ticket.slaBreached && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">Retard :</span>
                            <span className="text-xs font-semibold text-red-600">+{formatDuration(new Date() - new Date(ticket.slaDeadline))}</span>
                          </div>
                        )}
                        {slaPercent !== null && (
                          <div className="pt-1">
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="h-2 rounded-full transition-all"
                                   style={{ width: `${Math.min(slaPercent, 100)}%`,
                                            backgroundColor: slaPercent >= 100 ? '#dc2626' : slaPercent >= 80 ? '#ea580c' : '#22c55e' }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-right">{Math.min(slaPercent, 100)}% écoulé</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!isClosed && isAssigned && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Actions</h3>
                      <div className="space-y-2">
                        {!ticket.status?.finalStatus && !isInfoRequise && (
                          <ActionButton onClick={handleDemanderInfos} loading={loadingBtn === 'infos'}
                            loadingLabel="Envoi…" disabled={anyLoading}
                            style={{ backgroundColor: '#fff7ed', borderWidth: '2px', borderStyle: 'solid', borderColor: '#f59e0b', color: '#d97706' }}
                            hoverStyle={{ backgroundColor: '#fef3c7' }}>
                            ⏳ Demander des informations
                          </ActionButton>
                        )}
                        {isInfoRequise && (
                          <ActionButton onClick={handleReprendreTraitement} loading={loadingBtn === 'reprendre'}
                            loadingLabel="Reprise…" disabled={anyLoading}
                            style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                            hoverStyle={{ backgroundColor: '#2563eb' }}>
                            ▶ Reprendre le traitement
                          </ActionButton>
                        )}
                        {!ticket.status?.finalStatus && (
                          <ActionButton onClick={handleResoudre} loading={loadingBtn === 'resoudre'}
                            loadingLabel="Résolution…" disabled={anyLoading}
                            style={{ backgroundColor: '#16a34a', color: '#fff' }}
                            hoverStyle={{ backgroundColor: '#15803d' }}>
                            <CheckCircle className="w-4 h-4" /> Marquer comme résolu
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  )}

                  {!isClosed && !isAssigned && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 min-w-0">
                      <p className="text-sm text-orange-700 font-medium"> Lecture seule</p>
                      <p className="text-xs text-orange-500 mt-1 break-words">
                        Traité par <strong>{ticket.assignedTo?.firstName} {ticket.assignedTo?.lastName}</strong>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Colonnes 2-3 : Description + Messagerie/Historique */}
                <div className={`${agent2Open ? 'lg:col-span-2' : 'lg:col-span-2'} space-y-4 min-w-0`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 min-w-0">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Description du problème</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">{ticket.description}</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 min-w-0">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-4 w-fit max-w-full overflow-x-auto">
                      {['messages', 'history'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap"
                          style={{
                            backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                            color: activeTab === tab ? '#111827' : '#6b7280',
                            boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          }}>
                          {tab === 'messages' ? <MessageSquare className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
                          {tab === 'messages' ? 'Échanges' : 'Historique'}
                          <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                                style={{ backgroundColor: activeTab === tab ? '#f3f4f6' : '#e5e7eb', color: '#6b7280' }}>
                            {tab === 'messages' ? timeline.length : history.length}
                          </span>
                        </button>
                      ))}
                    </div>

                    {activeTab === 'messages' && (
                      <>
                        <div className="space-y-3 mb-4 overflow-y-auto pr-1" style={{ maxHeight: '420px' }}>
                          {timeline.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Aucun message pour le moment</p>
                          ) : timeline.map((item) => {
                            if (item._type === 'attachment') {
                              const isMine      = item.uploadedBy === myEmail;
                              const attIdNum    = Number(item.id);
                              const isAttPinned = !Number.isNaN(attIdNum) && pinnedAttachmentIds.includes(attIdNum);
                              const isLoading   = loadingPinAtt === attIdNum;
                              return (
                                <div key={`att-${item.id}`}>
                                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] min-w-0 rounded-2xl px-3 py-2.5 text-sm border transition-all
                                      ${isAttPinned ? 'border-green-300' : isMine ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}
                                      style={isAttPinned ? { backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' } : {}}>
                                      {isAttPinned && (
                                        <div className="flex items-center gap-1 mb-1.5 pb-1.5" style={{ borderBottom: '1px solid #bbf7d0' }}>
                                          <CheckCircle style={{ width: 11, height: 11, color: '#16a34a', flexShrink: 0 }} />
                                          <span className="text-xs font-bold" style={{ color: '#16a34a' }}>Solution épinglée</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                             style={{ backgroundColor: isAttPinned ? '#dcfce7' : isMine ? '#fff1f1' : '#dbeafe' }}>
                                          <Paperclip className="w-4 h-4" style={{ color: isAttPinned ? '#16a34a' : isMine ? '#E31E24' : '#2563eb' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate"
                                             style={{ color: isAttPinned ? '#15803d' : isMine ? '#b91c1c' : '#1d4ed8' }}>{item.fileName}</p>
                                          <p className="text-xs" style={{ color: isAttPinned ? '#86efac' : isMine ? '#fca5a5' : '#93c5fd' }}>
                                            {new Date(item.uploadedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                        <button onClick={() => handleDownload(item.id, item.fileName)}
                                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition flex-shrink-0"
                                          style={{
                                            backgroundColor: isAttPinned ? '#dcfce7' : isMine ? '#fff1f1' : '#dbeafe',
                                            color: isAttPinned ? '#16a34a' : isMine ? '#E31E24' : '#2563eb',
                                            border: `1px solid ${isAttPinned ? '#86efac' : isMine ? '#fecaca' : '#bfdbfe'}`
                                          }}>
                                          <Eye className="w-3 h-3" /> Ouvrir
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  {isAssigned && !isClosed && (
                                    <div className={`flex mt-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                      {isAttPinned ? (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                                                style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #86efac' }}>
                                            <CheckCircle style={{ width: 11, height: 11 }} /> Solution jointe
                                          </span>
                                          <button onClick={() => handleToggleAttachmentPin(item.id)} disabled={isLoading}
                                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition whitespace-nowrap"
                                            style={{ backgroundColor: '#fff1f1', color: '#E31E24', border: '1px solid #fecaca',
                                                     cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
                                            {isLoading ? <><Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> En cours…</> : <><PinOff style={{ width: 10, height: 10 }} /> Désépingler</>}
                                          </button>
                                        </div>
                                      ) : (
                                        <button onClick={() => handleToggleAttachmentPin(item.id)} disabled={isLoading}
                                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition whitespace-nowrap"
                                          style={{ backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #d1d5db',
                                                   cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
                                          onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.backgroundColor = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.borderColor = '#86efac'; }}}
                                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#d1d5db'; }}>
                                          {isLoading ? <><Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> Épinglage…</> : <><Pin style={{ width: 10, height: 10 }} /> Épingler</>}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            const isMe      = item.authorEmail === myEmail;
                            const itemIdNum = Number(item.id);
                            const isPinned  = pinnedMessageId !== null && !Number.isNaN(itemIdNum) && itemIdNum === pinnedMessageId;
                            return (
                              <div key={`msg-${item.id}`}>
                                <div className={`flex items-center gap-2 mb-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  {!isMe && <span className="text-xs font-semibold text-gray-500 truncate max-w-[120px]">{item.authorName}</span>}
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(item.createdAt).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isMe && <span className="text-xs font-semibold text-gray-500">Vous</span>}
                                </div>
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div
                                    className={`max-w-[85%] min-w-0 rounded-2xl px-4 py-3 text-sm break-words
                                      ${item.interne ? 'bg-yellow-50 border border-yellow-200'
                                        : isPinned ? ''
                                          : isMe ? 'text-white rounded-tr-sm'
                                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'}
                                      ${item._pending ? 'opacity-60' : ''}`}
                                    style={
                                      isPinned
                                        ? { borderLeft: '4px solid #22c55e', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '0 16px 16px 16px' }
                                        : !item.interne && isMe ? { backgroundColor: '#E31E24' } : {}
                                    }>
                                    {item.interne && (
                                      <p className="text-xs font-semibold mb-1.5 text-yellow-600 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Note interne
                                      </p>
                                    )}
                                    {isPinned && (
                                      <div className="flex items-center gap-1.5 mb-2 pb-2" style={{ borderBottom: '1px solid #bbf7d0' }}>
                                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                                        <span className="text-xs font-bold" style={{ color: '#16a34a' }}>Solution officielle épinglée</span>
                                      </div>
                                    )}
                                    <p className={`whitespace-pre-wrap ${item.interne ? 'text-yellow-800' : isPinned ? 'text-green-900' : ''}`}>{item.content}</p>
                                    {item._pending && (
                                      <p className="text-xs mt-1 opacity-60 flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Envoi…
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {isAssigned && !isClosed && !item.interne && !item._pending && (
                                  <div className={`flex mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {isPinned ? (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                                              style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #86efac' }}>
                                          <CheckCircle style={{ width: 11, height: 11 }} /> Solution officielle
                                        </span>
                                        <button onClick={() => handlePinSolution(item.id)} disabled={loadingBtn === 'pin'}
                                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition whitespace-nowrap"
                                          style={{ backgroundColor: '#fff1f1', color: '#E31E24', border: '1px solid #fecaca',
                                                   cursor: loadingBtn === 'pin' ? 'not-allowed' : 'pointer', opacity: loadingBtn === 'pin' ? 0.6 : 1 }}>
                                          {loadingBtn === 'pin' ? <><Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> En cours…</> : <><X style={{ width: 10, height: 10 }} /> Désépingler</>}
                                        </button>
                                      </div>
                                    ) : (
                                      <button onClick={() => handlePinSolution(item.id)} disabled={loadingBtn === 'pin'}
                                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition whitespace-nowrap"
                                        style={{ backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #d1d5db',
                                                 cursor: loadingBtn === 'pin' ? 'not-allowed' : 'pointer', opacity: loadingBtn === 'pin' ? 0.6 : 1 }}
                                        onMouseEnter={e => { if (loadingBtn !== 'pin') { e.currentTarget.style.backgroundColor = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.borderColor = '#86efac'; }}}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#d1d5db'; }}>
                                        {loadingBtn === 'pin' ? <><Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> Épinglage…</> : <>📌 Marquer comme solution</>}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div ref={bottomRef} />
                        </div>

                        {isClosed ? (
                          <div className="border-t border-gray-100 pt-4 flex items-center gap-3 text-gray-400">
                            <ShieldOff className="w-4 h-4 flex-shrink-0" />
                            <p className="text-xs">Ticket clôturé — messagerie désactivée</p>
                          </div>
                        ) : (
                          <div className="border-t border-gray-100 pt-4">
                            {isAssigned ? (
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <button onClick={() => setIsInterne(false)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border whitespace-nowrap"
                                  style={{ backgroundColor: !isInterne ? '#fff1f1' : '#f9fafb', borderColor: !isInterne ? '#E31E24' : '#e5e7eb', color: !isInterne ? '#E31E24' : '#6b7280' }}>
                                  Répondre au client
                                </button>
                                <button onClick={() => setIsInterne(true)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border whitespace-nowrap"
                                  style={{ backgroundColor: isInterne ? '#fef9c3' : '#f9fafb', borderColor: isInterne ? '#ca8a04' : '#e5e7eb', color: isInterne ? '#ca8a04' : '#6b7280' }}>
                                  <Lock className="w-3 h-3" /> Note interne
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-700 mb-3">
                                <Lock className="w-3 h-3" /> Note interne uniquement
                              </div>
                            )}
                            {fichierComment && (
                              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-xl mb-2 min-w-0">
                                <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <p className="text-xs text-blue-700 flex-1 truncate min-w-0">{fichierComment.name}</p>
                                <button onClick={() => { setFichierComment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                  className="text-blue-400 hover:text-blue-600 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                            {sendError && <p className="text-xs text-red-600 mb-2 px-1 break-words">{sendError}</p>}
                            <div className="flex gap-2 min-w-0">
                              <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300 transition flex-shrink-0">
                                <Paperclip className="w-4 h-4" />
                              </button>
                              <input ref={fileInputRef} type="file" className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                onChange={e => setFichierComment(e.target.files[0] || null)} />
                              <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendComment();
                                  }
                                }}
                                placeholder={!isAssigned ? 'Note interne...' : isInterne ? 'Note interne...' : 'Répondre au client...'}
                                rows={2}
                                className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none transition"
                                onFocus={e => e.target.style.borderColor = '#E31E24'}
                                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
                              <button onClick={handleSendComment} disabled={!canSend || sending}
                                className="px-4 rounded-xl text-white transition flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: canSend ? '#E31E24' : '#e5e7eb' }}
                                onMouseEnter={e => { if (canSend) e.currentTarget.style.backgroundColor = '#b81519'; }}
                                onMouseLeave={e => { if (canSend) e.currentTarget.style.backgroundColor = '#E31E24'; }}>
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">Entrée pour envoyer · Shift+Entrée pour sauter une ligne</p>
                          </div>
                        )}
                      </>
                    )}

                    {activeTab === 'history' && (
                      <div className="overflow-y-auto pr-1" style={{ maxHeight: '520px' }}>
                        <HistoryTimeline history={history} loading={historyLoading} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Colonne 4 : Catégorie + Priorité */}
                {!agent2Open && (
                  <div className="space-y-4 min-w-0">
                    {!isClosed && isAssigned ? (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5" /> Catégorie
                        </h3>
                        <div className="space-y-2">
                          {categories.map(c => {
                            const isSelected = ticket.category?.id === c.id;
                            return (
                              <button key={c.id} onClick={() => handleChangeCategory(c.id)} disabled={saving}
                                className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition border-2"
                                style={{ borderColor: isSelected ? (c.color || '#E31E24') : 'transparent', backgroundColor: isSelected ? (c.color || '#E31E24') + '15' : '#f9fafb', color: isSelected ? (c.color || '#E31E24') : '#374151' }}>
                                {isSelected && <span className="mr-2">✓</span>}{c.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5" /> Catégorie
                        </h3>
                        <p className="text-sm font-medium text-gray-800 break-words">{ticket.category?.name}</p>
                      </div>
                    )}

                    {!isClosed && isAssigned ? (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Priorité</h3>
                        <div className="space-y-2">
                          {priorities.map(p => {
                            const ps = priorityStyle[p.name] || { bg: '#f3f4f6', color: '#6b7280' };
                            const isSelected = ticket.priority?.id === p.id;
                            return (
                              <button key={p.id} onClick={() => handleChangePriority(p.id)} disabled={saving}
                                className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition border-2"
                                style={{ borderColor: isSelected ? ps.color : 'transparent', backgroundColor: isSelected ? ps.bg : '#f9fafb', color: isSelected ? ps.color : '#374151' }}>
                                {isSelected && <span className="mr-2">✓</span>}{p.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Priorité</h3>
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full inline-block"
                              style={{ backgroundColor: pStyle.bg, color: pStyle.color }}>
                          {ticket.priority?.name}
                        </span>
                      </div>
                    )}

                    {!isClosed && !isAssigned && (
                      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 min-w-0">
                        <p className="text-sm text-orange-700 font-medium"> Lecture seule</p>
                        <p className="text-xs text-orange-500 mt-1 break-words">
                          Traité par <strong>{ticket.assignedTo?.firstName} {ticket.assignedTo?.lastName}</strong>.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setAgent2Open(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition border-2 border-dashed"
                      style={{ borderColor: '#fecaca', color: '#E31E24', backgroundColor: '#fff1f1' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff1f1'}>
                      <Bot className="w-5 h-5" />
                      Ouvrir Agent IA
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ Panneau Agent2 ══ */}
          {agent2Open && (
            <>
              <div className="lg:hidden fixed inset-0 z-40 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                   onClick={() => setAgent2Open(false)}>
                <div className="absolute inset-x-0 bottom-0 h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
                     onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" style={{ color: '#E31E24' }} />
                      <span className="text-sm font-semibold text-gray-700">Assistant IA Technicien</span>
                    </div>
                    <button onClick={() => setAgent2Open(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Agent2Chat
                      incident={incidentForAgent}
                      ticketAttachments={attachments}
                      onDownloadAttachment={handleDownload}
                      readOnly={!isAssigned}
                    />
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex flex-col flex-shrink-0 w-[380px] xl:w-[420px] min-w-0">
                <div className="sticky top-4 ml-4 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Bot className="w-4 h-4 flex-shrink-0" style={{ color: '#E31E24' }} />
                      <span className="text-sm font-semibold text-gray-700 truncate">Assistant IA Technicien</span>
                    </div>
                    <button onClick={() => setAgent2Open(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <Agent2Chat
                      incident={incidentForAgent}
                      ticketAttachments={attachments}
                      onDownloadAttachment={handleDownload}
                      readOnly={!isAssigned}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </TechnicienLayout>
  );
}