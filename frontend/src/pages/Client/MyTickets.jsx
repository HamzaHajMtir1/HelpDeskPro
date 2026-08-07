import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, RefreshCw, Ticket, Eye, Paperclip,
  Pencil, X, Trash2, Clock, AlertTriangle, Lock,
  ChevronDown, ChevronUp, Tag, FileText, Send, ArrowLeft,
  Filter, Search,
} from 'lucide-react';
import ClientLayout from '../../layouts/ClientLayout';
import {
  getMyTickets, updateTicket, getCategories, getPriorities,
  getAttachments, uploadAttachment
} from '../../api/ticketApi';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/axios';

const RED      = '#E31E24';
const RED_DARK = '#b81519';
const DELETABLE_STATUS = 'Nouveau';

/* ══════════════════════════════════════════════════════════════
   CustomSelect — createPortal, dropdown jamais coupé
   ══════════════════════════════════════════════════════════════ */
const CustomSelect = ({ value, onChange, options, placeholder, minWidth = 160 }) => {
  const [open, setOpen]         = useState(false);
  const [dropStyle, setDropStyle] = useState({});
  const btnRef = useRef(null);
  const ref    = useRef(null);

  const updatePosition = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setDropStyle({
      position : 'fixed',
      top      : r.bottom + 4,
      left     : r.left,
      width    : Math.max(r.width, minWidth),
      zIndex   : 99999,
      maxHeight: Math.min(260, Math.max(80, window.innerHeight - r.bottom - 12)),
    });
  };

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const u = () => updatePosition();
    window.addEventListener('scroll', u, true);
    window.addEventListener('resize', u);
    return () => { window.removeEventListener('scroll', u, true); window.removeEventListener('resize', u); };
  }, [open]);

  const selected = options.find(o => String(o.value) === String(value));
  const hasVal   = selected && String(selected.value) !== '';

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none', minWidth }}>
      <button ref={btnRef} type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 10px', background: '#fff',
        border: open ? `1.5px solid ${RED}` : '1.5px solid #e5e7eb',
        borderRadius: 10, fontSize: 12, fontWeight: hasVal ? 600 : 400,
        color: hasVal ? RED : '#6b7280', cursor: 'pointer', outline: 'none',
        boxShadow: open ? `0 0 0 3px rgba(227,30,36,.08)` : 'none',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}>
        {hasVal && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: RED, flexShrink: 0 }} />}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected ? selected.label : (placeholder || 'Sélectionner…')}
        </span>
        {open
          ? <ChevronUp   style={{ width: 12, height: 12, color: RED,       flexShrink: 0 }} />
          : <ChevronDown style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />}
      </button>

      {open && createPortal(
        <ul style={{
          ...dropStyle,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,.10)',
          overflowY: 'auto', margin: 0, padding: '4px', listStyle: 'none', scrollbarWidth: 'thin',
        }}>
          {options.map(opt => {
            const isA = String(opt.value) === String(value);
            return (
              <li key={opt.value}
                onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                style={{
                  padding: '7px 10px', borderRadius: 6, fontSize: 12,
                  fontWeight: isA ? 600 : 400, cursor: 'pointer',
                  backgroundColor: isA ? '#fff1f1' : 'transparent',
                  color: isA ? RED : String(opt.value) === '' ? '#9ca3af' : '#374151',
                }}
                onMouseEnter={e => { if (!isA) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={e => { if (!isA) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                {opt.label}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
};

const RedInput = ({ value, onChange, placeholder, type = 'text', required }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box', color: '#111827', fontFamily: 'inherit' }}
    onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = '0 0 0 3px rgba(227,30,36,0.08)'; e.target.style.backgroundColor = '#fff'; }}
    onBlur={e =>  { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#f9fafb'; }}
  />
);

const FieldLabel = ({ icon: Icon, text, required: req, optional }) => (
  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', letterSpacing: '0.01em' }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {Icon && <Icon style={{ width: 12, height: 12, color: RED }} />}
      {text}
      {req     && <span style={{ color: RED }}>*</span>}
      {optional && <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12 }}>(optionnel)</span>}
    </span>
  </label>
);

function IconBtn({ onClick, title, icon: Icon, color, hoverBg, disabled = false, dimmed = false }) {
  return (
    <div className="relative group">
      <button onClick={onClick} disabled={disabled} title={title}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
        style={{ color: dimmed ? '#d1d5db' : color, backgroundColor: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer' }}
        onMouseEnter={e => { if (!disabled && !dimmed) e.currentTarget.style.backgroundColor = hoverBg; }}
        onMouseLeave={e => { if (!disabled && !dimmed) e.currentTarget.style.backgroundColor = 'transparent'; }}>
        <Icon className="w-4 h-4" />
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg">
        {title}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}

const STATUS_OPTS   = [{ value: '', label: 'Tous les statuts' }, { value: 'Nouveau', label: 'Nouveau' }, { value: 'En cours', label: 'En cours' }, { value: 'Information requise', label: 'Information requise' }, { value: 'Résolu', label: 'Résolu' }, { value: 'Fermé', label: 'Fermé' }];
const PRIORITY_OPTS = [{ value: '', label: 'Toutes les priorités' }, { value: 'Critique', label: 'Critique' }, { value: 'Haute', label: 'Haute' }, { value: 'Moyenne', label: 'Moyenne' }, { value: 'Basse', label: 'Basse' }];

export default function MyTickets() {
  const { settings } = useSettings();
  const prefix = settings?.ticketPrefix || 'TKT';

  const [tickets,           setTickets]           = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [search,            setSearch]            = useState('');
  const [filterStatus,      setFilterStatus]      = useState('');
  const [filterPriority,    setFilterPriority]    = useState('');
  const [editTicket,        setEditTicket]        = useState(null);
  const [categories,        setCategories]        = useState([]);
  const [priorities,        setPriorities]        = useState([]);
  const [form,              setForm]              = useState({ title: '', description: '', categoryId: '', priorityId: '', type: 'INCIDENT' });
  const [saving,            setSaving]            = useState(false);
  const [attachmentsMap,    setAttachmentsMap]    = useState({});
  const [ticketAttachments, setTicketAttachments] = useState([]);
  const [newFichier,        setNewFichier]        = useState(null);
  const [confirmDeleteId,   setConfirmDeleteId]   = useState(null);
  const [deleting,          setDeleting]          = useState(false);
  const [deleteError,       setDeleteError]       = useState(null);
  const [animKey,           setAnimKey]           = useState(0);

  const navigate = useNavigate();
  const canDelete = ticket => ticket.status.name.trim().toLowerCase() === DELETABLE_STATUS.toLowerCase();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await getMyTickets();
      setTickets(data);
      const map = {};
      await Promise.all(data.map(async t => {
        try { const res = await getAttachments(t.id); map[t.id] = res.data; }
        catch { map[t.id] = []; }
      }));
      setAttachmentsMap(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setAnimKey(k => k + 1); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const filtered = tickets.filter(t => {
    if (filterStatus   && t.status.name   !== filterStatus)   return false;
    if (filterPriority && t.priority.name !== filterPriority) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!t.title?.toLowerCase().includes(q) &&
          !`${t.createdBy?.firstName ?? ''} ${t.createdBy?.lastName ?? ''}`.toLowerCase().includes(q) &&
          !String(t.id).includes(q)) return false;
    }
    return true;
  });

  const hasFilter = filterStatus || filterPriority || search.trim();

  const openEdit = async (e, ticket) => {
    e.stopPropagation();
    try {
      const [catRes, priRes, attachRes] = await Promise.all([getCategories(), getPriorities(), getAttachments(ticket.id)]);
      setCategories(catRes.data); setPriorities(priRes.data); setTicketAttachments(attachRes.data);
    } catch (e) { console.error(e); }
    setForm({ title: ticket.title, description: ticket.description, categoryId: ticket.category.id, priorityId: ticket.priority.id, type: ticket.type || 'INCIDENT' });
    setNewFichier(null); setEditTicket(ticket);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTicket(editTicket.id, form);
      if (newFichier) { try { await uploadAttachment(editTicket.id, newFichier); } catch (e) { console.warn('Upload échoué:', e); } }
      setEditTicket(null); fetchTickets();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId || deleting) return;
    const t = tickets.find(t => t.id === confirmDeleteId);
    if (!t || !canDelete(t)) { setDeleteError('Ce ticket ne peut pas être supprimé dans son état actuel.'); return; }
    setDeleting(true); setDeleteError(null);
    try {
      await api.delete(`/tickets/${confirmDeleteId}`);
      setConfirmDeleteId(null); setDeleteError(null); fetchTickets();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || 'Une erreur est survenue.';
      setDeleteError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally { setDeleting(false); }
  };

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name + (c.slaHours ? ` — ${c.slaHours}h` : '') }));
  const priorityOptions = priorities.map(p => ({ value: p.id, label: p.name }));

  const statusConfig = {
    'Nouveau':               { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
    'En cours':              { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
    'Résolu':                { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
    'Fermé':                 { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
    'Information requise':   { bg: '#fef9c3', text: '#a16207', dot: '#eab308' },
    'Informations requises': { bg: '#fef9c3', text: '#a16207', dot: '#eab308' },
  };

  const priorityConfig = {
    'Critique': { bg: '#fee2e2', text: '#dc2626' },
    'Haute':    { bg: '#ffedd5', text: '#ea580c' },
    'Moyenne':  { bg: '#fef9c3', text: '#ca8a04' },
    'Basse':    { bg: '#f3f4f6', text: '#6b7280'  },
  };

  const slaBreachedCount = tickets.filter(t => t.slaBreached).length;

  return (
    <ClientLayout>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(22px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .mt-header  { animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.04s both; }
        .mt-filters { animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.18s both; }
        .mt-table   { animation: fadeSlideUp 0.50s cubic-bezier(0.22,1,0.36,1) 0.28s both; }
        .mt-row-0  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.32s both; }
        .mt-row-1  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.38s both; }
        .mt-row-2  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.44s both; }
        .mt-row-3  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.50s both; }
        .mt-row-4  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.56s both; }
        .mt-row-5  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.62s both; }
        .mt-row-6  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.68s both; }
        .mt-row-7  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.74s both; }
        .mt-row-8  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.80s both; }
        .mt-row-9  { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.86s both; }
        .mt-row-10 { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.92s both; }
        .mt-row-11 { animation: fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.98s both; }
        .mt-btn-refresh { transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .mt-btn-refresh:hover { transform: rotate(12deg) scale(1.08) !important; background-color: #f3f4f6 !important; }
        .mt-btn-new { transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .mt-btn-new:hover { transform: translateY(-2px) scale(1.03) !important; box-shadow: 0 8px 22px rgba(227,30,36,0.32) !important; }
        .row-base   { transition: background-color 0.15s ease !important; }
        .row-breach { transition: background-color 0.15s ease !important; }
        .row-base:hover   { background: #f9fafb !important; }
        .row-breach:hover { background: #fff0f0 !important; }
        .search-input:focus { outline: none; }
        .search-input::placeholder { color: #b0b7c3; }
      `}</style>

      {/* ══ Modal suppression ══ */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => !deleting && (setConfirmDeleteId(null), setDeleteError(null))}>
          <div className="bg-white rounded-3xl shadow-2xl w-full mx-4 overflow-hidden"
            style={{ maxWidth: '480px', animation: 'fadeSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ height: '5px', background: `linear-gradient(90deg, ${RED}, #ff6b6b)` }} />
            <div className="flex justify-end px-5 pt-4">
              <button onClick={() => { if (!deleting) { setConfirmDeleteId(null); setDeleteError(null); } }} disabled={deleting}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-8 pb-8 pt-1">
              <div className="flex flex-col items-center text-center gap-4 mb-7">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner"
                  style={{ background: 'linear-gradient(135deg, #fff1f1 0%, #ffe4e4 100%)', border: '1.5px solid #fecaca' }}>
                  <Trash2 className="w-9 h-9" style={{ color: RED }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Supprimer ce ticket ?</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Le ticket{' '}
                    <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-xs mx-0.5"
                      style={{ backgroundColor: '#fff1f1', color: RED, border: '1px solid #fecaca' }}>
                      #{prefix}-{String(confirmDeleteId).padStart(3, '0')}
                    </span>{' '}
                    sera définitivement supprimé.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-4"
                style={{ backgroundColor: '#fff8f8', border: '1.5px solid #fecaca' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#fee2e2' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: RED }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Action irréversible</p>
                  <p className="text-xs text-red-600 leading-relaxed">Tout l'historique, les commentaires et les pièces jointes associés seront définitivement perdus.</p>
                </div>
              </div>
              {deleteError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-4 text-center">⚠️ {deleteError}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} disabled={deleting}
                  className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-3 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: deleting ? 'linear-gradient(135deg, #f87171, #fca5a5)' : `linear-gradient(135deg, ${RED}, #c41118)` }}>
                  {deleting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Suppression...</>
                    : <><Trash2 className="w-4 h-4" /> Supprimer définitivement</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal modification ══ */}
      {editTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={() => !saving && setEditTicket(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.18)', width: '100%', maxWidth: '640px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeSlideUp 0.40s cubic-bezier(0.22,1,0.36,1) both' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 28px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
              <button type="button" onClick={() => !saving && setEditTicket(null)}
                style={{ padding: 8, border: '1.5px solid #e5e7eb', borderRadius: 10, backgroundColor: '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280', transition: 'all 0.15s', flexShrink: 0 }}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#111827'; } }}
                onMouseLeave={e => { if (!saving) { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#6b7280'; } }}>
                <ArrowLeft style={{ width: 18, height: 18 }} />
              </button>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Modifier #{prefix}-{String(editTicket.id).padStart(3, '0')}</h2>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>{editTicket.title}</p>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '24px 28px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <FieldLabel text="Titre" req />
                  <RedInput placeholder="Ex : Impossible d'accéder au serveur" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <FieldLabel text="Type de ticket" req />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {['INCIDENT', 'DEMANDE'].map(t => {
                      const active = form.type === t;
                      return (
                        <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '14px 16px', borderRadius: 12, border: `2px solid ${active ? RED : '#e5e7eb'}`, backgroundColor: active ? '#fff1f1' : '#f9fafb', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: active ? RED : '#374151' }}>{t === 'INCIDENT' ? 'Incident' : 'Demande'}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>{t === 'INCIDENT' ? 'Quelque chose ne fonctionne pas' : 'Une nouvelle demande de service'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><FieldLabel icon={Tag} text="Catégorie" req /><CustomSelect value={form.categoryId} onChange={val => setForm({ ...form, categoryId: Number(val) })} options={categoryOptions} placeholder="Choisir une catégorie" /></div>
                  <div><FieldLabel icon={AlertTriangle} text="Priorité" req /><CustomSelect value={form.priorityId} onChange={val => setForm({ ...form, priorityId: Number(val) })} options={priorityOptions} placeholder="Choisir une priorité" /></div>
                </div>
                <div>
                  <FieldLabel text="Description" req />
                  <textarea placeholder="Décrivez le problème en détail…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none', transition: 'all 0.15s', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827', lineHeight: 1.6 }}
                    onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = '0 0 0 3px rgba(227,30,36,0.08)'; e.target.style.backgroundColor = '#fff'; }}
                    onBlur={e =>  { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#f9fafb'; }} />
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{form.description.length} caractères</p>
                </div>
                {ticketAttachments.length > 0 && (
                  <div>
                    <FieldLabel icon={Paperclip} text="Fichiers joints existants" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {ticketAttachments.map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Paperclip style={{ width: 16, height: 16, color: '#3b82f6' }} />
                          </div>
                          <p style={{ fontSize: 13, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, fontWeight: 500 }}>{a.fileName}</p>
                          <a href={`https://helpdesk.4d-gile.com/api/tickets/${editTicket?.id}/attachments/${a.id}/download`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500, padding: '4px 8px', borderRadius: 6, backgroundColor: '#eff6ff', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#eff6ff'}>
                            <Eye style={{ width: 12, height: 12 }} /> Voir
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <FieldLabel icon={Paperclip} text="Pièce jointe" optional />
                  {!newFichier ? (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: 100, border: '2px dashed #e5e7eb', borderRadius: 12, cursor: 'pointer', backgroundColor: '#f9fafb', transition: 'all 0.15s', gap: 6, boxSizing: 'border-box' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.backgroundColor = 'rgba(227,30,36,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#f9fafb'; }}>
                      <Paperclip style={{ width: 22, height: 22, color: '#9ca3af' }} />
                      <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Cliquez pour ajouter un fichier</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>PDF, PNG, JPG, DOCX — max 10 MB</p>
                      <input type="file" style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={e => setNewFichier(e.target.files[0] || null)} />
                    </label>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText style={{ width: 18, height: 18, color: '#16a34a' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#15803d', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{newFichier.name}</p>
                        <p style={{ fontSize: 11, color: '#16a34a', margin: 0 }}>{(newFichier.size / 1024).toFixed(1)} Ko</p>
                      </div>
                      <button type="button" onClick={() => setNewFichier(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: '#16a34a', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dcfce7'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <X style={{ width: 15, height: 15 }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, padding: '16px 28px 20px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
              <button type="button" onClick={() => !saving && setEditTicket(null)} disabled={saving}
                style={{ flex: 1, padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontWeight: 500, color: '#6b7280', backgroundColor: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = '#fff'; }}>
                Annuler
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: '10px', backgroundColor: saving ? '#f87171' : RED, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.85 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = RED_DARK; }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = RED; }}>
                {saving
                  ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Enregistrement…</>
                  : <><Send style={{ width: 14, height: 14 }} /> Enregistrer les modifications</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ En-tête ══ */}
      <div className="mt-header flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes tickets</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-500">{filtered.length} ticket{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}</p>
            {slaBreachedCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="w-3 h-3" />{slaBreachedCount} SLA dépassé{slaBreachedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTickets} className="mt-btn-refresh flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button onClick={() => navigate('/tickets/new')} className="mt-btn-new flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
            style={{ backgroundColor: RED }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = RED_DARK}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = RED}>
            <PlusCircle className="w-4 h-4" /> Nouveau ticket
          </button>
        </div>
      </div>

      {/* ══ Filtres ══ */}
      <div className="mt-filters" style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.04)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
            <Filter style={{ width: 12, height: 12 }} /> Filtres
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: search.trim() ? RED : '#9ca3af', pointerEvents: 'none', transition: 'color 0.15s' }} />
            <input className="search-input" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un ticket…"
              style={{ paddingLeft: 28, paddingRight: search ? 28 : 10, paddingTop: 7, paddingBottom: 7, width: 200, border: search.trim() ? `1.5px solid ${RED}` : '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 12, color: '#374151', background: '#fff', boxShadow: search.trim() ? `0 0 0 3px rgba(227,30,36,.08)` : 'none', transition: 'all 0.15s' }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9ca3af' }}
                onMouseEnter={e => e.currentTarget.style.color = RED}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>
          <CustomSelect value={filterStatus}   onChange={setFilterStatus}   options={STATUS_OPTS}   minWidth={160} />
          <CustomSelect value={filterPriority} onChange={setFilterPriority} options={PRIORITY_OPTS} minWidth={170} />
          {hasFilter && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: RED, background: '#fff1f1', border: `1px solid #fecaca`, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff1f1'}>
              <X style={{ width: 11, height: 11 }} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ══ Tableau ══ */}
      <div className="mt-table bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: RED, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}>
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun ticket trouvé</p>
            <p className="text-gray-400 text-sm mt-1">{search.trim() ? <>Aucun résultat pour <strong className="text-gray-500">« {search} »</strong></> : hasFilter ? 'Essayez de modifier vos filtres' : 'Créez votre premier ticket'}</p>
            {!hasFilter && (<button onClick={() => navigate('/tickets/new')} className="mt-4 px-6 py-2 text-white rounded-xl text-sm font-semibold" style={{ backgroundColor: RED }}>Créer un ticket</button>)}
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                  {['ID', 'Titre', 'Statut', 'Priorité', 'Catégorie', 'Assigné à', 'Date', 'Actions'].map((h, i) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ textAlign: i === 7 ? 'center' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody key={animKey}>
                {filtered.map((ticket, index) => {
                  const sc  = statusConfig[ticket.status.name]     || { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' };
                  const pc  = priorityConfig[ticket.priority.name] || { bg: '#f3f4f6', text: '#6b7280' };
                  const att = attachmentsMap[ticket.id] || [];
                  const deletable = canDelete(ticket);
                  const rowAnim = index < 12 ? `mt-row-${index}` : '';
                  return (
                    <tr key={ticket.id} className={`${ticket.slaBreached ? 'row-breach' : 'row-base'} ${rowAnim}`}
                      style={{ borderBottom: index < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: ticket.slaBreached ? '#fff8f8' : 'white', borderLeft: ticket.slaBreached ? `3px solid ${RED}` : '3px solid transparent' }}>
                      <td className="px-4 py-3.5 font-bold text-gray-400 whitespace-nowrap font-mono" style={{ fontSize: '13px' }}>#{prefix}-{String(ticket.id).padStart(3, '0')}</td>
                      <td className="px-4 py-3.5" style={{ maxWidth: '260px' }}>
                        <div className="flex items-center gap-2">
                          {ticket.slaBreached && <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: RED }} />}
                          <p className="font-medium text-gray-900 truncate" style={{ fontSize: '13px' }}>{ticket.title}</p>
                          {att.length > 0 && <span className="flex items-center gap-0.5 text-blue-500 flex-shrink-0" style={{ fontSize: '12px' }}><Paperclip className="w-3 h-3" />{att.length}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: sc.bg, color: sc.text, fontSize: '12px' }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.dot }} />{ticket.status.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: pc.bg, color: pc.text, fontSize: '12px' }}>{ticket.priority.name}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ticket.category.color || '#9ca3af' }} />
                          <span className="text-gray-600 truncate" style={{ fontSize: '13px' }}>{ticket.category.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap" style={{ fontSize: '13px' }}>
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: RED, fontSize: '10px' }}>{ticket.assignedTo.firstName?.charAt(0)}</div>
                            <span className="truncate">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                          </div>
                        ) : <span className="text-gray-300 italic">Non assigné</span>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap" style={{ fontSize: '13px' }}>
                        <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 flex-shrink-0" />{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</div>
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          <IconBtn onClick={() => navigate(`/tickets/${ticket.id}`)} title="Voir" icon={Eye} color="#6b7280" hoverBg="#f3f4f6" />
                          <IconBtn onClick={e => openEdit(e, ticket)} title="Modifier" icon={Pencil} color={RED} hoverBg="#fff1f1" />
                          {deletable
                            ? <IconBtn onClick={() => { setDeleteError(null); setConfirmDeleteId(ticket.id); }} title="Supprimer" icon={Trash2} color="#6b7280" hoverBg="#f3f4f6" />
                            : <IconBtn title={`Statut ${ticket.status.name} — suppression impossible`} icon={Lock} color="#d1d5db" hoverBg="transparent" disabled dimmed />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{filtered.length} ticket{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}</span>
              {hasFilter && <span style={{ fontSize: 11, color: '#9ca3af' }}>Filtre actif — {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} au total</span>}
            </div>
          </>
        )}
      </div>
    </ClientLayout>
  );
}