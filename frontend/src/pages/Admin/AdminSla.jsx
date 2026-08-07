import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, Clock, CheckCircle,
  Edit2, Save, X, RefreshCw, ChevronRight,
  ShieldAlert, FileDown, TrendingUp, TrendingDown,
  Loader2, ArrowUpCircle, UserCheck,
  ChevronDown, ChevronUp, MessageSquare, UserCog,
  Send, Flame, Activity, Timer, Bell, Zap,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAllTickets } from '../../api/ticketApi';
import api from '../../api/axios';

const RED      = '#E31E24';
const RED_DARK = '#b81519';
const HEADER_BG = `linear-gradient(135deg, #0a0a0f 0%, #1a0406 40%, ${RED} 100%)`;

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
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  @keyframes float1 {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%       { transform: translateY(-18px) rotate(8deg); }
  }
  @keyframes float2 {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%       { transform: translateY(-12px) rotate(-6deg); }
  }
  @keyframes float3 {
    0%, 100% { transform: translateY(0) scale(1); }
    50%       { transform: translateY(-8px) scale(1.06); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.93) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(227,30,36,0); }
    50%       { box-shadow: 0 0 0 8px rgba(227,30,36,0.12); }
  }

  .as-root { font-family: 'DM Sans', system-ui, sans-serif; }

  .as-skeleton {
    background: linear-gradient(90deg, #f0f0f5 25%, #f8f8fc 50%, #f0f0f5 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }

  .as-stat { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease; }
  .as-stat:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }

  .as-orb-1 { animation: float1 6s ease-in-out infinite; }
  .as-orb-2 { animation: float2 8s ease-in-out infinite 1s; }
  .as-orb-3 { animation: float3 5s ease-in-out infinite 2s; }

  .as-modal-box  { animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
  .as-overlay    { animation: overlayIn 0.2s ease both; }

  .as-section {
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }

  .row-hover:hover        { background: #fafafa !important; }
  .row-breach-hover:hover { background: #fff0f0 !important; }

  .btn-action { transition: all 0.15s; }
  .btn-action:hover { background: ${RED_DARK} !important; }

  .as-refresh-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
  .as-refresh-btn:hover { transform: translateY(-1px) scale(1.03); }
`;

// ════════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════════
function formatDuration(ms) {
  const totalMin = Math.round(Math.abs(ms) / 60000);
  const days  = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins  = totalMin % 60;
  if (days  > 0) return hours > 0 ? `${days}j ${hours}h` : `${days}j`;
  if (hours > 0) return mins  > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

function getRetardMs(ticket) {
  return Date.now() - new Date(ticket.slaDeadline).getTime();
}

function getSeverity(ms) {
  const h = ms / 3600000;
  if (h >= 4) return { label: 'Critique', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', dot: '#dc2626' };
  if (h >= 1) return { label: 'Élevé',    color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', dot: '#ea580c' };
  return           { label: 'Modéré',   color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#d97706' };
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function formatSlaHours(h) {
  if (h >= 24) { const d = Math.floor(h / 24), r = h % 24; return r > 0 ? `${d}j ${r}h` : `${d}j`; }
  return `${h}h`;
}

function formatEscMin(m) {
  if (!m) return '—';
  if (m >= 60) { const h = Math.floor(m / 60), r = m % 60; return r > 0 ? `${h}h ${r}m` : `${h}h`; }
  return `${m} min`;
}

function avgRes(tickets) {
  const resolved = tickets.filter(t => t.slaDeadline && t.status?.finalStatus && t.createdAt);
  if (!resolved.length) return null;
  const avg = resolved.reduce((s, t) =>
    s + (new Date(t.updatedAt || t.createdAt) - new Date(t.createdAt)), 0) / resolved.length;
  return formatDuration(avg);
}

function exportPdf(tickets, title) {
  const rows = tickets.map(t => `<tr>
    <td>#TKT-${String(t.id).padStart(3,'0')}</td><td>${t.title}</td>
    <td>${t.priority?.name ?? '—'}</td><td>${t.status?.name ?? '—'}</td>
    <td>${t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Non assigné'}</td>
    <td>${t.slaDeadline ? new Date(t.slaDeadline).toLocaleString('fr-FR') : '—'}</td>
    <td>${t.slaBreached ? `+${formatDuration(getRetardMs(t))}` : '—'}</td>
    <td>${t.escaladeCount ?? 0}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>${title}</title>
<style>body{font-family:Arial,sans-serif;padding:24px}h1{font-size:18px;color:#E31E24}
p{font-size:11px;color:#6b7280;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f3f4f6;text-align:left;padding:8px;font-size:10px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb}
td{padding:8px;border-bottom:1px solid #f3f4f6}</style></head><body>
<h1>${title}</h1><p>Généré le ${new Date().toLocaleString('fr-FR')} — ${tickets.length} ticket(s)</p>
<table><thead><tr><th>ID</th><th>Titre</th><th>Priorité</th><th>Statut</th>
<th>Technicien</th><th>Deadline</th><th>Retard</th><th>Escalades</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html); win.document.close(); win.focus();
  setTimeout(() => win.print(), 400);
}

const PRIORITY_COLORS = {
  'Critique': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: RED },
  'Haute':    { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', dot: '#f97316' },
  'Moyenne':  { bg: '#fefce8', text: '#a16207', border: '#fde68a', dot: '#eab308' },
  'Basse':    { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
};

const TH_STYLE = {
  padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap',
};
const TD_STYLE = { padding: '12px 16px', fontSize: 14, color: '#374151', verticalAlign: 'middle' };

// ─── Skeleton Row ─────────────────────────────────────────────────
function SkeletonTableRow({ cols = 7 }) {
  const widths = [60, 150, 80, 70, 90, 100, 80, 90];
  return (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div className="as-skeleton" style={{ height: 14, width: widths[i] || 80 }} />
        </td>
      ))}
    </tr>
  );
}

// ════════════════════════════════════════════════════════════════════
//  CUSTOM SELECT
// ════════════════════════════════════════════════════════════════════
function CustomSelect({ value, onChange, options, placeholder, minWidth = 160 }) {
  const [open, setOpen]   = useState(false);
  const [style, setStyle] = useState({});
  const btnRef = useRef(null);
  const ref    = useRef(null);

  const calc = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setStyle({
      position: 'fixed', top: r.bottom + 4, left: r.left,
      width: Math.max(r.width, minWidth), zIndex: 99999,
      maxHeight: Math.min(280, window.innerHeight - r.bottom - 12),
    });
  };

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!open) return;
    const u = () => calc();
    window.addEventListener('scroll', u, true); window.addEventListener('resize', u);
    return () => { window.removeEventListener('scroll', u, true); window.removeEventListener('resize', u); };
  }, [open]);

  const handleOpen = () => { if (!open) calc(); setOpen(o => !o); };
  const selected   = options.find(o => String(o.value) === String(value));
  const hasVal     = selected && String(selected.value) !== '';

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none', minWidth }}>
      <button ref={btnRef} type="button" onClick={handleOpen} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', background: '#fff',
        border: open ? `1.5px solid ${RED}` : '1.5px solid #e5e7eb', borderRadius: 8,
        fontSize: 12, fontWeight: hasVal ? 600 : 400, color: hasVal ? RED : '#6b7280',
        cursor: 'pointer', outline: 'none',
        boxShadow: open ? `0 0 0 3px rgba(227,30,36,.08)` : 'none',
        transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
      }}>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected ? selected.label : (placeholder || 'Sélectionner…')}
        </span>
        {open ? <ChevronUp style={{ width: 12, height: 12, color: RED, flexShrink: 0 }} />
              : <ChevronDown style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />}
      </button>
      {open && (
        <ul style={{
          ...style, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,.10)',
          overflowY: 'auto', margin: 0, padding: '4px', listStyle: 'none', scrollbarWidth: 'thin',
        }}>
          {options.map(opt => {
            const isA = String(opt.value) === String(value);
            return (
              <li key={opt.value}
                onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                style={{
                  padding: '7px 10px', borderRadius: 6, fontSize: 13,
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
        </ul>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════════════
function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" style={{ maxWidth: 320 }}>
      {toasts.map(t => (
        <div key={t.id}
          className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm"
          style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', animation: 'fadeSlideUp 0.3s ease both' }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
          <div>
            <p className="font-semibold text-green-800">{t.titre}</p>
            <p className="text-xs text-green-600 mt-0.5">{t.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  MODAL INTERVENTION
// ════════════════════════════════════════════════════════════════════
function InterventionModal({ ticket, techniciens, onClose, onSuccess }) {
  const [mode,       setMode]       = useState('comment');
  const [comment,    setComment]    = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const retardMs  = getRetardMs(ticket);
  const severity  = getSeverity(retardMs);
  const retardStr = formatDuration(retardMs);

  const techsDisponibles = techniciens.filter(t => {
    if (ticket.assignedTo && t.id === ticket.assignedTo.id) return false;
    if (!t.specialtyCategory) return true;
    return t.specialtyCategory?.name === ticket.category?.name
        || t.specialtyCategory?.id   === ticket.category?.id;
  });

  const handleSubmit = async () => {
    setError('');
    if (mode === 'comment' && !comment.trim()) { setError('Veuillez saisir un commentaire.'); return; }
    if (mode === 'reassign' && !selectedId)    { setError('Veuillez sélectionner un technicien.'); return; }
    setSaving(true);
    try {
      if (mode === 'reassign') {
        await api.post(`/tickets/${ticket.id}/assign/${Number(selectedId)}`);
        if (comment.trim()) {
          await api.post(`/tickets/${ticket.id}/comments`, {
            content: `[RÉASSIGNATION ADMIN — SLA dépassé de ${retardStr}]\n\n${comment.trim()}`,
            interne: true,
          });
        }
        onSuccess('Ticket réassigné avec succès');
      } else {
        await api.post(`/tickets/${ticket.id}/comments`, {
          content: `[INTERVENTION ADMIN — SLA dépassé de ${retardStr}]\n\n${comment.trim()}`,
          interne: true,
        });
        onSuccess("Commentaire d'intervention ajouté");
      }
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'intervention.");
    } finally { setSaving(false); }
  };

  return (
    <div className="as-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(8,8,14,0.6)',
      backdropFilter: 'blur(6px)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="as-modal-box" style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500,
        boxShadow: '0 20px 60px rgba(0,0,0,.18)', overflow: 'hidden',
      }}>
        {/* Header gradient */}
        <div style={{
          background: HEADER_BG, padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div className="as-orb-1" style={{ position:'absolute', top:-40, right:-40, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: severity.bg, color: severity.color, border: `1px solid ${severity.border}` }}>
                  SLA {severity.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fca5a5' }}>
                  +{retardStr} de retard
                </span>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                Intervenir — #TKT-{String(ticket.id).padStart(3, '0')}
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{ticket.title}</p>
              {ticket.category?.name && (
                <span style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  📁 {ticket.category.name}
                </span>
              )}
            </div>
            <button onClick={onClose} style={{
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
              padding: 6, color: 'rgba(255,255,255,0.7)', borderRadius: 8, display: 'flex', alignItems: 'center',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
            {[
              { key: 'comment',  icon: <MessageSquare style={{ width: 14, height: 14 }} />, label: 'Commenter' },
              { key: 'reassign', icon: <UserCog style={{ width: 14, height: 14 }} />,       label: 'Réassigner' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setMode(tab.key)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 12px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                background: mode === tab.key ? '#fff' : 'transparent',
                color: mode === tab.key ? RED : '#6b7280',
                boxShadow: mode === tab.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 24px' }}>
          {mode === 'comment' && (
            <div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                Le commentaire sera ajouté en note interne dans le fil du ticket.
              </p>
              <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Ex : Contacté le client, solution prévue dans 2h…"
                style={{
                  width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10,
                  padding: '10px 14px', fontSize: 14, color: '#374151',
                  resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
                  fontFamily: 'inherit', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = RED}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
            </div>
          )}
          {mode === 'reassign' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Techniciens spécialisés en <span style={{ color: RED }}>{ticket.category?.name || 'cette catégorie'}</span>
                </p>
                {techsDisponibles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', fontSize: 14, color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: 10 }}>
                    Aucun technicien spécialisé disponible
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {techsDisponibles.map(tech => {
                      const isSel = String(selectedId) === String(tech.id);
                      return (
                        <button key={tech.id} type="button" onClick={() => setSelectedId(String(Number(tech.id)))} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                          borderRadius: 10, border: `1.5px solid ${isSel ? RED : '#e5e7eb'}`,
                          background: isSel ? '#fff1f1' : '#fff',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
                        }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: isSel ? RED : '#e5e7eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isSel ? '#fff' : '#6b7280', fontSize: 13, fontWeight: 700, flexShrink: 0,
                          }}>
                            {tech.firstName?.charAt(0)}{tech.lastName?.charAt(0)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>
                              {tech.firstName} {tech.lastName}
                            </p>
                            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                              {tech.specialtyCategory ? `Spécialité : ${tech.specialtyCategory.name}` : 'Généraliste'}
                            </p>
                          </div>
                          {isSel && <CheckCircle style={{ width: 15, height: 15, color: RED, flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6 }}>
                  Motif <span style={{ fontWeight: 400 }}>(optionnel)</span>
                </p>
                <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Ex : Technicien initial absent…"
                  style={{
                    width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10,
                    padding: '8px 12px', fontSize: 14, resize: 'none', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = RED}
                  onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>
          )}
          {error && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 8 }}>
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            color: '#6b7280', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          }}>Annuler</button>
          <button onClick={handleSubmit}
            disabled={saving || (mode === 'reassign' && !selectedId) || (mode === 'comment' && !comment.trim())}
            style={{
              padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              color: '#fff', border: 'none', background: RED, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: (saving || (mode === 'reassign' && !selectedId) || (mode === 'comment' && !comment.trim())) ? 0.5 : 1,
            }}>
            {saving
              ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />En cours…</>
              : mode === 'comment'
                ? <><Send style={{ width: 14, height: 14 }} />Envoyer</>
                : <><UserCog style={{ width: 14, height: 14 }} />Réassigner</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  SECTION WRAPPER
// ════════════════════════════════════════════════════════════════════
function Section({ title, subtitle, badge, badgeColor, actions, children, borderColor, delay = 0 }) {
  return (
    <div className="as-section" style={{
      border: `1px solid ${borderColor || '#e5e7eb'}`,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        borderBottom: `1px solid ${borderColor || '#e5e7eb'}`,
        background: borderColor ? `${borderColor}18` : '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
              {badge !== undefined && (
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: badgeColor ? `${badgeColor}18` : '#f3f4f6',
                  color: badgeColor || '#6b7280',
                  border: `1px solid ${badgeColor ? `${badgeColor}30` : '#e5e7eb'}`,
                }}>{badge}</span>
              )}
            </div>
            {subtitle && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────
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
    <div className="as-stat" style={{
      background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.95)', borderRadius: 16,
      padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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

// ════════════════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════
export default function AdminSla() {
  const [tickets,      setTickets]      = useState([]);
  const [priorities,   setPriorities]   = useState([]);
  const [techniciens,  setTechniciens]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editingId,    setEditingId]    = useState(null);
  const [editForm,     setEditForm]     = useState({ slaHours: '', escaladeMinutes: '' });
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState('');
  const [filter,       setFilter]       = useState({ priority: '', tech: '' });
  const [toasts,       setToasts]       = useState([]);
  const [intervention, setIntervention] = useState(null);

  const pollingRef = useRef(null);
  const prevRef    = useRef({});
  const navigate   = useNavigate();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [ticketsRes, priRes, techRes] = await Promise.all([
        getAllTickets(),
        api.get('/admin/priorities/active'),
        api.get('/admin/users?role=TECHNICIEN'),
      ]);
      const newTickets = ticketsRes.data;
      newTickets.forEach(t => {
        const was = prevRef.current[t.id] === null;
        const now = t.assignedTo != null;
        if (was && now) {
          const id = Date.now() + t.id;
          setToasts(p => [...p, {
            id,
            titre: `✅ Ticket #TKT-${String(t.id).padStart(3,'0')} escaladé`,
            message: `Assigné à ${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
          }]);
          setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 6000);
        }
        prevRef.current[t.id] = t.assignedTo ?? null;
      });
      setTickets(newTickets);
      setPriorities(priRes.data);
      setTechniciens((techRes.data || []).filter(u => u.role === 'TECHNICIEN' && u.enabled !== false));
    } catch (e) { console.error(e); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const schedule = () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
      pollingRef.current = setTimeout(async () => { await fetchData(true); schedule(); }, 60_000);
    };
    schedule();
    return () => { if (pollingRef.current) clearTimeout(pollingRef.current); };
  }, [fetchData]);

  const handleInterventionSuccess = useCallback(msg => {
    const id = Date.now();
    setToasts(p => [...p, { id, titre: '✅ Intervention effectuée', message: msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
    fetchData(true);
  }, [fetchData]);

  // ── Dérivés ──────────────────────────────────────────────────────
  const slaBreached  = tickets.filter(t => t.slaBreached).length;
  const slaRespected = tickets.filter(t => t.slaDeadline && !t.slaBreached && t.status?.finalStatus).length;
  const totalSlaFini = slaBreached + slaRespected;
  const tauxSla      = totalSlaFini > 0 ? Math.round((slaRespected / totalSlaFini) * 100) : 0;

  const ticketsRisque = tickets.filter(t => {
    if (!t.slaDeadline || t.slaBreached || t.status?.finalStatus) return false;
    const diff  = new Date(t.slaDeadline) - new Date();
    const total = (t.slaTotalMinutes || 60) * 60000;
    return diff > 0 && (1 - diff / total) >= 0.8;
  }).sort((a, b) => new Date(a.slaDeadline) - new Date(b.slaDeadline));

  const breachResolution = tickets
    .filter(t => t.slaBreached && !t.status?.finalStatus)
    .sort((a, b) => getRetardMs(b) - getRetardMs(a));

  const breachPriseEnCharge = tickets
    .filter(t => {
      if (t.status?.finalStatus) return false;
      if (!t.slaDeadline) return false;
      const delaiDepasse = new Date(t.slaDeadline) < new Date();
      const aEteEscalade = (t.escaladeCount ?? 0) > 0;
      return delaiDepasse || aEteEscalade;
    })
    .sort((a, b) => {
      if (!a.assignedTo && b.assignedTo) return -1;
      if (a.assignedTo && !b.assignedTo)  return  1;
      return new Date(a.slaDeadline) - new Date(b.slaDeadline);
    });

  const techsInBreach = useMemo(() => {
    const s = new Set();
    breachResolution.forEach(t => {
      if (t.assignedTo) s.add(`${t.assignedTo.firstName} ${t.assignedTo.lastName}`);
    });
    return Array.from(s);
  }, [breachResolution]);

  const breachFiltered = useMemo(() => breachResolution
    .filter(t => !filter.priority || t.priority?.name === filter.priority)
    .filter(t => {
      if (!filter.tech) return true;
      if (filter.tech === 'none') return !t.assignedTo;
      return `${t.assignedTo?.firstName} ${t.assignedTo?.lastName}` === filter.tech;
    }), [breachResolution, filter]);

  const handleEdit   = p => { setEditingId(p.id); setEditForm({ slaHours: String(p.slaHours), escaladeMinutes: String(p.escaladeMinutes || 30) }); setSaveMsg(''); };
  const handleCancel = () => { setEditingId(null); setEditForm({ slaHours: '', escaladeMinutes: '' }); };
  const handleSave   = async priority => {
    const hours = Number(editForm.slaHours), minutes = Number(editForm.escaladeMinutes);
    if (!hours || hours <= 0 || !minutes || minutes <= 0) return;
    setSaving(true);
    try {
      await api.put(`/admin/priorities/${priority.id}`, {
        name: priority.name, level: priority.level, color: priority.color,
        slaHours: hours, escaladeMinutes: minutes,
      });
      setSaveMsg('Modifié avec succès'); setEditingId(null); await fetchData(true);
    } catch { setSaveMsg('Erreur lors de la modification'); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(''), 3000); }
  };

  const inputStyle = {
    width: 68, padding: '5px 8px', border: '1.5px solid #e5e7eb',
    borderRadius: 7, fontSize: 13, outline: 'none', textAlign: 'center',
    color: '#374151', fontFamily: 'inherit', transition: 'border-color 0.15s',
  };

  if (loading) return (
    <AdminLayout>
      <style>{GLOBAL_STYLES}</style>
      <div className="as-root" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
        {/* Title skeleton */}
        <div style={{ animation: 'fadeSlideUp 0.45s ease both' }}>
          <div className="as-skeleton" style={{ height: 28, width: 220, marginBottom: 8 }} />
          <div className="as-skeleton" style={{ height: 14, width: 320 }} />
        </div>
        {/* Stat skeletons */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:14 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:16, padding:'16px 18px', border:'1px solid #e5e7eb', animation:`fadeSlideUp 0.45s ease ${i*60}ms both` }}>
              <div className="as-skeleton" style={{ height:12, width:100, marginBottom:12 }}/>
              <div className="as-skeleton" style={{ height:26, width:60 }}/>
            </div>
          ))}
        </div>
        {/* Section skeleton */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', overflow:'hidden', animation:'fadeSlideUp 0.45s ease 0.2s both' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #e5e7eb', display:'flex', gap:12 }}>
            <div className="as-skeleton" style={{ height:16, width:200 }}/>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <style>{GLOBAL_STYLES}</style>
      <div className="as-root">

        <Toast toasts={toasts} />
        {intervention && (
          <InterventionModal
            ticket={intervention}
            techniciens={techniciens}
            onClose={() => setIntervention(null)}
            onSuccess={handleInterventionSuccess}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>

          {/* ── Titre simple ── */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
            animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
                Gestion des SLA
              </h1>
              <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 13.5 }}>
                Service Level Agreements · Escalade automatique · Suivi des dépassements
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {breachResolution.length > 0 && (
                <button onClick={() => exportPdf(breachResolution, 'Rapport SLA — Dépassements')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    color: '#374151', background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}>
                  <FileDown size={14} /> Exporter PDF
                </button>
              )}
              <button onClick={() => fetchData(false)}
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
            </div>
          </div>

          {/* ── Bannière alerte ── */}
          {breachResolution.length > 0 && (
            <div style={{
              display:'flex', alignItems:'center', gap:16, padding:'14px 20px',
              borderRadius:12, border:'1.5px solid #fca5a5',
              background:'linear-gradient(135deg,#fff5f5,#fff)',
              animation:'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.05s both',
            }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Bell style={{ width:18, height:18, color:RED }}/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#991b1b', margin:0 }}>
                  {breachResolution.length} ticket{breachResolution.length>1?'s':''} dépassent le SLA résolution — votre intervention est requise
                </p>
                <p style={{ fontSize:12, color:'#f87171', margin:'2px 0 0' }}>
                  Utilisez le bouton <strong>Intervenir</strong> pour commenter ou réassigner
                </p>
              </div>
              <span style={{ fontSize:30, fontWeight:900, color:RED, flexShrink:0 }}>{breachResolution.length}</span>
            </div>
          )}

          {/* ── KPI StatCards ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14 }}>
            <StatCard label="Taux SLA respectés" value={tauxSla}      Icon={ShieldCheck}  color="green" delay={0}   />
            <StatCard label="Dépassements actifs" value={slaBreached}  Icon={ShieldAlert}  color="red"   delay={60}  />
          </div>

          {/* ══════════════════════════════════════════════════════════
              CONFIGURATION SLA PAR PRIORITÉ
          ══════════════════════════════════════════════════════════ */}
          <Section
            title="Configuration SLA par priorité"
            subtitle="Délai de résolution et temps d'escalade automatique par niveau de priorité"
            delay={100}
            actions={
              saveMsg ? (
                <span style={{
                  fontSize:13, fontWeight:600, padding:'4px 12px', borderRadius:8,
                  background: saveMsg.includes('succès') ? '#f0fdf4' : '#fff1f1',
                  color: saveMsg.includes('succès') ? '#16a34a' : RED,
                  border: `1px solid ${saveMsg.includes('succès') ? '#bbf7d0' : '#fecaca'}`,
                  animation: 'fadeSlideUp 0.3s ease both',
                }}>{saveMsg}</span>
              ) : null
            }
          >
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                <thead>
                  <tr>
                    {['Priorité','Délai résolution','Escalade auto','Tickets actifs','Taux respect','Moy. résolution',''].map((h,i) => (
                      <th key={`th-${i}`} style={{ ...TH_STYLE, textAlign: i===6 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priorities.map((p, idx) => {
                    const pColor  = PRIORITY_COLORS[p.name] || PRIORITY_COLORS['Basse'];
                    const tByPri  = tickets.filter(t => t.priority?.name === p.name);
                    const actifs  = tByPri.filter(t => !t.status?.finalStatus).length;
                    const breachP = tByPri.filter(t => t.slaBreached).length;
                    const respP   = tByPri.filter(t => t.slaDeadline && !t.slaBreached && t.status?.finalStatus).length;
                    const totalP  = breachP + respP;
                    const tauxP   = totalP > 0 ? Math.round((respP / totalP) * 100) : 100;
                    const avgR    = avgRes(tByPri);
                    const isLast  = idx === priorities.length - 1;

                    return (
                      <tr key={p.id} className="row-hover" style={{
                        background:'#fff', borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                        transition: 'background 0.15s',
                      }}>
                        <td style={TD_STYLE}>
                          <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background:pColor.bg, color:pColor.text, border:`1px solid ${pColor.border}` }}>{p.name}</span>
                        </td>
                        <td style={TD_STYLE}>
                          {editingId === p.id ? (
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <input type="number" min="1" value={editForm.slaHours}
                                onChange={e => setEditForm(f => ({ ...f, slaHours: e.target.value }))}
                                style={inputStyle}
                                onFocus={e => e.target.style.borderColor = RED}
                                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
                              <span style={{ fontSize:12, color:'#9ca3af' }}>h</span>
                            </div>
                          ) : (
                            <span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{formatSlaHours(p.slaHours)}</span>
                          )}
                        </td>
                        <td style={TD_STYLE}>
                          {editingId === p.id ? (
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <input type="number" min="1" value={editForm.escaladeMinutes}
                                onChange={e => setEditForm(f => ({ ...f, escaladeMinutes: e.target.value }))}
                                style={inputStyle}
                                onFocus={e => e.target.style.borderColor = RED}
                                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
                              <span style={{ fontSize:12, color:'#9ca3af' }}>min</span>
                            </div>
                          ) : (
                            <span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{formatEscMin(p.escaladeMinutes)}</span>
                          )}
                        </td>
                        <td style={TD_STYLE}>
                          <span style={{ fontSize:14, color:'#374151' }}>{actifs}</span>
                          {breachP > 0 && (
                            <span style={{ marginLeft:8, fontSize:12, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'#fef2f2', color:RED }}>
                              {breachP} dépassé{breachP>1?'s':''}
                            </span>
                          )}
                        </td>
                        <td style={TD_STYLE}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:68, height:5, borderRadius:4, background:'#e5e7eb', overflow:'hidden', flexShrink:0 }}>
                              <div style={{
                                height:'100%', borderRadius:4, transition:'width 0.6s cubic-bezier(0.22,1,0.36,1)',
                                width:`${tauxP}%`,
                                background: tauxP >= 80 ? '#22c55e' : tauxP >= 50 ? '#f59e0b' : RED,
                              }}/>
                            </div>
                            <span style={{ fontSize:13, fontWeight:700, color: tauxP>=80?'#16a34a':tauxP>=50?'#d97706':RED }}>{tauxP}%</span>
                          </div>
                        </td>
                        <td style={{ ...TD_STYLE, fontSize:13, color:'#9ca3af' }}>{avgR ?? '—'}</td>
                        <td style={{ ...TD_STYLE, textAlign:'right' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:6 }}>
                            {editingId === p.id ? (
                              <>
                                <button onClick={() => handleSave(p)} disabled={saving} style={{
                                  display:'inline-flex', alignItems:'center', gap:5,
                                  padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:700,
                                  color:'#fff', border:'none', background:'#16a34a', cursor:'pointer', fontFamily:'inherit',
                                  transition: 'background 0.15s',
                                }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
                                  onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}>
                                  <Save style={{ width:12, height:12 }}/> {saving ? '…' : 'Sauvegarder'}
                                </button>
                                <button onClick={handleCancel} style={{
                                  display:'inline-flex', alignItems:'center', gap:5,
                                  padding:'6px 10px', borderRadius:7, fontSize:12,
                                  color:'#6b7280', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontFamily:'inherit',
                                }}>
                                  <X style={{ width:12, height:12 }}/> Annuler
                                </button>
                              </>
                            ) : (
                              <button className="btn-action" onClick={() => handleEdit(p)} style={{
                                display:'inline-flex', alignItems:'center', gap:5,
                                padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:700,
                                color:'#fff', border:'none', background:RED, cursor:'pointer', fontFamily:'inherit',
                              }}>
                                <Edit2 style={{ width:12, height:12 }}/> Modifier
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
          </Section>

          {/* ══════════════════════════════════════════════════════════
              DÉPASSEMENTS SLA RÉSOLUTION
          ══════════════════════════════════════════════════════════ */}
          <Section
            title="Dépassements SLA Résolution"
            subtitle="Tickets non résolus dans les délais — votre intervention est requise"
            badge={breachResolution.length > 0 ? `${breachResolution.length} ticket${breachResolution.length>1?'s':''}` : 'Aucun'}
            badgeColor={breachResolution.length > 0 ? RED : '#16a34a'}
            borderColor={breachResolution.length > 0 ? '#fca5a5' : undefined}
            delay={200}
            actions={
              breachResolution.length > 0 ? (
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <CustomSelect value={filter.priority} onChange={v => setFilter(f => ({ ...f, priority: v }))}
                    options={[{ value:'', label:'Toutes priorités' },{ value:'Critique', label:'Critique' },{ value:'Haute', label:'Haute' },{ value:'Moyenne', label:'Moyenne' },{ value:'Basse', label:'Basse' }]} minWidth={130} />
                  <CustomSelect value={filter.tech} onChange={v => setFilter(f => ({ ...f, tech: v }))}
                    options={[{ value:'', label:'Tous techniciens' },{ value:'none', label:'Non assigné' },...techsInBreach.map(t => ({ value:t, label:t }))]} minWidth={140} />
                  {(filter.priority || filter.tech) && (
                    <button onClick={() => setFilter({ priority:'', tech:'' })}
                      style={{ fontSize:12, color:'#9ca3af', border:'none', background:'none', cursor:'pointer', textDecoration:'underline', fontFamily:'inherit' }}>
                      Réinitialiser
                    </button>
                  )}
                </div>
              ) : null
            }
          >
            {breachResolution.length === 0 ? (
              <div style={{ padding:'32px 20px', textAlign:'center', animation:'fadeSlideUp 0.4s ease both' }}>
                <ShieldCheck style={{ width:32, height:32, color:'#22c55e', margin:'0 auto 10px' }}/>
                <p style={{ fontSize:14, fontWeight:600, color:'#374151', margin:0 }}>Aucun dépassement de résolution</p>
                <p style={{ fontSize:13, color:'#9ca3af', margin:'4px 0 0' }}>Tous les tickets sont traités dans les délais</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
                    <thead>
                      <tr>
                        {['Ticket','Priorité','Catégorie','Retard','Sévérité','Technicien','Deadline','Intervention'].map((h,i) => (
                          <th key={`th-breach-${i}`} style={{ ...TH_STYLE, textAlign: i===7 ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {breachFiltered.map((ticket, idx) => {
                        const pColor   = PRIORITY_COLORS[ticket.priority?.name] || PRIORITY_COLORS['Basse'];
                        const retardMs = getRetardMs(ticket);
                        const severity = getSeverity(retardMs);
                        const isLast   = idx === breachFiltered.length - 1;
                        return (
                          <tr key={ticket.id} className="row-breach-hover" style={{
                            background: idx%2===0 ? '#fff' : '#fffafa',
                            borderBottom: isLast ? 'none' : '1px solid #fef2f2',
                            transition: 'background 0.15s',
                          }}>
                            <td style={TD_STYLE}>
                              <button onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                                style={{ border:'none', background:'none', cursor:'pointer', padding:0, textAlign:'left', fontFamily:'inherit' }}>
                                <span style={{ fontSize:12, fontWeight:700, color:'#9ca3af' }}>
                                  #TKT-{String(ticket.id).padStart(3,'0')}
                                </span>
                                <p style={{ fontSize:13, color:'#374151', margin:'2px 0 0', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {ticket.title}
                                </p>
                              </button>
                            </td>
                            <td style={TD_STYLE}>
                              <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background:pColor.bg, color:pColor.text, border:`1px solid ${pColor.border}` }}>
                                {ticket.priority?.name}
                              </span>
                            </td>
                            <td style={{ ...TD_STYLE, fontSize:13, color:'#6b7280' }}>{ticket.category?.name || '—'}</td>
                            <td style={TD_STYLE}>
                              <span style={{ fontSize:14, fontWeight:700, color:RED }}>+{formatDuration(retardMs)}</span>
                            </td>
                            <td style={TD_STYLE}>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ width:7, height:7, borderRadius:'50%', background:severity.dot, display:'inline-block', animation:'pulse 2s ease-in-out infinite' }}/>
                                <span style={{ fontSize:12, fontWeight:600, padding:'3px 9px', borderRadius:20, background:severity.bg, color:severity.color, border:`1px solid ${severity.border}` }}>
                                  {severity.label}
                                </span>
                              </div>
                            </td>
                            <td style={TD_STYLE}>
                              {ticket.assignedTo ? (
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div style={{ width:30, height:30, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#6b7280', flexShrink:0 }}>
                                    {ticket.assignedTo.firstName?.charAt(0)}{ticket.assignedTo.lastName?.charAt(0)}
                                  </div>
                                  <span style={{ fontSize:13, color:'#374151' }}>{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                                </div>
                              ) : (
                                <span style={{ fontSize:13, color:'#d97706', fontStyle:'italic' }}>Non assigné</span>
                              )}
                            </td>
                            <td style={{ ...TD_STYLE, fontSize:13, color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtDate(ticket.slaDeadline)}</td>
                            <td style={{ ...TD_STYLE, textAlign:'right' }}>
                              <button className="btn-action" onClick={() => setIntervention(ticket)}
                                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700, color:'#fff', border:'none', background:RED, cursor:'pointer', fontFamily:'inherit' }}>
                                <Activity style={{ width:13, height:13 }}/> Intervenir
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #fef2f2', background:'#fffafa' }}>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>
                    {breachFiltered.length} ticket{breachFiltered.length!==1?'s':''} affiché{breachFiltered.length!==1?'s':''}
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color:RED }}>
                    Retard cumulé : {formatDuration(breachFiltered.reduce((s, t) => s + getRetardMs(t), 0))}
                  </span>
                </div>
              </>
            )}
          </Section>

          {/* ══════════════════════════════════════════════════════════
              DÉPASSEMENTS SLA PRISE EN CHARGE
          ══════════════════════════════════════════════════════════ */}
          <Section
            title="Dépassements SLA Prise en charge"
            subtitle="Tickets escaladés automatiquement — en attente d'assignation"
            badge={breachPriseEnCharge.length > 0 ? `${breachPriseEnCharge.length} escalade${breachPriseEnCharge.length>1?'s':''}` : 'Aucune'}
            badgeColor={breachPriseEnCharge.length > 0 ? '#d97706' : '#16a34a'}
            borderColor={breachPriseEnCharge.length > 0 ? '#fde68a' : undefined}
            delay={300}
          >
            {breachPriseEnCharge.length === 0 ? (
              <div style={{ padding:'28px 20px', textAlign:'center', animation:'fadeSlideUp 0.4s ease both' }}>
                <CheckCircle style={{ width:28, height:28, color:'#22c55e', margin:'0 auto 8px' }}/>
                <p style={{ fontSize:14, fontWeight:600, color:'#374151', margin:0 }}>Aucune escalade en attente</p>
                <p style={{ fontSize:13, color:'#9ca3af', margin:'3px 0 0' }}>Tous les tickets ont été pris en charge dans les délais</p>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:650 }}>
                  <thead>
                    <tr>
                      {['Ticket','Priorité','Catégorie','Escalades','Créé le','Technicien assigné','Statut'].map((h,i) => (
                        <th key={`th-pec-${i}`} style={{ ...TH_STYLE, textAlign:'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {breachPriseEnCharge.map((ticket, idx) => {
                      const pColor = PRIORITY_COLORS[ticket.priority?.name] || PRIORITY_COLORS['Basse'];
                      const isLast = idx === breachPriseEnCharge.length - 1;
                      return (
                        <tr key={ticket.id} className="row-hover" style={{
                          background:'#fff', borderBottom: isLast ? 'none' : '1px solid #f3f4f6', transition:'background 0.15s',
                        }}>
                          <td style={TD_STYLE}>
                            <button onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                              style={{ border:'none', background:'none', cursor:'pointer', padding:0, textAlign:'left', fontFamily:'inherit' }}>
                              <span style={{ fontSize:12, fontWeight:700, color:'#9ca3af' }}>
                                #TKT-{String(ticket.id).padStart(3,'0')}
                              </span>
                              <p style={{ fontSize:13, color:'#374151', margin:'2px 0 0', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {ticket.title}
                              </p>
                            </button>
                          </td>
                          <td style={TD_STYLE}>
                            <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background:pColor.bg, color:pColor.text, border:`1px solid ${pColor.border}` }}>
                              {ticket.priority?.name}
                            </span>
                          </td>
                          <td style={{ ...TD_STYLE, fontSize:13, color:'#6b7280' }}>{ticket.category?.name || '—'}</td>
                          <td style={TD_STYLE}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <ArrowUpCircle style={{ width:14, height:14, color:'#d97706' }}/>
                              <span style={{ fontSize:14, fontWeight:600, color:'#d97706' }}>{ticket.escaladeCount}</span>
                            </div>
                          </td>
                          <td style={{ ...TD_STYLE, fontSize:13, color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtDate(ticket.createdAt)}</td>
                          <td style={TD_STYLE}>
                            {ticket.assignedTo ? (
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:28, height:28, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:RED, flexShrink:0 }}>
                                  {ticket.assignedTo.firstName?.charAt(0)}{ticket.assignedTo.lastName?.charAt(0)}
                                </div>
                                <span style={{ fontSize:13, color:'#374151' }}>{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize:13, color:'#9ca3af', fontStyle:'italic' }}>En attente…</span>
                            )}
                          </td>
                          <td style={TD_STYLE}>
                            {ticket.assignedTo ? (
                              <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', display:'inline-flex', alignItems:'center', gap:5 }}>
                                <CheckCircle style={{ width:11, height:11 }}/> Escaladé et assigné
                              </span>
                            ) : (
                              <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background:'#fff7ed', color:'#d97706', border:'1px solid #fed7aa', display:'inline-flex', alignItems:'center', gap:5 }}>
                                <Loader2 style={{ width:11, height:11, animation:'spin 1s linear infinite' }}/> En attente d'assignation
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ══════════════════════════════════════════════════════════
              TICKETS À RISQUE
          ══════════════════════════════════════════════════════════ */}
          {ticketsRisque.length > 0 && (
            <Section
              title="Tickets à risque"
              subtitle="Approchent de leur deadline SLA"
              badge={`${ticketsRisque.length}`}
              badgeColor="#d97706"
              borderColor="#fde68a"
              delay={400}
            >
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:580 }}>
                  <thead>
                    <tr>
                      {['Ticket','Priorité','Catégorie','Technicien','Temps restant',''].map((h,i) => (
                        <th key={`th-risk-${i}`} style={{ ...TH_STYLE, textAlign: i===5 ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsRisque.map((t, idx) => {
                      const pColor = PRIORITY_COLORS[t.priority?.name] || PRIORITY_COLORS['Basse'];
                      const diff   = new Date(t.slaDeadline) - new Date();
                      const isLast = idx === ticketsRisque.length - 1;
                      return (
                        <tr key={t.id} className="row-hover" style={{ background:'#fff', borderBottom: isLast ? 'none' : '1px solid #f3f4f6', transition:'background 0.15s' }}>
                          <td style={TD_STYLE}>
                            <span style={{ fontSize:12, fontWeight:700, color:'#9ca3af' }}>
                              #TKT-{String(t.id).padStart(3,'0')}
                            </span>
                            <p style={{ fontSize:13, color:'#374151', margin:'2px 0 0', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {t.title}
                            </p>
                          </td>
                          <td style={TD_STYLE}>
                            <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background:pColor.bg, color:pColor.text, border:`1px solid ${pColor.border}` }}>
                              {t.priority?.name}
                            </span>
                          </td>
                          <td style={{ ...TD_STYLE, fontSize:13, color:'#6b7280' }}>{t.category?.name || '—'}</td>
                          <td style={{ ...TD_STYLE, fontSize:13, color:'#6b7280' }}>
                            {t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : <span style={{ fontStyle:'italic', color:'#d1d5db' }}>—</span>}
                          </td>
                          <td style={TD_STYLE}>
                            <span style={{ fontSize:13, fontWeight:600, padding:'3px 10px', borderRadius:20, background:'#fffbeb', color:'#b45309', border:'1px solid #fde68a' }}>
                              {formatDuration(diff)} restant
                            </span>
                          </td>
                          <td style={{ ...TD_STYLE, textAlign:'right' }}>
                            <button onClick={() => navigate(`/admin/tickets/${t.id}`)}
                              style={{ border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', padding:'5px 8px', borderRadius:7, color:'#9ca3af', display:'inline-flex', alignItems:'center', transition:'all 0.15s', fontFamily:'inherit' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#9ca3af'; }}>
                              <ChevronRight style={{ width:14, height:14 }}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* ── Tout va bien ── */}
          {breachResolution.length === 0 && ticketsRisque.length === 0 && (
            <div style={{
              background:'#fff', borderRadius:14, border:'1px solid #e5e7eb',
              padding:'48px 20px', textAlign:'center',
              boxShadow:'0 1px 4px rgba(0,0,0,.04)',
              animation:'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.35s both',
            }}>
              <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,#dcfce7,#bbf7d0)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', border:'1px solid #86efac' }}>
                <ShieldCheck style={{ width:30, height:30, color:'#16a34a' }}/>
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:0 }}>Tous les SLA sont respectés</h3>
              <p style={{ fontSize:13, color:'#9ca3af', margin:'6px 0 0' }}>Aucun ticket ne dépasse ou n'approche sa deadline</p>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
