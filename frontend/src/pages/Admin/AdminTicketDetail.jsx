import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Clock, AlertCircle, ShieldAlert, ShieldCheck,
  AlertTriangle, History, RefreshCw, ChevronDown, ChevronUp,
  Tag, Zap, FileText, AlignLeft, User, Activity,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getTicketById, getStatuses, changeStatus, assignTicket,
  updateTicket, getCategories, getPriorities,
} from '../../api/ticketApi';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/axios';

/* ══════════════════════════════════════════════════════════════
   Utilitaires SLA
   ══════════════════════════════════════════════════════════════ */
function formatDuration(ms) {
  const totalMin = Math.round(Math.abs(ms) / 60000);
  const days  = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins  = totalMin % 60;
  if (days > 0)  return hours > 0 ? `${days}j ${hours}h` : `${days}j`;
  if (hours > 0) return mins  > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

function getSlaInfo(ticket) {
  if (!ticket?.slaDeadline || ticket.status?.finalStatus) return { status: 'none' };
  const now      = new Date();
  const deadline = new Date(ticket.slaDeadline);
  const diffMs   = deadline - now;
  const totalMs  = (ticket.slaTotalMinutes || 60) * 60000;
  const percent  = Math.min(100, Math.round(((totalMs - diffMs) / totalMs) * 100));

  if (ticket.slaBreached || diffMs <= 0) {
    const label = ticket.slaPhase === 'PRISE_EN_CHARGE'
      ? `Non pris en charge (+${formatDuration(Math.abs(diffMs))})`
      : `+${formatDuration(Math.abs(diffMs))} de retard`;
    return { status: 'breached', percent: 100, label, deadline: deadline.toLocaleString('fr-FR'), color: '#E31E24', bg: '#fff1f1', border: '#fecaca' };
  }
  const timeLabel = ticket.slaPhase === 'PRISE_EN_CHARGE'
    ? `Prise en charge : ${formatDuration(diffMs)}`
    : `${formatDuration(diffMs)} restantes`;
  if (percent >= 80)
    return { status: 'warning', percent, label: timeLabel, deadline: deadline.toLocaleString('fr-FR'), color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  return { status: 'ok', percent, label: timeLabel, deadline: deadline.toLocaleString('fr-FR'), color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
}

/* ══════════════════════════════════════════════════════════════
   CustomSelect — position:fixed, dropdown jamais coupé
   Identique à TicketForm / AdminUsers
   ══════════════════════════════════════════════════════════════ */
function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen]           = useState(false);
  const [listStyle, setListStyle] = useState({});
  const btnRef = useRef(null);
  const ref    = useRef(null);

  const calcPosition = () => {
    if (!btnRef.current) return;
    const rect       = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    setListStyle({
      position : 'fixed',
      top      : rect.bottom + 4,
      left     : rect.left,
      width    : rect.width,
      zIndex   : 99999,
      maxHeight: Math.min(260, Math.max(80, spaceBelow)),
    });
  };

  useEffect(() => {
    const closeOnOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
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
    if (!open) calcPosition();
    setOpen(o => !o);
  };

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        style={{
          width          : '100%',
          padding        : '9px 36px 9px 12px',
          border         : open ? '1.5px solid #E31E24' : '1.5px solid #e5e7eb',
          borderRadius   : '12px',
          fontSize       : '13px',
          backgroundColor: open ? '#fff' : '#f9fafb',
          outline        : 'none',
          cursor         : 'pointer',
          color          : selected ? '#374151' : '#9ca3af',
          textAlign      : 'left',
          boxShadow      : open ? '0 0 0 3px rgba(227,30,36,0.08)' : 'none',
          transition     : 'all 0.15s',
          display        : 'flex',
          alignItems     : 'center',
          justifyContent : 'space-between',
          boxSizing      : 'border-box',
          fontFamily     : 'inherit',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : (placeholder || 'Sélectionner…')}
        </span>
        {open
          ? <ChevronUp   style={{ width: 14, height: 14, color: '#E31E24', flexShrink: 0 }} />
          : <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0 }} />
        }
      </button>

      {open && (
        <ul style={{
          ...listStyle,
          backgroundColor: '#fff',
          border         : '1.5px solid #E31E24',
          borderRadius   : '12px',
          boxShadow      : '0 8px 24px rgba(0,0,0,0.12)',
          overflowY      : 'auto',
          margin         : 0,
          padding        : '4px 0',
          listStyle      : 'none',
          scrollbarWidth : 'thin',
          scrollbarColor : '#E31E24 #fff1f1',
        }}>
          {options.map(opt => {
            const isActive = String(opt.value) === String(value);
            return (
              <li
                key={String(opt.value)}
                onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                style={{
                  padding        : '9px 14px',
                  fontSize       : '13px',
                  cursor         : 'pointer',
                  backgroundColor: isActive ? '#fff1f1' : 'transparent',
                  color          : isActive ? '#E31E24' : '#374151',
                  fontWeight     : isActive ? 600 : 400,
                  transition     : 'background-color 0.1s',
                  whiteSpace     : 'nowrap',
                  overflow       : 'hidden',
                  textOverflow   : 'ellipsis',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#fafafa'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── RedInput ── */
const RedInput = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    style={{
      width          : '100%',
      padding        : '9px 12px',
      border         : '1.5px solid #e5e7eb',
      borderRadius   : '12px',
      fontSize       : '13px',
      backgroundColor: '#f9fafb',
      outline        : 'none',
      transition     : 'all 0.15s',
      boxSizing      : 'border-box',
      color          : '#111827',
      fontFamily     : 'inherit',
    }}
    onFocus={e => {
      e.target.style.borderColor     = '#E31E24';
      e.target.style.boxShadow       = '0 0 0 3px rgba(227,30,36,0.08)';
      e.target.style.backgroundColor = '#fff';
    }}
    onBlur={e => {
      e.target.style.borderColor     = '#e5e7eb';
      e.target.style.boxShadow       = 'none';
      e.target.style.backgroundColor = '#f9fafb';
    }}
  />
);

/* ── RedTextarea ── */
const RedTextarea = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    style={{
      width          : '100%',
      padding        : '9px 12px',
      border         : '1.5px solid #e5e7eb',
      borderRadius   : '12px',
      fontSize       : '13px',
      backgroundColor: '#f9fafb',
      outline        : 'none',
      transition     : 'all 0.15s',
      resize         : 'none',
      boxSizing      : 'border-box',
      color          : '#111827',
      fontFamily     : 'inherit',
      lineHeight     : 1.6,
    }}
    onFocus={e => {
      e.target.style.borderColor     = '#E31E24';
      e.target.style.boxShadow       = '0 0 0 3px rgba(227,30,36,0.08)';
      e.target.style.backgroundColor = '#fff';
    }}
    onBlur={e => {
      e.target.style.borderColor     = '#e5e7eb';
      e.target.style.boxShadow       = 'none';
      e.target.style.backgroundColor = '#f9fafb';
    }}
  />
);

/* ── FieldLabel ── */
const FieldLabel = ({ icon: Icon, text, required: req }) => (
  <label style={{
    display      : 'block',
    fontSize     : '11px',
    fontWeight   : 600,
    color        : '#6b7280',
    marginBottom : '5px',
    letterSpacing: '0.02em',
  }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {Icon && <Icon style={{ width: 11, height: 11, color: '#E31E24' }} />}
      {text}
      {req && <span style={{ color: '#E31E24' }}>*</span>}
    </span>
  </label>
);

/* ══════════════════════════════════════════════════════════════
   Historique
   ══════════════════════════════════════════════════════════════ */
const ACTION_CONFIG = {
  TICKET_CREATED:     { label: 'Ticket créé',           color: '#6b7280', bg: '#f3f4f6', icon: '🎫' },
  TICKET_UPDATED:     { label: 'Ticket modifié',         color: '#6b7280', bg: '#f3f4f6', icon: '✏️' },
  TICKET_RESOLVED:    { label: 'Ticket résolu',          color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  TICKET_CLOSED:      { label: 'Ticket clôturé',         color: '#6b7280', bg: '#f3f4f6', icon: '🔒' },
  STATUS_CHANGED:     { label: 'Statut modifié',         color: '#3b82f6', bg: '#eff6ff', icon: '🔄' },
  PRIORITY_CHANGED:   { label: 'Priorité modifiée',      color: '#ea580c', bg: '#fff7ed', icon: '⚡' },
  CATEGORY_CHANGED:   { label: 'Catégorie modifiée',     color: '#8b5cf6', bg: '#f5f3ff', icon: '🏷️' },
  ASSIGNED:           { label: 'Ticket assigné',         color: '#0891b2', bg: '#ecfeff', icon: '👤' },
  UNASSIGNED:         { label: 'Assignation retirée',    color: '#dc2626', bg: '#fef2f2', icon: '👤' },
  REASSIGNED:         { label: 'Ticket réassigné',       color: '#0891b2', bg: '#ecfeff', icon: '🔀' },
  SLA_BREACHED:       { label: 'SLA dépassé',            color: '#dc2626', bg: '#fef2f2', icon: '🚨' },
  SLA_ESCALATED:      { label: 'Escalade SLA',           color: '#dc2626', bg: '#fef2f2', icon: '📈' },
  SLA_RESET:          { label: 'SLA réinitialisé',       color: '#16a34a', bg: '#f0fdf4', icon: '🔁' },
  COMMENT_ADDED:      { label: 'Commentaire ajouté',     color: '#6b7280', bg: '#f9fafb', icon: '💬' },
  NOTE_INTERNE_ADDED: { label: 'Note interne ajoutée',   color: '#ca8a04', bg: '#fefce8', icon: '🔐' },
  ATTACHMENT_ADDED:   { label: 'Pièce jointe ajoutée',   color: '#2563eb', bg: '#eff6ff', icon: '📎' },
  ADMIN_INTERVENTION: {label: 'Intervention admin — SLA dépassé',color: '#7c3aed',bg: '#f5f3ff',icon: '🛡️'},
};

function HistoryTimeline({ history, loading , ticketId }) {
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
          const cfg    = ACTION_CONFIG[entry.action] || { label: entry.actionLabel, color: '#6b7280', bg: '#f3f4f6', icon: '•' };
          const isLast = idx === history.length - 1;
          return (
            <div key={entry.id} className="relative flex gap-3 pl-1">
              <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm z-10 border-2 border-white shadow-sm"
                   style={{ backgroundColor: cfg.bg }}>
                <span style={{ fontSize: '13px', lineHeight: 1 }}>{cfg.icon}</span>
              </div>
              <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-3'}`}>
                <div className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(entry.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white flex-shrink-0"
                         style={{ backgroundColor: '#E31E24', fontSize: '9px' }}>
                      {entry.performedBy?.firstName?.[0]}{entry.performedBy?.lastName?.[0]}
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {entry.performedBy?.firstName} {entry.performedBy?.lastName}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400 capitalize">
                      {entry.performedBy?.role?.toLowerCase()}
                    </span>
                  </div>
                 {(entry.oldValue || entry.newValue) && (
  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
    {entry.oldValue && (
      <span className="text-xs px-2 py-0.5 rounded-md bg-red-50 text-red-500 line-through">
        {entry.oldValue}
      </span>
    )}
    {entry.oldValue && entry.newValue && (
      <span className="text-xs text-gray-400">→</span>
    )}
    {entry.newValue && (
      <span className="text-xs px-2 py-0.5 rounded-md bg-green-50 text-green-700 font-medium">
        {entry.newValue}
      </span>
    )}
    {entry.attachmentId && (
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  const url = `/api/tickets/${ticketId}/attachments/${entry.attachmentId}/download`;
                  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                    .then(r => r.blob())
                    .then(blob => {
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = entry.attachmentName || 'fichier';
                      a.click();
                      URL.revokeObjectURL(a.href);
                    });
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Page principale
   ══════════════════════════════════════════════════════════════ */
export default function AdminTicketDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { settings } = useSettings();
  const prefix       = settings?.ticketPrefix || 'TKT';

  const [ticket,         setTicket]         = useState(null);
  const [statuses,       setStatuses]       = useState([]);
  const [techniciens,    setTechniciens]    = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [priorities,     setPriorities]     = useState([]);
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [editMode,       setEditMode]       = useState(location.state?.editMode === true);
  const [assignError,    setAssignError]    = useState('');
  const [saving,         setSaving]         = useState(false);
  const [editForm,       setEditForm]       = useState({
    title: '', description: '', categoryId: '', priorityId: '',
  });

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await api.get(`/tickets/${id}/history`);
      setHistory(r.data);
    } catch (e) { console.error(e); setHistory([]); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, statusRes, techRes, catRes, priRes] = await Promise.all([
          getTicketById(id),
          getStatuses(),
          api.get('/admin/users'),
          getCategories(),
          getPriorities(),
        ]);
        setTicket(ticketRes.data);
        setStatuses(statusRes.data);
        setTechniciens(techRes.data.filter(u => u.role === 'TECHNICIEN'));
        setCategories(catRes.data);
        setPriorities(priRes.data);
        setEditForm({
          title:       ticketRes.data.title,
          description: ticketRes.data.description,
          categoryId:  ticketRes.data.category.id,
          priorityId:  ticketRes.data.priority.id,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
    fetchHistory();
  }, [id]);

  const handleChangeStatus = async (statusId) => {
    try {
      const res = await changeStatus(ticket.id, statusId);
      setTicket(res.data);
      await fetchHistory();
    } catch (e) { console.error(e); }
  };

  const handleAssign = async (techId) => {
    setAssignError('');
    try {
      const res = await assignTicket(ticket.id, techId);
      setTicket(res.data);
      await fetchHistory();
    } catch (e) {
      setAssignError(e.response?.data || "Erreur lors de l'assignation");
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await updateTicket(ticket.id, {
        title:       editForm.title,
        description: editForm.description,
        categoryId:  Number(editForm.categoryId),
        priorityId:  Number(editForm.priorityId),
      });
      setTicket(res.data);
      setEditMode(false);
      await fetchHistory();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  /* Options CustomSelect */
  const statusOptions     = statuses.map(s => ({ value: s.id, label: s.name }));
  const technicienOptions = [
    { value: '', label: 'Non assigné' },
    ...techniciens.map(t => ({
      value: t.id,
      label: `${t.firstName} ${t.lastName}${t.specialtyCategory ? ` — ${t.specialtyCategory.name}` : ''}`,
    })),
  ];
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const priorityOptions = priorities.map(p => ({
    value: p.id,
    label: `${p.name}${p.slaHours ? ` (${p.slaHours}h SLA)` : ''}`,
  }));

  const statusColors = {
    'Nouveau':  'bg-gray-100 text-gray-700',
    'En cours': 'bg-blue-100 text-blue-700',
    'Résolu':   'bg-green-100 text-green-700',
    'Fermé':    'bg-red-100 text-red-700',
  };

  const priorityStyle = {
    'Critique': { bg: '#fef2f2', text: '#E31E24', border: '#fecaca' },
    'Haute':    { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    'Moyenne':  { bg: '#fefce8', text: '#ca8a04', border: '#fde68a' },
    'Basse':    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: '#E31E24', borderTopColor: 'transparent' }} />
      </div>
    </AdminLayout>
  );

  if (!ticket) return (
    <AdminLayout>
      <div className="text-center py-20 text-gray-500">Ticket introuvable</div>
    </AdminLayout>
  );

  const priority      = priorityStyle[ticket.priority.name] || priorityStyle['Basse'];
  const sla           = getSlaInfo(ticket);
  const slaPhaseLabel = ticket.slaPhase === 'PRISE_EN_CHARGE'
    ? `Phase 1 — Prise en charge (${ticket.priority?.escaladeMinutes ?? ticket.slaTotalMinutes} min)`
    : ticket.slaPhase === 'TRAITEMENT'
      ? `Phase 2 — Traitement (${ticket.priority?.slaHours}h)`
      : null;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">

        {/* ── Navigation ── */}
        <button
          onClick={() => navigate('/admin/tickets')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Retour aux tickets
        </button>

        {/* ── En-tête ticket ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-gray-400">
                  #{prefix}-{String(ticket.id).padStart(3, '0')}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ticket.status.name] || 'bg-gray-100 text-gray-700'}`}>
                  {ticket.status.name}
                </span>
                {sla.status === 'breached' && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> SLA dépassé
                  </span>
                )}
                {sla.status === 'warning' && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> SLA à risque
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0"
                   style={{ backgroundColor: priority.bg, color: priority.text, border: `1px solid ${priority.border}` }}>
                <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                {ticket.priority.name}
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-sm px-4 py-2 rounded-xl font-medium transition cursor-pointer"
                style={{ backgroundColor: editMode ? '#f3f4f6' : '#E31E24', color: editMode ? '#374151' : '#fff' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = editMode ? '#e5e7eb' : '#b81519'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = editMode ? '#f3f4f6' : '#E31E24'}>
                {editMode ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>

          {/* ── Formulaire d'édition ── */}
          {editMode ? (
            <div style={{
              backgroundColor: '#f9fafb',
              border         : '1.5px solid #f3f4f6',
              borderRadius   : 14,
              padding        : '18px 20px 20px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Titre */}
                <div>
                  <FieldLabel icon={FileText} text="Titre" required />
                  <RedInput
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Titre du ticket"
                  />
                </div>

                {/* Description */}
                <div>
                  <FieldLabel icon={AlignLeft} text="Description" />
                  <RedTextarea
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Décrivez le problème..."
                    rows={4}
                  />
                </div>

                {/* Catégorie + Priorité */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <FieldLabel icon={Tag} text="Catégorie" required />
                    <CustomSelect
                      value={editForm.categoryId}
                      onChange={val => setEditForm({ ...editForm, categoryId: val })}
                      options={categoryOptions}
                      placeholder="-- Catégorie --"
                    />
                  </div>
                  <div>
                    <FieldLabel icon={Zap} text="Priorité" required />
                    <CustomSelect
                      value={editForm.priorityId}
                      onChange={val => setEditForm({ ...editForm, priorityId: val })}
                      options={priorityOptions}
                      placeholder="-- Priorité --"
                    />
                  </div>
                </div>

                {/* Bouton Sauvegarder */}
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  style={{
                    width          : '100%',
                    padding        : '10px',
                    backgroundColor: saving ? '#f87171' : '#E31E24',
                    border         : 'none',
                    borderRadius   : 12,
                    fontSize       : 13,
                    fontWeight     : 600,
                    color          : '#fff',
                    cursor         : saving ? 'not-allowed' : 'pointer',
                    transition     : 'background-color 0.15s',
                    display        : 'flex',
                    alignItems     : 'center',
                    justifyContent : 'center',
                    gap            : 8,
                    fontFamily     : 'inherit',
                  }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#b81519'; }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = '#E31E24'; }}
                >
                  {saving ? (
                    <>
                      <span style={{
                        width         : 14, height        : 14,
                        border        : '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff',
                        borderRadius  : '50%',
                        display       : 'inline-block',
                        animation     : 'spin 0.7s linear infinite',
                      }} />
                      Enregistrement…
                    </>
                  ) : 'Sauvegarder les modifications'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Méta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Catégorie</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ticket.category.color }} />
                <p className="text-sm font-medium text-gray-700">{ticket.category.name}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Créé par</p>
              <p className="text-sm font-medium text-gray-700">
                {ticket.createdBy.firstName} {ticket.createdBy.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Assigné à</p>
              <p className="text-sm font-medium text-gray-700">
                {ticket.assignedTo
                  ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                  : <span className="text-gray-400 italic">Non assigné</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">SLA total</p>
              <p className="text-sm font-medium text-gray-700">{ticket.priority.slaHours}h</p>
            </div>
          </div>
        </div>

        {/* ── Bloc SLA ── */}
        {sla.status !== 'none' && (
          <div className="rounded-2xl border shadow-sm p-6 mb-4"
               style={{ backgroundColor: sla.bg, borderColor: sla.border }}>
            {slaPhaseLabel && (
              <div className="mb-3 text-xs font-medium px-2.5 py-1.5 rounded-lg inline-block"
                   style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: sla.color }}>
                {slaPhaseLabel}
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {sla.status === 'breached' && <ShieldAlert className="w-5 h-5" style={{ color: sla.color }} />}
                {sla.status === 'warning'  && <AlertTriangle className="w-5 h-5" style={{ color: sla.color }} />}
                {sla.status === 'ok'       && <ShieldCheck className="w-5 h-5" style={{ color: sla.color }} />}
                <h2 className="text-base font-semibold" style={{ color: sla.color }}>
                  {sla.status === 'breached' && 'SLA dépassé'}
                  {sla.status === 'warning'  && 'SLA à risque'}
                  {sla.status === 'ok'       && 'SLA en cours'}
                </h2>
              </div>
              <span className="text-sm font-bold" style={{ color: sla.color }}>{sla.label}</span>
            </div>
            <div className="w-full rounded-full h-3 mb-3 overflow-hidden"
                 style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}>
              <div className="h-3 rounded-full transition-all duration-500"
                   style={{ width: `${sla.percent}%`, backgroundColor: sla.color }} />
            </div>
            <div className="flex items-center justify-between text-xs"
                 style={{ color: sla.color, opacity: 0.8 }}>
              <span>Début SLA</span>
              <span>{sla.percent}% écoulé</span>
              <span>Deadline : {sla.deadline}</span>
            </div>
          </div>
        )}

        {ticket.slaDeadline === null && !ticket.status?.finalStatus && (
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 mb-4">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              SLA non démarré — le compteur démarre quand un technicien prend en charge le ticket
            </p>
          </div>
        )}

        {/* ── Actions Admin — CustomSelect rouge ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ backgroundColor: '#fff1f1' }}>
              <Activity className="w-4 h-4" style={{ color: '#E31E24' }} />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Actions administrateur</h2>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={Activity} text="Changer le statut" />
              <CustomSelect
                value={ticket.status.id}
                onChange={val => handleChangeStatus(val)}
                options={statusOptions}
                placeholder="-- Statut --"
              />
            </div>
            <div>
              <FieldLabel icon={User} text="Assigner à un technicien" />
              <CustomSelect
                value={ticket.assignedTo?.id || ''}
                onChange={val => handleAssign(val)}
                options={technicienOptions}
                placeholder="Non assigné"
              />
              {assignError && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{assignError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Suivi de l'avancement ── */}
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
                         style={{
                           backgroundColor: isPassed ? '#E31E24' : '#f3f4f6',
                           borderColor    : isPassed ? '#E31E24' : '#e5e7eb',
                           color          : isPassed ? '#fff'    : '#9ca3af',
                         }}>
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

        {/* ── Dates ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex items-center gap-6 text-xs text-gray-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Créé le {new Date(ticket.createdAt).toLocaleString('fr-FR')}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Mis à jour le {new Date(ticket.updatedAt).toLocaleString('fr-FR')}
            </div>
            {ticket.slaDeadline && (
              <div className="flex items-center gap-1.5"
                   style={{ color: sla.status === 'breached' ? '#E31E24' : '#6b7280' }}>
                <AlertCircle className="w-3.5 h-3.5" />
                Deadline SLA : {new Date(ticket.slaDeadline).toLocaleString('fr-FR')}
              </div>
            )}
          </div>
        </div>

        {/* ── Historique ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                   style={{ backgroundColor: '#fff1f1' }}>
                <History className="w-4 h-4" style={{ color: '#E31E24' }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Historique complet</h2>
                <p className="text-xs text-gray-400">
                  {history.length} événement{history.length > 1 ? 's' : ''} enregistré{history.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
          <HistoryTimeline history={history} loading={historyLoading} ticketId={id} />
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
