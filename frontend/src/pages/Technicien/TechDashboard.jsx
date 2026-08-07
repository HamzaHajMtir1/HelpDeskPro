import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Ticket, Clock, CheckCircle, AlertTriangle, ArrowRight,
  ChevronRight, Flame, ShieldCheck, ShieldAlert,
  User, Tag, RefreshCw, Zap, TrendingUp, Star, Activity
} from 'lucide-react';
import TechnicienLayout from '../../layouts/TechnicienLayout';
import { getAssignedTickets } from '../../api/ticketApi';
import { useSettings } from '../../context/SettingsContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: CountUp
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(end, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    if (startedRef.current) return;
    const timeout = setTimeout(() => {
      startedRef.current = true;
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed  = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setCount(Math.round(end * (1 - Math.pow(1 - progress, 3))));
        if (progress >= 1) clearInterval(timer);
      }, 16);
    }, delay);
    return () => clearTimeout(timeout);
  }, [end, duration, delay]);
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: Live SLA Countdown (tick chaque seconde)
// ─────────────────────────────────────────────────────────────────────────────
function useLiveSLA(slaDeadline) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!slaDeadline) return;
    const compute = () => {
      const diff = new Date(slaDeadline) - new Date();
      if (diff <= 0) {
        setTimeLeft({ text: 'Dépassé', color: '#E31E24', bg: '#fff1f1', urgent: true, breached: true });
        return;
      }
      const totalMin = Math.floor(diff / 60000);
      const h        = Math.floor(totalMin / 60);
      const m        = totalMin % 60;
      const s        = Math.floor((diff % 60000) / 1000);
      const urgent   = diff < 3600000; // < 1h
      const text = urgent
        ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : h > 0 ? `${h}h ${m}m` : `${m}m`;
      setTimeLeft({ text, color: urgent ? '#E31E24' : '#16a34a', bg: urgent ? '#fff1f1' : '#f0fdf4', urgent, breached: false });
    };
    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [slaDeadline]);

  return timeLeft;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatTimeLeft(slaDeadline) {
  if (!slaDeadline) return null;
  const diff = new Date(slaDeadline) - new Date();
  if (diff <= 0) return { text: 'Dépassé', color: '#E31E24', bg: '#fff1f1', urgent: true };
  const totalMin = Math.floor(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const urgent = diff < 3600000;
  return { text: h > 0 ? `${h}h ${m}m` : `${m}m`, color: urgent ? '#d97706' : '#16a34a', bg: urgent ? '#fffbeb' : '#f0fdf4', urgent };
}

const PRIORITY_STYLE = {
  Critique: { dot: '#E31E24', bg: '#fff1f1', text: '#E31E24', ring: '#fecaca' },
  Haute:    { dot: '#f97316', bg: '#fff7ed', text: '#ea580c', ring: '#fed7aa' },
  Moyenne:  { dot: '#eab308', bg: '#fefce8', text: '#ca8a04', ring: '#fde68a' },
  Basse:    { dot: '#94a3b8', bg: '#f8fafc', text: '#64748b', ring: '#e2e8f0' },
};

const STATUS_STYLE = {
  'Nouveau':    { color: '#6366f1', bg: '#eef2ff', label: 'Nouveau'    },
  'En cours':   { color: '#0ea5e9', bg: '#f0f9ff', label: 'En cours'   },
  'En attente': { color: '#f59e0b', bg: '#fffbeb', label: 'En attente' },
  'Résolu':     { color: '#22c55e', bg: '#f0fdf4', label: 'Résolu'     },
  'Fermé':      { color: '#94a3b8', bg: '#f8fafc', label: 'Fermé'      },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: StatCard avec CountUp + animation
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, sub, accent, loading, delay = 0 }) {
  const animated = useCountUp(loading ? 0 : value, 1300, delay);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="stat-card-enter"
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? accent + '40' : '#f1f5f9'}`,
        borderRadius: 16,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: hovered ? `0 8px 28px ${accent}20` : '0 1px 3px rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        borderRadius: '16px 16px 0 0',
        background: accent,
        transform: hovered ? 'scaleX(1)' : 'scaleX(0.3)',
        transformOrigin: 'left',
        transition: 'transform 0.4s ease',
      }} />

      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.3s ease',
        transform: hovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)',
      }}>
        <Icon size={18} color={accent} />
      </div>

      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {loading ? '—' : animated}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Ticket Row avec SLA live
// ─────────────────────────────────────────────────────────────────────────────
function TicketRow({ ticket, prefix, onClick }) {
  const liveSla  = useLiveSLA(ticket.slaDeadline);
  const pri      = PRIORITY_STYLE[ticket.priority?.name] || PRIORITY_STYLE.Basse;
  const sta      = STATUS_STYLE[ticket.status?.name]     || STATUS_STYLE['En cours'];
  const breached = ticket.slaBreached;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        cursor: 'pointer', borderRadius: 10, marginBottom: 6,
        background: hovered ? '#f1f5f9' : breached ? '#fff8f8' : '#fafafa',
        border: `1px solid ${breached ? '#fecaca' : liveSla?.urgent ? '#fde68a' : '#f1f5f9'}`,
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        boxShadow: hovered ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      {/* Priorité dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: breached ? '#E31E24' : pri.dot,
        boxShadow: `0 0 0 2px ${breached ? '#fecaca' : pri.ring}`,
        animation: breached ? 'pulse-red 1.5s ease-in-out infinite' : 'none',
      }} />

      {/* ID */}
      <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', flexShrink: 0, width: 72, fontFamily: 'monospace' }}>
        #{prefix}-{String(ticket.id).padStart(3, '0')}
      </span>

      {/* Titre + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ticket.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          {ticket.createdBy && (
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
              <User size={10} /> {ticket.createdBy.firstName} {ticket.createdBy.lastName}
            </span>
          )}
          {ticket.category && (
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Tag size={10} /> {ticket.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Statut badge */}
      <span style={{
        fontSize: 11, fontWeight: 600, color: sta.color, background: sta.bg,
        padding: '2px 8px', borderRadius: 20, flexShrink: 0,
      }}>
        {sta.label}
      </span>

      {/* SLA LIVE countdown */}
      {liveSla && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: liveSla.color, background: liveSla.bg,
          padding: '2px 10px', borderRadius: 20,
          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
          animation: liveSla.urgent ? 'pulse-badge 1.5s ease-in-out infinite' : 'none',
          minWidth: liveSla.urgent ? 80 : 'auto',
          justifyContent: 'center',
        }}>
          <Clock size={10} /> {liveSla.text}
        </span>
      )}

      <ChevronRight size={14} color="#cbd5e1" style={{ flexShrink: 0 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Productivity Score (style gaming)
// ─────────────────────────────────────────────────────────────────────────────
function ProductivityScore({ tauxResolution, resolus, total, slaBreached }) {
  // Score = taux résolution pondéré par SLA
  const slaBonus  = slaBreached === 0 ? 10 : 0;
  const rawScore  = tauxResolution + slaBonus;
  const score     = Math.min(rawScore, 100);
  const animated  = useCountUp(score, 1500, 200);

  const scoreColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#E31E24';
  const scoreBg    = score >= 80 ? '#f0fdf4' : score >= 50 ? '#fffbeb' : '#fff1f1';
  const scoreLabel = score >= 80 ? ' Excellent' : score >= 50 ? '⚡ Bon niveau' : '📈 À améliorer';
  const circumference = 2 * Math.PI * 28;

  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
      padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Score productivité</h2>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Basé sur résolution + SLA</p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
          backgroundColor: scoreBg, color: scoreColor,
        }}>
          {scoreLabel}
        </span>
      </div>

      {/* Cercle SVG animé */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="70" height="70" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="28" fill="none" stroke="#f1f5f9" strokeWidth="7" />
            <circle
              cx="35" cy="35" r="28"
              fill="none"
              stroke={scoreColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
              transform="rotate(-90 35 35)"
              style={{
                transition: 'stroke-dasharray 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {animated}
            </span>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>/ 100</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {[
            { label: 'Résolus',      value: resolus,       max: total,   color: '#22c55e' },
            { label: 'SLA OK',       value: total - slaBreached, max: total,   color: '#3b82f6' },
            { label: 'En attente',   value: slaBreached,   max: total,   color: '#E31E24' },
          ].map(({ label, value, max, color }) => {
            const pct = max > 0 ? (value / max) * 100 : 0;
            return (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 999, background: color,
                    width: `${pct}%`,
                    transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Tooltip personnalisé pour graphiques
// ─────────────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 8,
      padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{label}</p>
      <p style={{ color: '#E31E24', margin: 0 }}>
        {payload[0].value} ticket{payload[0].value > 1 ? 's' : ''}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL: DashboardTech
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardTech() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigate              = useNavigate();
  const { settings }          = useSettings();
  const prefix                = settings?.ticketPrefix || 'TKT';
  const firstName             = localStorage.getItem('firstName') || 'Technicien';

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr  = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const load = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const r = await getAssignedTickets();
      setTickets(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 600);
    }
  };
  useEffect(() => { load(); }, [refresh]);

  // ── Computed ──
  const total       = tickets.length;
  const actifs      = tickets.filter(t => !t.status?.finalStatus);
  const nouveau     = tickets.filter(t => t.status?.name === 'Nouveau').length;
  const enCours     = tickets.filter(t => t.status?.name === 'En cours').length;
  const enAttente   = tickets.filter(t => t.status?.name === 'En attente').length;
  const resolus     = tickets.filter(t => t.status?.name === 'Résolu' || t.status?.name === 'Fermé').length;
  const slaBreached = tickets.filter(t => t.slaBreached).length;
  const slaWarning  = actifs.filter(t => {
    if (!t.slaDeadline || t.slaBreached) return false;
    const diff = new Date(t.slaDeadline) - new Date();
    return diff > 0 && diff < 3600000;
  }).length;
  const tauxResolution = total ? Math.round((resolus / total) * 100) : 0;
  const hasAlerts      = slaBreached > 0 || slaWarning > 0;

  // Trier par urgence SLA
  const ticketsPriority = actifs.filter(t => t.assignedTo).sort((a, b) => {
    if (a.slaBreached && !b.slaBreached) return -1;
    if (!a.slaBreached && b.slaBreached) return  1;
    if (a.slaDeadline && b.slaDeadline) return new Date(a.slaDeadline) - new Date(b.slaDeadline);
    return 0;
  });
  const ticketsNouveaux = tickets.filter(t => t.status?.name === 'Nouveau');

  // Smart greeting
  const smartSub = !loading
    ? slaBreached > 0
      ? ` ${slaBreached} SLA dépassé${slaBreached > 1 ? 's' : ''} — action requise immédiatement`
      : slaWarning > 0
        ? `⚠ ${slaWarning} ticket${slaWarning > 1 ? 's' : ''} proche${slaWarning > 1 ? 's' : ''} de la deadline SLA`
        : nouveau > 0
          ? ` ${nouveau} nouveau${nouveau > 1 ? 'x' : ''} ticket${nouveau > 1 ? 's' : ''} en attente`
          : ` Tout est sous contrôle — ${resolus} ticket${resolus > 1 ? 's' : ''} résolu${resolus > 1 ? 's' : ''}`
    : 'Voici un aperçu de vos tickets assignés';

  // ── Chart data ──
  const ticketsParJour = (() => {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map[d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })] = 0;
    }
    tickets.forEach(t => {
      const key = new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (map[key] !== undefined) map[key]++;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const statusCounts = tickets.reduce((acc, t) => {
    const n = t.status?.name || 'Inconnu'; acc[n] = (acc[n] || 0) + 1; return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const priorityData = Object.entries(
    tickets.reduce((acc, t) => { const n = t.priority?.name || 'Basse'; acc[n] = (acc[n] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value, fill: PRIORITY_STYLE[name]?.dot || '#94a3b8' }))
   .sort((a, b) => ['Critique','Haute','Moyenne','Basse'].indexOf(a.name) - ['Critique','Haute','Moyenne','Basse'].indexOf(b.name));

  return (
    <TechnicienLayout>
      <div style={{ fontFamily: '"DM Sans", system-ui, sans-serif', paddingBottom: 40 }}>

        {/* ══ BANNIÈRE ══ */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden banner-enter"
          style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #E31E24 100%)' }}
        >
          {/* Grille décorative */}
          <div className="absolute inset-0 opacity-5"
               style={{
                 backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                 backgroundSize: '40px 40px',
               }} />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
               style={{ backgroundColor: '#fff', transform: 'translate(30%,-30%)' }} />

          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4, textTransform: 'capitalize' }}>
                {dateStr}
              </p>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
                {greeting}, {firstName} 
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 20 }}>
                {smartSub}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/tech/tickets')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#fff', color: '#E31E24',
                    fontWeight: 700, fontSize: 14, padding: '10px 22px',
                    borderRadius: 12, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Ticket size={16} /> Voir mes tickets
                </button>
                <button
                  onClick={() => setRefresh(r => r + 1)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.15)', color: '#fff',
                    fontWeight: 600, fontSize: 14, padding: '10px 22px',
                    borderRadius: 12, border: '1px solid rgba(255,255,255,0.25)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  <RefreshCw
                    size={15}
                    style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
                  />
                  Actualiser
                </button>
              </div>
            </div>

            {/* Mini stats dans bannière */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {[
                { label: 'Nouveaux', value: loading ? '—' : nouveau,     color: '#fff'    },
                { label: 'En cours', value: loading ? '—' : enCours,     color: '#fde68a' },
                { label: 'Résolus',  value: loading ? '—' : resolus,     color: '#86efac' },
                { label: 'SLA ⚠',   value: loading ? '—' : slaBreached, color: '#fca5a5', urgent: slaBreached > 0 },
              ].map(({ label, value, color, urgent }) => (
                <div key={label} style={{
                  textAlign: 'center', padding: '12px 18px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  animation: urgent ? 'pulse-card 2s ease-in-out infinite' : 'none',
                }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '2px 0 0' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ALERTE SLA ══ */}
        {!loading && hasAlerts && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap', padding: '14px 18px', borderRadius: 12, marginBottom: 20,
            background: slaBreached > 0 ? '#fff1f1' : '#fffbeb',
            border: `1px solid ${slaBreached > 0 ? '#fecaca' : '#fde68a'}`,
            animation: slaBreached > 0 ? 'sla-glow 2s ease-in-out infinite' : 'none',
          }}
            className="sla-alert-enter"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: slaBreached > 0 ? '#fecaca' : '#fde68a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse-icon 1.5s ease-in-out infinite',
              }}>
                <Flame size={15} color={slaBreached > 0 ? '#E31E24' : '#d97706'} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: slaBreached > 0 ? '#991b1b' : '#92400e' }}>
                  {slaBreached > 0
                    ? `${slaBreached} ticket${slaBreached > 1 ? 's ont' : ' a'} dépassé son SLA`
                    : `${slaWarning} ticket${slaWarning > 1 ? 's approchent' : ' approche'} de la deadline`}
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Traitement prioritaire requis</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/tech/tickets')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px',
                borderRadius: 8, border: 'none',
                background: slaBreached > 0 ? '#E31E24' : '#d97706',
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Voir <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* ══ STAT CARDS ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard icon={Ticket}        value={total}       label="Total assignés" sub={`${nouveau} nouveaux`}      accent="#E31E24"  loading={loading} delay={0}   />
          <StatCard icon={Clock}         value={enCours}     label="En cours"       sub={`${enAttente} en attente`}  accent="#0ea5e9"  loading={loading} delay={100} />
          <StatCard icon={CheckCircle}   value={resolus}     label="Résolus"        sub={`Taux ${tauxResolution}%`}  accent="#22c55e"  loading={loading} delay={200} />
          <StatCard icon={AlertTriangle} value={slaBreached} label="SLA dépassés"   sub={`${slaWarning} en alerte`}  accent={slaBreached > 0 ? '#E31E24' : '#94a3b8'} loading={loading} delay={300} />
        </div>

        {/* ══ GRAPHIQUES ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Bar chart */}
          <div style={{
            background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
            padding: '20px 20px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }} className="chart-enter">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
              Activité — 7 derniers jours
            </h3>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 14px' }}>Tickets assignés par jour</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={ticketsParJour} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#E31E24" radius={[6, 6, 0, 0]}
                     isAnimationActive animationDuration={1200} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div style={{
            background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
            padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }} className="chart-enter" style2={{ animationDelay: '150ms' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
              Répartition par statut
            </h3>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>Vue d'ensemble de mes tickets</p>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="48%" innerRadius={48} outerRadius={72}
                    paddingAngle={3} dataKey="value"
                    isAnimationActive animationDuration={1400} animationEasing="ease-out"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_STYLE[entry.name]?.color || ['#6366f1','#0ea5e9','#f59e0b','#22c55e','#94a3b8'][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend iconType="circle" iconSize={8} formatter={(v, e) => (
                    <span style={{ fontSize: 11, color: '#64748b' }}>{v}: <strong>{e.payload.value}</strong></span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 13 }}>
                Aucune donnée
              </div>
            )}
          </div>
        </div>

        {/* ══ MAIN GRID ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

          {/* FILE DE TRAVAIL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
              padding: '20px 20px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="pulse-dot-green" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>File de travail</h2>
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 16px' }}>Triés par urgence SLA · compteur live</p>
                </div>
                <Link to="/tech/tickets" style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, color: '#E31E24', textDecoration: 'none',
                }}>
                  Tous <ArrowRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '3px solid #f1f5f9', borderTopColor: '#E31E24',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto',
                  }} />
                </div>
              ) : ticketsPriority.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  <CheckCircle size={28} color="#22c55e" style={{ margin: '0 auto 8px', display: 'block' }} />
                  Aucun ticket en attente
                </div>
              ) : (
                <div>
                  {ticketsPriority.slice(0, 8).map(t => (
                    <TicketRow
                      key={t.id} ticket={t} prefix={prefix}
                      onClick={() => navigate(`/tech/tickets/${t.id}`)}
                    />
                  ))}
                  {ticketsPriority.length > 8 && (
                    <button
                      onClick={() => navigate('/tech/tickets')}
                      style={{
                        width: '100%', padding: 10, marginTop: 4,
                        background: '#f8fafc', border: '1px dashed #e2e8f0',
                        borderRadius: 10, fontSize: 12, fontWeight: 600,
                        color: '#64748b', cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                    >
                      +{ticketsPriority.length - 8} autres tickets
                    </button>
                  )}
                </div>
              )}
            </div>

            {!loading && ticketsNouveaux.length > 0 && (
              <div style={{
                background: '#fff', border: '1px solid #eef2ff', borderRadius: 16,
                padding: '20px 20px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, background: '#eef2ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Zap size={12} color="#6366f1" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Nouveaux tickets
                    </h2>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                      {ticketsNouveaux.length} en attente de prise en charge
                    </p>
                  </div>
                </div>
                {ticketsNouveaux.slice(0, 3).map(t => (
                  <TicketRow
                    key={t.id} ticket={t} prefix={prefix}
                    onClick={() => navigate(`/tech/tickets/${t.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Productivity Score */}
            <ProductivityScore
              tauxResolution={tauxResolution}
              resolus={resolus}
              total={total}
              slaBreached={slaBreached}
            />

            {/* Répartition priorité */}
            <div style={{
              background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
              padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>
                Par priorité
              </h2>
              {!loading && total > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {priorityData.map(({ name, value, fill }) => {
                    const pct = total ? Math.round((value / total) * 100) : 0;
                    return (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: fill, flexShrink: 0 }} />
                        <div style={{ fontSize: 11, fontWeight: 600, color: fill, width: 58, flexShrink: 0 }}>{name}</div>
                        <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`, borderRadius: 999, background: fill,
                            transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', width: 16, textAlign: 'right' }}>
                          {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center', padding: '8px 0' }}>Aucune donnée</p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── CSS ANIMATIONS ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .banner-enter {
          animation: banner-in 0.6s ease-out both;
        }
        @keyframes banner-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .stat-card-enter {
          opacity: 0;
          animation: card-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .chart-enter {
          opacity: 0;
          animation: chart-in 0.6s ease-out 0.3s forwards;
        }
        @keyframes chart-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sla-alert-enter {
          animation: alert-in 0.4s ease-out both;
        }
        @keyframes alert-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pulse-dot-green {
          animation: pulse-live 1.5s ease-in-out infinite;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
        }
        @keyframes pulse-live {
          0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          70%  { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 2px #fecaca; }
          50%      { box-shadow: 0 0 0 5px rgba(227,30,36,0.15); }
        }

        @keyframes pulse-badge {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.7; transform: scale(1.02); }
        }

        @keyframes pulse-card {
          0%, 100% { background-color: rgba(255,255,255,0.12); }
          50%      { background-color: rgba(227,30,36,0.22); }
        }

        @keyframes sla-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(227,30,36,0.12); }
          50%      { box-shadow: 0 0 0 6px rgba(227,30,36,0); }
        }

        @keyframes pulse-icon {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.1); }
        }
      `}</style>
    </TechnicienLayout>
  );
}
