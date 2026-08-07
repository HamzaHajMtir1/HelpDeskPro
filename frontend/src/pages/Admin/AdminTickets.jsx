import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Filter, Eye, Pencil, AlertTriangle, Trash2, X, Lock,
  ChevronDown, ChevronUp, RefreshCw, ShieldAlert, Clock, Search,
  Ticket, CheckCircle, ShieldCheck, BarChart2,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAllTickets, deleteTicket } from '../../api/ticketApi';
import { useSettings } from '../../context/SettingsContext';

const RED      = '#E31E24';
const RED_DARK = '#b81519';

const PRIORITY_COLORS = {
  'Critique': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: RED },
  'Haute':    { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', dot: '#f97316' },
  'Moyenne':  { bg: '#fefce8', text: '#a16207', border: '#fde68a', dot: '#eab308' },
  'Basse':    { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
};

const TH = {
  padding: '10px 16px',
  fontSize: 12, fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
  textAlign: 'left',
};
const TD = {
  padding: '11px 16px',
  fontSize: 14,
  color: '#374151',
  verticalAlign: 'middle',
};

/* ─── useCountUp ─── */
function useCountUp(target, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let startTime = null;
    const timeoutId = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.round(target * eased));
        if (progress < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeoutId); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);
  return count;
}

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(22px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(227,30,36,0); }
    50%       { box-shadow: 0 0 0 8px rgba(227,30,36,0.12); }
  }

  .at-root { font-family: 'DM Sans', system-ui, sans-serif; }

  .at-skeleton {
    background: linear-gradient(90deg, #f0f0f5 25%, #f8f8fc 50%, #f0f0f5 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }

  .at-stat { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease; }
  .at-stat:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }

  .at-new-btn { animation: pulse-glow 3s ease-in-out infinite; }
  .at-new-btn:hover { animation: none !important; }

  .at-card {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
    overflow: hidden;
  }

  .at-filter-card {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    padding: 14px 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.1s both;
  }

  .at-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .row-base   { cursor: pointer; transition: background 0.15s; }
  .row-breach { cursor: pointer; transition: background 0.15s; }
  .row-base:hover   { background: #f9fafb !important; }
  .row-breach:hover { background: #fff0f0 !important; }

  .btn-lock { cursor: not-allowed !important; }

  .btn-icon     { transition: all 0.15s; border-radius: 8px; }
  .btn-icon:hover     { background: #f3f4f6 !important; }
  .btn-icon-red { transition: all 0.15s; border-radius: 8px; }
  .btn-icon-red:hover { background: #fff1f1 !important; }

  .search-input:focus { outline: none; }
  .search-input::placeholder { color: #b0b7c3; }
`;

// ─── Helpers ───────────────────────────────────────────────────────
function formatDuration(ms) {
  const totalMin = Math.round(Math.abs(ms) / 60000);
  const days  = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins  = totalMin % 60;
  if (days  > 0) return hours > 0 ? `${days}j ${hours}h` : `${days}j`;
  if (hours > 0) return mins  > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

function getSlaInfo(ticket) {
  if (!ticket.slaDeadline || ticket.status?.finalStatus)
    return { status: 'none' };
  const now      = new Date();
  const deadline = new Date(ticket.slaDeadline);
  const diffMs   = deadline - now;
  const totalMs  = (ticket.slaTotalMinutes || 60) * 60000;

  if (ticket.slaBreached || diffMs <= 0) {
    return {
      status: 'breached',
      label: ticket.slaPhase === 'PRISE_EN_CHARGE'
        ? `Non pris en charge (+${formatDuration(Math.abs(diffMs))})`
        : `+${formatDuration(Math.abs(diffMs))} dépassé`,
      color: { bg: '#fff1f1', text: RED, border: '#fecaca', dot: RED },
      percent: 100,
    };
  }
  const percent = Math.min(100, Math.round(((totalMs - diffMs) / totalMs) * 100));
  if (ticket.slaPhase === 'PRISE_EN_CHARGE') {
    return {
      status: percent >= 80 ? 'warning' : 'ok',
      label: `Prise en charge : ${formatDuration(diffMs)}`,
      color: percent >= 80
        ? { bg: '#fffbeb', text: '#d97706', border: '#fde68a', dot: '#f59e0b' }
        : { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb', dot: '#9ca3af' },
      percent,
    };
  }
  const label = `${formatDuration(diffMs)} restant`;
  if (percent >= 80)
    return { status: 'warning', label, color: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', dot: '#f59e0b' }, percent };
  return { status: 'ok', label, color: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', dot: '#22c55e' }, percent };
}

const canDelete = t => t.status.name.trim().toLowerCase() === 'nouveau';

// ─── CustomSelect — portail ReactDOM ──────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, minWidth = 170 }) {
  const [open, setOpen]           = useState(false);
  const [dropStyle, setDropStyle] = useState({});
  const btnRef  = useRef(null);
  const listRef = useRef(null);

  const calcPosition = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setDropStyle({
      position: 'fixed',
      top:  r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, minWidth),
      zIndex: 99999,
      maxHeight: Math.min(260, window.innerHeight - r.bottom - 12),
    });
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

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

  const handleToggle = () => { if (!open) calcPosition(); setOpen(o => !o); };
  const selected = options.find(o => String(o.value) === String(value));
  const hasVal   = selected && String(selected.value) !== '';

  const dropdown = open && ReactDOM.createPortal(
    <ul
      ref={listRef}
      style={{
        ...dropStyle,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,.12)',
        overflowY: 'auto',
        margin: 0,
        padding: '4px',
        listStyle: 'none',
        scrollbarWidth: 'thin',
      }}
    >
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
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (!isA) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={e => { if (!isA) e.currentTarget.style.backgroundColor = 'transparent'; }}>
            {opt.label}
          </li>
        );
      })}
    </ul>,
    document.body
  );

  return (
    <div style={{ position: 'relative', userSelect: 'none', minWidth }}>
      <button ref={btnRef} type="button" onClick={handleToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 10px', background: '#fff',
        border: open ? `1.5px solid ${RED}` : '1.5px solid #e5e7eb',
        borderRadius: 10, fontSize: 12, fontWeight: hasVal ? 600 : 400,
        color: hasVal ? RED : '#6b7280', cursor: 'pointer', outline: 'none',
        boxShadow: open ? `0 0 0 3px rgba(227,30,36,.08)` : 'none',
        transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
      }}>
        {hasVal && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: RED, flexShrink: 0 }} />}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected ? selected.label : (placeholder || 'Sélectionner…')}
        </span>
        {open
          ? <ChevronUp   style={{ width: 12, height: 12, color: RED,      flexShrink: 0 }} />
          : <ChevronDown style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />}
      </button>
      {dropdown}
    </div>
  );
}

// ─── Statut badge ──────────────────────────────────────────────────
const STATUS_STYLE = {
  'Nouveau':               { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' },
  'En cours':              { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  'Résolu':                { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  'Fermé':                 { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  'Information requise':   { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  'Informations requises': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
};

function StatusPill({ name }) {
  const s = STATUS_STYLE[name] || { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>{name}</span>
  );
}

// ─── Options filtres ───────────────────────────────────────────────
const STATUS_OPTS   = [{ value: '', label: 'Tous les statuts' }, { value: 'Nouveau', label: 'Nouveau' }, { value: 'En cours', label: 'En cours' }, { value: 'Résolu', label: 'Résolu' }, { value: 'Fermé', label: 'Fermé' }];
const PRIORITY_OPTS = [{ value: '', label: 'Toutes les priorités' }, { value: 'Critique', label: 'Critique' }, { value: 'Haute', label: 'Haute' }, { value: 'Moyenne', label: 'Moyenne' }, { value: 'Basse', label: 'Basse' }];
const SLA_OPTS      = [{ value: '', label: 'Tous les SLA' }, { value: 'breached', label: '🔴 SLA dépassé' }, { value: 'warning', label: '🟡 SLA à risque' }, { value: 'ok', label: '🟢 SLA respecté' }];

// ─── Skeleton Row ──────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
      {[60, 160, 70, 70, 90, 100, 90, 100, 60, 80].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div className="at-skeleton" style={{ height: 14, width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────
function StatCard({ label, value, Icon, color, delay = 0 }) {
  const animated = useCountUp(value, 1000, delay + 200);
  const gradients = {
    red:   `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
    dark:  'linear-gradient(135deg, #1f1f23, #3a3a42)',
    green: 'linear-gradient(135deg, #059669, #10b981)',
    amber: 'linear-gradient(135deg, #d97706, #f59e0b)',
  };
  const shadows = {
    red:   '0 6px 18px rgba(227,30,36,0.35)',
    dark:  '0 6px 18px rgba(0,0,0,0.3)',
    green: '0 6px 18px rgba(16,185,129,0.35)',
    amber: '0 6px 18px rgba(245,158,11,0.35)',
  };
  return (
    <div className="at-stat" style={{
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.95)',
      borderRadius: 16, padding: '16px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
      animationDelay: `${delay}ms`,
      animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      <div>
        <p style={{ margin: '0 0 5px', fontSize: 11.5, color: '#6b7280', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.8px', fontVariantNumeric: 'tabular-nums' }}>
          {animated.toLocaleString('fr-FR')}
        </p>
      </div>
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: gradients[color] || gradients.dark,
        boxShadow: shadows[color] || shadows.dark,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', flexShrink: 0,
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.14) rotate(-9deg)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        <Icon size={20} color="#fff" strokeWidth={1.8} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════
export default function AdminTickets() {
  const { settings } = useSettings();
  const prefix       = settings?.ticketPrefix || 'TKT';

  const [tickets,        setTickets]        = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSla,      setFilterSla]      = useState('');
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [deleteError,    setDeleteError]    = useState(null);
  const navigate = useNavigate();

  const loadTickets = () => {
    setLoading(true);
    getAllTickets()
      .then(res => { setTickets(res.data); setFiltered(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTickets(); }, []);

  useEffect(() => {
    let r = tickets;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.createdBy?.firstName?.toLowerCase().includes(q) ||
        t.createdBy?.lastName?.toLowerCase().includes(q) ||
        `${t.createdBy?.firstName} ${t.createdBy?.lastName}`.toLowerCase().includes(q) ||
        String(t.id).includes(q)
      );
    }
    if (filterStatus)   r = r.filter(t => t.status.name === filterStatus);
    if (filterPriority) r = r.filter(t => t.priority.name === filterPriority);
    if (filterSla === 'breached') r = r.filter(t => t.slaBreached);
    if (filterSla === 'warning')  r = r.filter(t => {
      if (!t.slaDeadline || t.slaBreached || t.status?.finalStatus) return false;
      const diff = new Date(t.slaDeadline) - new Date();
      return diff > 0 && (1 - diff / ((t.slaTotalMinutes || 60) * 60000)) >= 0.8;
    });
    if (filterSla === 'ok') r = r.filter(t => {
      if (!t.slaDeadline || t.slaBreached || t.status?.finalStatus) return false;
      const diff = new Date(t.slaDeadline) - new Date();
      return diff > 0 && (1 - diff / ((t.slaTotalMinutes || 60) * 60000)) < 0.8;
    });
    setFiltered(r);
  }, [search, filterStatus, filterPriority, filterSla, tickets]);

  const handleDeleteConfirm = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true); setDeleteError(null);
    try {
      await deleteTicket(confirmDelete.id);
      setTickets(p => p.filter(t => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || 'Une erreur est survenue.';
      setDeleteError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally { setDeleting(false); }
  };

  const slaBreachedCount = tickets.filter(t => t.slaBreached).length;
  const slaWarningCount  = tickets.filter(t => {
    if (!t.slaDeadline || t.slaBreached || t.status?.finalStatus) return false;
    const diff = new Date(t.slaDeadline) - new Date();
    return diff > 0 && (1 - diff / ((t.slaTotalMinutes || 60) * 60000)) >= 0.8;
  }).length;

  const resolvedCount = tickets.filter(t => t.status?.finalStatus).length;
  const openCount     = tickets.filter(t => !t.status?.finalStatus).length;
  const hasFilter     = filterStatus || filterPriority || filterSla || search.trim();

  return (
    <AdminLayout>
      <style>{GLOBAL_STYLES}</style>
      <div className="at-root">

        {/* ── Modal suppression ── */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
               style={{ backgroundColor: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
               onClick={() => !deleting && (setConfirmDelete(null), setDeleteError(null))}>
            <div style={{
              background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440,
              boxShadow: '0 20px 60px rgba(0,0,0,.18)', overflow: 'hidden',
              animation: 'fadeSlideUp 0.3s cubic-bezier(0.22,1,0.36,1) both',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ height: 4, background: `linear-gradient(90deg,${RED},#ff6b6b)` }} />
              <div style={{ padding: '24px 28px 28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: '#fff1f1', border: '1.5px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 style={{ width: 28, height: 28, color: RED }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Supprimer ce ticket ?</h2>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 0', lineHeight: 1.5 }}>
                      Le ticket <strong style={{ color: RED }}>#{prefix}-{String(confirmDelete.id).padStart(3, '0')}</strong> sera définitivement supprimé.
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 8, padding: '6px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, display: 'inline-block' }}>
                      « {confirmDelete.title} »
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: '#fff8f8', border: '1.5px solid #fecaca', borderRadius: 12, marginBottom: 16 }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: RED, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>
                    <strong>Action irréversible</strong> — Tout l'historique, les commentaires et les pièces jointes seront perdus.
                  </p>
                </div>
                {deleteError && (
                  <p style={{ fontSize: 12, color: RED, background: '#fff1f1', padding: '8px 12px', borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
                    ⚠️ {deleteError}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setConfirmDelete(null); setDeleteError(null); }} disabled={deleting}
                    style={{ flex: 1, padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Annuler
                  </button>
                  <button onClick={handleDeleteConfirm} disabled={deleting}
                    style={{ flex: 1, padding: '10px', background: deleting ? '#f87171' : RED, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                    {deleting
                      ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Suppression…</>
                      : <><Trash2 style={{ width: 14, height: 14 }} /> Supprimer</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>

          {/* ── Titre ── */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
            animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
                Gestion des tickets
              </h1>
              <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                {filtered.length} ticket{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
                {slaBreachedCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fef2f2', color: RED, border: '1px solid #fecaca' }}>
                    {slaBreachedCount} SLA dépassé{slaBreachedCount > 1 ? 's' : ''}
                  </span>
                )}
                {slaWarningCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                    {slaWarningCount} à risque
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={loadTickets}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  color: '#374151', background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}>
                <RefreshCw size={14} /> Actualiser
              </button>
              <button className="at-new-btn" onClick={() => navigate('/admin/new')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  background: RED, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: '0 4px 12px rgba(227,30,36,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(227,30,36,0.4)'; e.currentTarget.style.animation = 'none'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(227,30,36,0.3)'; }}>
                <Plus size={15} /> Nouveau ticket
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <StatCard label="Total tickets"  value={tickets.length}   Icon={Ticket}      color="dark"  delay={0}   />
            <StatCard label="Ouverts"         value={openCount}        Icon={Clock}       color="amber" delay={60}  />
            <StatCard label="Résolus"         value={resolvedCount}    Icon={CheckCircle} color="green" delay={120} />
            <StatCard label="SLA dépassés"    value={slaBreachedCount} Icon={ShieldAlert} color="red"   delay={180} />
          </div>

          {/* ── Filtres + Recherche ── */}
          <div className="at-filter-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                <Filter style={{ width: 12, height: 12 }} /> Filtres
              </div>

              {/* Search */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Search style={{
                  position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                  width: 13, height: 13,
                  color: search.trim() ? RED : '#9ca3af',
                  pointerEvents: 'none', transition: 'color 0.15s',
                }} />
                <input
                  className="search-input"
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un ticket…"
                  style={{
                    paddingLeft: 28, paddingRight: search ? 28 : 10,
                    paddingTop: 7, paddingBottom: 7, width: 200,
                    border: search.trim() ? `1.5px solid ${RED}` : '1.5px solid #e5e7eb',
                    borderRadius: 10, fontSize: 12, color: '#374151', background: '#fff',
                    boxShadow: search.trim() ? `0 0 0 3px rgba(227,30,36,.08)` : 'none',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9ca3af', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = RED}
                    onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                )}
              </div>

              <CustomSelect value={filterStatus}   onChange={setFilterStatus}   options={STATUS_OPTS}   minWidth={160} />
              <CustomSelect value={filterPriority} onChange={setFilterPriority} options={PRIORITY_OPTS} minWidth={170} />
              <CustomSelect value={filterSla}      onChange={setFilterSla}      options={SLA_OPTS}      minWidth={150} />

              {hasFilter && (
                <button onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterSla(''); setSearch(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: RED, background: '#fff1f1', border: `1px solid #fecaca`, cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff1f1'}>
                  <X style={{ width: 11, height: 11 }} /> Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* ── Tableau ── */}
          <div className="at-card">
            {loading ? (
              <div className="at-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      {['ID', 'Titre', 'Statut', 'Priorité', 'Catégorie', 'Assigné à', 'Créé par', 'SLA', 'Date', 'Actions'].map(h => (
                        <th key={h} style={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                  </tbody>
                </table>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: 14, animation: 'fadeSlideUp 0.4s ease both' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Ticket size={26} color="#d1d5db" />
                </div>
                {search.trim()
                  ? <>Aucun ticket trouvé pour <strong style={{ color: '#6b7280' }}>« {search} »</strong></>
                  : 'Aucun ticket trouvé'}
              </div>
            ) : (
              <>
                <div className="at-table-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto', minWidth: 960 }}>
                    <thead>
                      <tr>
                        {[
                          ['ID', 'left'], ['Titre', 'left'], ['Statut', 'left'], ['Priorité', 'left'],
                          ['Catégorie', 'left'], ['Assigné à', 'left'], ['Créé par', 'left'],
                          ['SLA', 'left'], ['Date', 'left'], ['Actions', 'center'],
                        ].map(([h, align]) => (
                          <th key={h} style={{ ...TH, textAlign: align }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((ticket, idx) => {
                        const sla       = getSlaInfo(ticket);
                        const pColor    = PRIORITY_COLORS[ticket.priority.name] || PRIORITY_COLORS['Basse'];
                        const isLast    = idx === filtered.length - 1;
                        const deletable = canDelete(ticket);

                        return (
                          <tr
                            key={ticket.id}
                            className={sla.status === 'breached' ? 'row-breach' : 'row-base'}
                            style={{
                              background:   sla.status === 'breached' ? '#fff8f8' : '#fff',
                              borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                              borderLeft:   sla.status === 'breached' ? `3px solid ${RED}` : '3px solid transparent',
                            }}
                            onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                          >
                            {/* ID */}
                            <td style={{ ...TD, fontWeight: 700, color: '#9ca3af', fontFamily: 'monospace', fontSize: 12 }}>
                              #{prefix}-{String(ticket.id).padStart(3, '0')}
                            </td>

                            {/* Titre */}
                            <td style={{ ...TD, maxWidth: 200 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                {sla.status === 'breached' && <AlertTriangle style={{ width: 13, height: 13, color: RED, flexShrink: 0 }} />}
                                <p style={{ margin: 0, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                  {ticket.title}
                                </p>
                              </div>
                            </td>

                            {/* Statut */}
                            <td style={TD}><StatusPill name={ticket.status.name} /></td>

                            {/* Priorité */}
                            <td style={TD}>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: pColor.bg, color: pColor.text, border: `1px solid ${pColor.border}` }}>
                                {ticket.priority.name}
                              </span>
                            </td>

                            {/* Catégorie */}
                            <td style={TD}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: ticket.category.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{ticket.category.name}</span>
                              </div>
                            </td>

                            {/* Assigné à */}
                            <td style={{ ...TD, fontSize: 12, whiteSpace: 'nowrap' }}>
                              {ticket.assignedTo
                                ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>
                                      {ticket.assignedTo.firstName?.charAt(0)}{ticket.assignedTo.lastName?.charAt(0)}
                                    </div>
                                    {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                                  </span>
                                : <span style={{ color: '#d1d5db', fontStyle: 'italic', fontSize: 12 }}>Non assigné</span>}
                            </td>

                            {/* Créé par */}
                            <td style={{ ...TD, fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                              {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
                            </td>

                            {/* SLA */}
                            <td style={{ ...TD, minWidth: 90 }}>
                              {sla.status === 'none' ? (
                                <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                              ) : (
                                <span style={{
                                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  background: sla.color.bg, color: sla.color.text, border: `1px solid ${sla.color.border}`,
                                  whiteSpace: 'nowrap',
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: sla.color.dot, flexShrink: 0 }} />
                                  {sla.label}
                                </span>
                              )}
                            </td>

                            {/* Date */}
                            <td style={{ ...TD, fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                              {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                            </td>

                            {/* ── Actions ── */}
                            <td
                              style={{ ...TD, textAlign: 'center' }}
                              onClick={e => e.stopPropagation()}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>

                                {/* Voir */}
                                <button
                                  className="btn-icon"
                                  onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                                  title="Voir"
                                  style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer' }}>
                                  <Eye style={{ width: 14, height: 14 }} />
                                </button>

                                {/* Modifier */}
                                <button
                                  className="btn-icon-red"
                                  onClick={() => navigate(`/admin/tickets/${ticket.id}`, { state: { editMode: true } })}
                                  title="Modifier"
                                  style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: RED, cursor: 'pointer' }}>
                                  <Pencil style={{ width: 14, height: 14 }} />
                                </button>

                                {/* Supprimer / Verrouillé */}
                                {deletable ? (
                                  <button
                                    className="btn-icon"
                                    onClick={() => { setDeleteError(null); setConfirmDelete({ id: ticket.id, title: ticket.title }); }}
                                    title="Supprimer"
                                    style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer' }}>
                                    <Trash2 style={{ width: 14, height: 14 }} />
                                  </button>
                                ) : (
                                  <button
                                    className="btn-lock"
                                    disabled
                                    title={`Statut ${ticket.status.name} — suppression impossible`}
                                    style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: '#d1d5db' }}>
                                    <Lock style={{ width: 14, height: 14 }} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    {filtered.length} ticket{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
                  </span>
                  {hasFilter && (
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      Filtre actif — {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} au total
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
