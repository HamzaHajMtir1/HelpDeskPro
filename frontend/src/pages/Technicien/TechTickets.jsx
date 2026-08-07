import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, Ticket, Eye, Edit, Filter, Clock,
  AlertTriangle, CheckCircle, Loader2, X,
  ChevronDown, ChevronUp, Search,
} from 'lucide-react';
import TechnicienLayout from '../../layouts/TechnicienLayout';
import {
  getAssignedTickets,
  prendreEnCharge,
  getStatuses,
  getPriorities,
} from '../../api/ticketApi';
import { useSettings } from '../../context/SettingsContext';

// ── Helpers SLA ────────────────────────────────────────────────────
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

function getSlaInfo(ticket) {
  if (!ticket.slaDeadline) return null;
  if (ticket.status?.finalStatus) {
    return { label: 'Clôturé', color: '#16a34a', bg: '#f0fdf4', icon: false };
  }
  const now      = Date.now();
  const deadline = new Date(ticket.slaDeadline).getTime();
  const diffMs   = deadline - now;
  const isPEC    = ticket.slaPhase === 'PRISE_EN_CHARGE';

  if (diffMs < 0) {
    return {
      label: isPEC
        ? `Non pris en charge +${formatDuration(Math.abs(diffMs))}`
        : `+${formatDuration(Math.abs(diffMs))}`,
      color: '#dc2626', bg: '#fee2e2', icon: true, breached: true,
    };
  }
  const totalMs    = (ticket.slaTotalMinutes || 60) * 60000;
  const pctRestant = diffMs / totalMs;

  if (isPEC) {
    return {
      label: `Prise en charge dans ${formatDuration(diffMs)}`,
      color: pctRestant < 0.20 ? '#ea580c' : '#6b7280',
      bg:    pctRestant < 0.20 ? '#ffedd5' : '#f3f4f6',
      icon: false, phase: 'pec',
    };
  }
  if (pctRestant < 0.20) {
    return { label: formatDuration(diffMs), color: '#ea580c', bg: '#ffedd5', icon: false };
  }
  return { label: formatDuration(diffMs), color: '#16a34a', bg: '#f0fdf4', icon: false };
}

// ── Toast ──────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
    error:   { bg: '#fff1f1', border: '#fecaca', text: '#b91c1c' },
  };
  const c = colors[toast.type] || colors.info;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium toast-enter"
      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text, maxWidth: '320px' }}
    >
      {toast.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
      {toast.type === 'info'    && <Loader2     className="w-4 h-4 flex-shrink-0 animate-spin" />}
      {toast.type === 'error'   && <X           className="w-4 h-4 flex-shrink-0" />}
      <span>{toast.msg}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  CustomSelect — createPortal + calcPosition avant ouverture
// ════════════════════════════════════════════════════════════════════
const CustomSelect = ({ value, onChange, options, minWidth = 160, placeholder = 'Sélectionner…' }) => {
  const [open, setOpen]           = useState(false);
  const [listStyle, setListStyle] = useState({});
  const btnRef = useRef(null);
  const ref    = useRef(null);

  const calcPosition = () => {
    if (!btnRef.current) return;
    const r          = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 12;
    setListStyle({
      position : 'fixed',
      top      : r.bottom + 4,
      left     : r.left,
      width    : Math.max(r.width, minWidth),
      zIndex   : 99999,
      maxHeight: Math.min(260, Math.max(80, spaceBelow)),
    });
  };

  // Fermer au clic extérieur
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Repositionner au scroll/resize quand ouvert
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', calcPosition, true);
    window.addEventListener('resize', calcPosition);
    return () => {
      window.removeEventListener('scroll', calcPosition, true);
      window.removeEventListener('resize', calcPosition);
    };
  }, [open]);

  // calcPosition AVANT d'ouvrir → pas de tremblement
  const handleToggle = () => {
    if (!open) calcPosition();
    setOpen(o => !o);
  };

  const selected = options.find(o => String(o.value) === String(value));
  const hasValue = selected && String(selected.value) !== '';

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none', minWidth }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        style={{
          width        : '100%',
          display      : 'flex',
          alignItems   : 'center',
          gap          : 6,
          padding      : '7px 10px',
          background   : '#fff',
          border       : open ? '1.5px solid #E31E24' : '1.5px solid #e5e7eb',
          borderRadius : 10,
          fontSize     : 12,
          fontWeight   : hasValue ? 600 : 400,
          color        : hasValue ? '#E31E24' : '#6b7280',
          cursor       : 'pointer',
          outline      : 'none',
          boxShadow    : open ? '0 0 0 3px rgba(227,30,36,.08)' : 'none',
          transition   : 'all 0.15s',
          whiteSpace   : 'nowrap',
          boxSizing    : 'border-box',
        }}
      >
        {hasValue && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#E31E24', flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected ? selected.label : placeholder}
        </span>
        {open
          ? <ChevronUp   style={{ width: 12, height: 12, color: '#E31E24', flexShrink: 0 }} />
          : <ChevronDown style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />
        }
      </button>

      {open && createPortal(
        <ul style={{
          ...listStyle,
          background    : '#fff',
          border        : '1px solid #e5e7eb',
          borderRadius  : 10,
          boxShadow     : '0 4px 20px rgba(0,0,0,.10)',
          overflowY     : 'auto',
          margin        : 0,
          padding       : '4px',
          listStyle     : 'none',
          scrollbarWidth: 'thin',
        }}>
          {options.length === 0 && (
            <li style={{ padding: '10px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              Chargement…
            </li>
          )}
          {options.map(opt => {
            const isActive  = String(opt.value) === String(value);
            const isDefault = String(opt.value) === '';
            return (
              <li
                key={opt.value}
                onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                style={{
                  padding        : '7px 10px',
                  borderRadius   : 6,
                  fontSize       : 12,
                  fontWeight     : isActive ? 600 : 400,
                  cursor         : 'pointer',
                  backgroundColor: isActive ? '#fff1f1' : 'transparent',
                  color          : isActive ? '#E31E24' : isDefault ? '#9ca3af' : '#374151',
                  transition     : 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
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

// ── Options SLA fixes ──────────────────────────────────────────────
const SLA_OPTIONS = [
  { value: '',         label: 'Tous les SLA'  },
  { value: 'breached', label: 'SLA dépassés'  },
  { value: 'ok',       label: 'SLA respectés' },
];

// ── Skeleton ───────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 0', borderBottom: '1px solid #f3f4f6', marginBottom: 4,
      }}>
        {[80, 180, 80, 80, 110, 90, 120, 90].map((w, i) => (
          <div key={i} className="tk-skeleton" style={{ height: 10, width: w, flexShrink: 0 }} />
        ))}
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 0', borderBottom: '1px solid #f3f4f6',
          animation: `fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 55}ms both`,
        }}>
          <div className="tk-skeleton" style={{ width: 80,  height: 14, flexShrink: 0 }} />
          <div className="tk-skeleton" style={{ width: 160, height: 14, flexShrink: 0 }} />
          <div className="tk-skeleton" style={{ width: 70,  height: 22, borderRadius: 20, flexShrink: 0 }} />
          <div className="tk-skeleton" style={{ width: 70,  height: 22, borderRadius: 20, flexShrink: 0 }} />
          <div className="tk-skeleton" style={{ width: 100, height: 14, flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="tk-skeleton" style={{ width: 88, height: 20, borderRadius: 20 }} />
            <div className="tk-skeleton" style={{ width: 72, height: 6,  borderRadius: 99 }} />
          </div>
          <div className="tk-skeleton" style={{ width: 110, height: 14, flexShrink: 0 }} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
            <div className="tk-skeleton" style={{ width: 52, height: 28, borderRadius: 8 }} />
            <div className="tk-skeleton" style={{ width: 82, height: 28, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function TechTickets() {
  const { settings } = useSettings();
  const prefix = settings?.ticketPrefix || 'TKT';

  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSla,      setFilterSla]      = useState('');
  const [loadingTicket,  setLoadingTicket]  = useState(null);
  const [toast,          setToast]          = useState(null);

  const [statusOptions,   setStatusOptions]   = useState([{ value: '', label: 'Tous les statuts' }]);
  const [priorityOptions, setPriorityOptions] = useState([{ value: '', label: 'Toutes les priorités' }]);

  const navigate = useNavigate();
  const myEmail  = localStorage.getItem('email');

  const showToast = useCallback((type, msg, duration = 3000) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), duration);
  }, []);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [statusRes, priorityRes] = await Promise.all([getStatuses(), getPriorities()]);
        const statuses   = statusRes.data   || [];
        const priorities = priorityRes.data || [];
        setStatusOptions([
          { value: '', label: 'Tous les statuts' },
          ...statuses.map(s => ({ value: s.name, label: s.name })),
        ]);
        setPriorityOptions([
          { value: '', label: 'Toutes les priorités' },
          ...priorities.map(p => ({ value: p.name, label: p.name })),
        ]);
      } catch {
        setStatusOptions([
          { value: '',         label: 'Tous les statuts' },
          { value: 'Nouveau',  label: 'Nouveau'          },
          { value: 'En cours', label: 'En cours'         },
          { value: 'Résolu',   label: 'Résolu'           },
          { value: 'Fermé',    label: 'Fermé'            },
        ]);
        setPriorityOptions([
          { value: '',         label: 'Toutes les priorités' },
          { value: 'Critique', label: 'Critique'             },
          { value: 'Haute',    label: 'Haute'                },
          { value: 'Moyenne',  label: 'Moyenne'              },
          { value: 'Basse',    label: 'Basse'                },
        ]);
      }
    };
    loadRefs();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await getAssignedTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handlePrendreEnCharge = useCallback(async (ticketId, e) => {
    e.stopPropagation();
    if (loadingTicket) return;
    setLoadingTicket(ticketId);
    showToast('info', 'Prise en charge en cours…', 8000);
    try {
      await prendreEnCharge(ticketId);
      showToast('success', 'Ticket pris en charge avec succès !');
      setTimeout(() => navigate(`/tech/tickets/${ticketId}`), 700);
    } catch {
      showToast('error', "Ce ticket vient d'être pris en charge par quelqu'un d'autre.");
      setLoadingTicket(null);
      fetchTickets();
    }
  }, [loadingTicket, navigate, showToast]);

  const statusColors = {
    'Nouveau':               'bg-gray-100 text-gray-700',
    'En cours':              'bg-blue-100 text-blue-700',
    'Résolu':                'bg-green-100 text-green-700',
    'Fermé':                 'bg-red-100 text-red-700',
    'Information requise':   'bg-yellow-100 text-yellow-700',
    'Informations requises': 'bg-yellow-100 text-yellow-700',
  };

  const priorityColors = {
    'Critique': 'bg-red-100 text-red-700',
    'Haute':    'bg-orange-100 text-orange-700',
    'Moyenne':  'bg-yellow-100 text-yellow-700',
    'Basse':    'bg-gray-100 text-gray-600',
  };

  const filtered = tickets
    .filter(t => !filterStatus   || t.status?.name   === filterStatus)
    .filter(t => !filterPriority || t.priority?.name === filterPriority)
    .filter(t => {
      if (!filterSla) return true;
      const info = getSlaInfo(t);
      if (filterSla === 'breached') return info?.breached === true;
      if (filterSla === 'ok')       return info && !info.breached;
      return true;
    })
    .filter(t => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        `${t.createdBy?.firstName ?? ''} ${t.createdBy?.lastName ?? ''}`.toLowerCase().includes(q) ||
        String(t.id).includes(q)
      );
    });

  const nbBreached = tickets.filter(t => getSlaInfo(t)?.breached).length;
  const hasFilters = filterStatus || filterPriority || filterSla || search.trim();

  function getTicketOwnership(ticket) {
    if (!ticket.assignedTo) return 'free';
    if (ticket.assignedTo.email === myEmail) return 'mine';
    return 'others';
  }

  return (
    <TechnicienLayout>
      <Toast toast={toast} />

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(22px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .header-enter  { animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.04s both; }
        .filters-enter { animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.12s both; }
        .table-enter   { animation: fadeSlideUp 0.50s cubic-bezier(0.22,1,0.36,1) 0.20s both; }
        .toast-enter   { animation: toastIn     0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
        .tk-skeleton {
          background: linear-gradient(90deg, #f0f0f5 25%, #f8f8fc 50%, #f0f0f5 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 8px;
        }
        .row-base {
          transition: background 0.18s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease !important;
        }
        .row-base:hover {
          background: #f9fafb !important;
          transform: translateX(4px) !important;
          box-shadow: inset 3px 0 0 #E31E24 !important;
          cursor: default;
        }
        .row-breach {
          transition: background 0.18s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease !important;
        }
        .row-breach:hover {
          background: #fff0f0 !important;
          transform: translateX(4px) !important;
          cursor: default;
        }
        .action-btn {
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, background 0.15s ease !important;
        }
        .action-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.05) !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.13) !important;
        }
        .action-btn:active:not(:disabled) { transform: scale(0.97) !important; }
        .refresh-btn { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .refresh-btn:hover {
          transform: translateY(-2px) scale(1.04) !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.10) !important;
          background: #f9fafb !important;
        }
        .refresh-btn:active { transform: scale(0.97) !important; }
        .search-input:focus { outline: none; }
        .search-input::placeholder { color: #b0b7c3; }
        .row-stagger { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="space-y-4">

        {/* ── En-tête ── */}
        <div className="header-enter flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes tickets assignés</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} ticket{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
              {nbBreached > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold
                                 text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  <AlertTriangle className="w-3 h-3" />
                  {nbBreached} SLA dépassé{nbBreached > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <button onClick={fetchTickets} className="refresh-btn flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* ── Filtres ── */}
        <div className="filters-enter" style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
          padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: '#9ca3af', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
            }}>
              <Filter style={{ width: 12, height: 12 }} /> Filtres
            </div>

            {/* Search */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Search style={{
                position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                width: 13, height: 13,
                color: search.trim() ? '#E31E24' : '#9ca3af',
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
                  paddingTop: 7, paddingBottom: 7,
                  width: 200,
                  border: search.trim() ? '1.5px solid #E31E24' : '1.5px solid #e5e7eb',
                  borderRadius: 10, fontSize: 12, color: '#374151', background: '#fff',
                  boxShadow: search.trim() ? '0 0 0 3px rgba(227,30,36,.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', color: '#9ca3af',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#E31E24'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              )}
            </div>

            <CustomSelect value={filterStatus}   onChange={setFilterStatus}   options={statusOptions}   minWidth={170} placeholder="Tous les statuts"      />
            <CustomSelect value={filterPriority} onChange={setFilterPriority} options={priorityOptions} minWidth={185} placeholder="Toutes les priorités"  />
            <CustomSelect value={filterSla}      onChange={setFilterSla}      options={SLA_OPTIONS}     minWidth={155} placeholder="Tous les SLA"          />

            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterSla(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', border: '1px solid #fecaca', borderRadius: 8,
                  fontSize: 11, fontWeight: 600, color: '#E31E24', backgroundColor: '#fff1f1',
                  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff1f1'; }}
              >
                <X style={{ width: 11, height: 11 }} />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* ── Tableau ── */}
        <div className="table-enter bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {loading ? (
            <div style={{ padding: '20px 0 8px' }}><SkeletonRows /></div>

          ) : filtered.length === 0 ? (
            <div className="text-center py-16" style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun ticket trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                {search.trim()
                  ? <>Aucun résultat pour <strong className="text-gray-500">« {search} »</strong></>
                  : hasFilters
                    ? 'Aucun ticket ne correspond aux filtres sélectionnés'
                    : 'Aucun ticket ne vous est assigné'}
              </p>
            </div>

          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Titre</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Priorité</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Catégorie</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> SLA</span>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Créé par</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket, index) => {
                    const slaInfo       = getSlaInfo(ticket);
                    const isBreached    = slaInfo?.breached === true;
                    const isClosed      = ticket.status?.finalStatus === true;
                    const pct           = computeSlaPercent(ticket);
                    const ownership     = getTicketOwnership(ticket);
                    const isThisLoading = loadingTicket === ticket.id;

                    return (
                      <tr
                        key={ticket.id}
                        className={`row-stagger ${isBreached ? 'row-breach' : 'row-base'}`}
                        style={{
                          borderBottom   : index < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                          backgroundColor: isThisLoading ? '#f0fdf4' : isBreached ? '#fff8f8' : 'transparent',
                          opacity        : loadingTicket && !isThisLoading ? 0.55 : 1,
                          borderLeft     : isBreached ? '3px solid #E31E24' : '3px solid transparent',
                          animationDelay : `${Math.min(index * 40, 320)}ms`,
                        }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {isBreached && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                            <span className="text-sm font-bold text-gray-400 font-mono">
                              #{prefix}-{String(ticket.id).padStart(3, '0')}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-44">{ticket.title}</p>
                          {isThisLoading && (
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                              <Loader2 className="w-3 h-3 animate-spin" /> Prise en charge en cours…
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ticket.status?.name] || 'bg-gray-100 text-gray-700'}`}>
                            {ticket.status?.name}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColors[ticket.priority?.name] || 'bg-gray-100 text-gray-700'}`}>
                            {ticket.priority?.name}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: ticket.category?.color || '#6b7280' }} />
                            <span className="text-sm text-gray-600">{ticket.category?.name}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {slaInfo ? (
                            <div className="flex flex-col gap-1">
                              <span
                                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                                style={{ backgroundColor: slaInfo.bg, color: slaInfo.color }}
                              >
                                {slaInfo.icon && <AlertTriangle className="w-3 h-3" />}
                                {slaInfo.label}
                              </span>
                              {!isClosed && ticket.slaDeadline && pct !== null && (
                                <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="h-1.5 rounded-full transition-all" style={{
                                    width: `${Math.min(pct, 100)}%`,
                                    backgroundColor: pct >= 100 ? '#dc2626' : pct >= 80 ? '#ea580c' : '#16a34a',
                                  }} />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {ticket.createdBy
                            ? `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}`
                            : <span className="text-gray-400 italic">—</span>}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/tech/tickets/${ticket.id}`)}
                              disabled={!!loadingTicket}
                              className="action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 flex-shrink-0"
                              style={{ opacity: loadingTicket ? 0.5 : 1, cursor: loadingTicket ? 'not-allowed' : 'pointer' }}
                            >
                              <Eye className="w-3.5 h-3.5" /> Voir
                            </button>

                            {!isClosed && (
                              <>
                                {ownership === 'free' && (
                                  <button
                                    onClick={e => handlePrendreEnCharge(ticket.id, e)}
                                    disabled={!!loadingTicket}
                                    className="action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white flex-shrink-0"
                                    style={{
                                      backgroundColor: isThisLoading ? '#16a34a' : '#E31E24',
                                      opacity        : loadingTicket && !isThisLoading ? 0.5 : 1,
                                      cursor         : loadingTicket ? 'not-allowed' : 'pointer',
                                      minWidth       : '90px', justifyContent: 'center',
                                    }}
                                    onMouseEnter={e => { if (!loadingTicket) e.currentTarget.style.backgroundColor = isThisLoading ? '#15803d' : '#b81519'; }}
                                    onMouseLeave={e => { if (!loadingTicket) e.currentTarget.style.backgroundColor = isThisLoading ? '#16a34a' : '#E31E24'; }}
                                  >
                                    {isThisLoading
                                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> En cours…</>
                                      : <><Edit className="w-3.5 h-3.5" /> Traiter</>}
                                  </button>
                                )}

                                {ownership === 'mine' && (
                                  <button
                                    onClick={() => navigate(`/tech/tickets/${ticket.id}`)}
                                    disabled={!!loadingTicket}
                                    className="action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white flex-shrink-0"
                                    style={{
                                      backgroundColor: '#16a34a',
                                      opacity        : loadingTicket ? 0.5 : 1,
                                      cursor         : loadingTicket ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={e => { if (!loadingTicket) e.currentTarget.style.backgroundColor = '#15803d'; }}
                                    onMouseLeave={e => { if (!loadingTicket) e.currentTarget.style.backgroundColor = '#16a34a'; }}
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Continuer
                                  </button>
                                )}

                                {ownership === 'others' && (
                                  <button
                                    onClick={() => navigate(`/tech/tickets/${ticket.id}`)}
                                    disabled={!!loadingTicket}
                                    className="action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 bg-orange-100 text-orange-700 hover:bg-orange-200"
                                    style={{ opacity: loadingTicket ? 0.5 : 1, cursor: loadingTicket ? 'not-allowed' : 'pointer' }}
                                  >
                                    Traité par {ticket.assignedTo.firstName}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{
                padding: '10px 20px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', background: '#fafafa',
              }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {filtered.length} ticket{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
                </span>
                {hasFilters && (
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    Filtre actif — {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} au total
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </TechnicienLayout>
  );
}