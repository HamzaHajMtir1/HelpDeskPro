import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle, Ticket, Clock, CheckCircle,
  Users, TrendingUp, TrendingDown,
  Wrench, UserCircle, ArrowRight, AlertTriangle,
  Activity, Zap, Server, Database, Wifi, Shield,
  CheckCheck, Eye, RefreshCw, Circle
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAllTickets, getUserStats, getTechniciens } from '../../api/ticketApi';
import { useSettings } from '../../context/SettingsContext';

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: CountUp (sans npm, animation fluide easeOutCubic)
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(end, duration = 1400, delay = 0) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    if (startedRef.current) return;
    const timeout = setTimeout(() => {
      startedRef.current = true;
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        setCount(Math.round(end * eased));
        if (progress >= 1) clearInterval(timer);
      }, 16);
    }, delay);
    return () => clearTimeout(timeout);
  }, [end, duration, delay]);

  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Skeleton Card (loading premium)
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-2xl skeleton-shimmer" />
        <div className="w-4 h-4 rounded skeleton-shimmer" />
      </div>
      <div className="h-8 w-16 rounded-lg skeleton-shimmer mb-2" />
      <div className="h-3 w-24 rounded skeleton-shimmer mb-3" />
      <div className="h-1.5 w-full rounded-full skeleton-shimmer mb-1" />
      <div className="h-3 w-20 rounded skeleton-shimmer" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Stat Card animée avec CountUp + 3D hover
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedStatCard({ icon: Icon, label, value, sub, trend, bg, color, link, progress, delay = 0, pulse = false }) {
  const animatedValue = useCountUp(value, 1400, delay);
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => navigate(link)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm cursor-pointer stat-card-enter"
      style={{
        animationDelay: `${delay}ms`,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 12px 40px ${color}25, 0 4px 12px rgba(0,0,0,0.08)` : '0 1px 3px rgba(0,0,0,0.04)',
        borderColor: hovered ? color + '40' : '#f3f4f6',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center shadow-lg`}
          style={{
            transition: 'transform 0.3s ease',
            transform: hovered ? 'rotate(-5deg) scale(1.1)' : 'rotate(0) scale(1)',
          }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {pulse && (
            <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
          )}
          {trend === 'up'   && <TrendingUp   className="w-4 h-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500"   />}
        </div>
      </div>

      <p className="text-3xl font-bold text-gray-900 mb-1 tabular-nums">
        {animatedValue}
      </p>
      <p className="text-sm text-gray-500 mb-3">{label}</p>

      {/* Barre de progression animée */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1 overflow-hidden">
        <div
          className="h-1.5 rounded-full progress-bar-animate"
          style={{ '--target-width': `${progress}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Live Activity Feed (généré depuis les vrais tickets)
// ─────────────────────────────────────────────────────────────────────────────
function LiveActivityFeed({ tickets, prefix }) {
  const [activities, setActivities] = useState([]);
  const [visible, setVisible]       = useState(5);

  useEffect(() => {
    if (!tickets.length) return;

    // Génère les activités depuis les données réelles
    const acts = [];

    // Tickets récents créés
    [...tickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .forEach(t => {
        acts.push({
          id: `create-${t.id}`,
          type: 'created',
          icon: '🔵',
          color: '#3b82f6',
          bg: '#eff6ff',
          text: `Nouveau ticket`,
          detail: `#${prefix}-${String(t.id).padStart(3, '0')} — ${t.title}`,
          sub: t.createdBy ? `par ${t.createdBy.firstName || 'Utilisateur'}` : 'Système',
          time: t.createdAt,
        });
      });

    // Tickets résolus
    tickets
      .filter(t => t.status?.name === 'Résolu' || t.status?.name === 'Fermé')
      .slice(0, 4)
      .forEach(t => {
        acts.push({
          id: `resolve-${t.id}`,
          type: 'resolved',
          icon: '🟢',
          color: '#22c55e',
          bg: '#f0fdf4',
          text: `Ticket résolu`,
          detail: `#${prefix}-${String(t.id).padStart(3, '0')} — ${t.title}`,
          sub: t.assignedTo ? `par ${t.assignedTo.firstName}` : 'Technicien',
          time: t.updatedAt || t.createdAt,
        });
      });

    // SLA dépassés
    tickets
      .filter(t => t.slaBreached)
      .slice(0, 3)
      .forEach(t => {
        acts.push({
          id: `sla-${t.id}`,
          type: 'sla',
          icon: '🔴',
          color: '#E31E24',
          bg: '#fff1f1',
          text: `SLA dépassé`,
          detail: `#${prefix}-${String(t.id).padStart(3, '0')} — ${t.title}`,
          sub: `Action requise`,
          time: t.createdAt,
          urgent: true,
        });
      });

    // Tickets en cours
    tickets
      .filter(t => t.status?.name === 'En cours' && t.assignedTo)
      .slice(0, 3)
      .forEach(t => {
        acts.push({
          id: `progress-${t.id}`,
          type: 'progress',
          icon: '🟠',
          color: '#f97316',
          bg: '#fff7ed',
          text: `Ticket assigné`,
          detail: `#${prefix}-${String(t.id).padStart(3, '0')} — ${t.title}`,
          sub: `à ${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
          time: t.updatedAt || t.createdAt,
        });
      });

    // Trier par date décroissante
    acts.sort((a, b) => new Date(b.time) - new Date(a.time));
    setActivities(acts.slice(0, 12));
  }, [tickets, prefix]);

  const formatTime = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (diff < 1)  return 'À l\'instant';
    if (diff < 60) return `${diff}min`;
    const h = Math.floor(diff / 60);
    if (h < 24)   return `${h}h`;
    return `${Math.floor(h / 24)}j`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
          <h3 className="text-base font-semibold text-gray-900">Activité en direct</h3>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {activities.length} événements
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
          <Activity className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">Aucune activité récente</p>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {activities.slice(0, visible).map((act, idx) => (
              <div
                key={act.id}
                className="feed-item flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-default"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ backgroundColor: act.bg }}
                >
                  {act.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-bold"
                      style={{ color: act.color }}
                    >
                      {act.text}
                    </span>
                    {act.urgent && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 font-bold animate-pulse">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium truncate">{act.detail}</p>
                  <p className="text-xs text-gray-400">{act.sub}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
                  {formatTime(act.time)}
                </span>
              </div>
            ))}
          </div>
          {activities.length > visible && (
            <button
              onClick={() => setVisible(v => v + 5)}
              className="w-full mt-3 py-2 text-xs font-semibold text-gray-500
                         bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
            >
              Voir plus ({activities.length - visible} restants)
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: System Health Widget (simulé mais visuel)
// ─────────────────────────────────────────────────────────────────────────────
function SystemHealthWidget({ slaBreached, enCours, total }) {
  const services = [
    {
      name: 'API Backend',
      icon: Server,
      status: 'online',
      latency: '12ms',
    },
    {
      name: 'Base de données',
      icon: Database,
      status: 'online',
      latency: '4ms',
    },
    {
      name: 'SLA Engine',
      icon: Shield,
      status: slaBreached > 0 ? 'warning' : 'online',
      latency: slaBreached > 0 ? `${slaBreached} breach` : 'OK',
    },
    {
      name: 'Notifications',
      icon: Wifi,
      status: enCours > 10 ? 'warning' : 'online',
      latency: enCours > 10 ? 'Chargé' : 'Actif',
    },
  ];

  const statusConfig = {
    online:  { color: '#22c55e', bg: '#f0fdf4', label: 'En ligne',    dot: 'bg-green-500' },
    warning: { color: '#f59e0b', bg: '#fffbeb', label: 'Attention',   dot: 'bg-yellow-500' },
    offline: { color: '#E31E24', bg: '#fff1f1', label: 'Hors ligne',  dot: 'bg-red-500' },
  };

  const allOnline = services.every(s => s.status === 'online');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">État du système</h3>
          <p className="text-xs text-gray-400 mt-0.5">Monitoring des services</p>
        </div>
        <div
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            allOnline ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {allOnline ? '✓ Opérationnel' : '⚠ Attention'}
        </div>
      </div>

      <div className="space-y-3">
        {services.map(({ name, icon: Icon, status, latency }) => {
          const cfg = statusConfig[status];
          return (
            <div key={name} className="flex items-center gap-3 p-2.5 rounded-xl"
                 style={{ backgroundColor: cfg.bg }}>
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{name}</p>
                <p className="text-xs" style={{ color: cfg.color }}>{cfg.label}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-gray-500 tabular-nums">{latency}</span>
                <span className={`w-2 h-2 rounded-full ${cfg.dot} ${status === 'online' ? 'pulse-dot' : 'animate-pulse'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Score global */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Score de santé global</span>
          <span className="text-xs font-bold text-green-600">
            {allOnline ? '100%' : '75%'}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-1000"
            style={{
              width: allOnline ? '100%' : '75%',
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL: AdminDashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tickets,     setTickets]     = useState([]);
  const [userStats,   setUserStats]   = useState({});
  const [techniciens, setTechniciens] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showToast,   setShowToast]   = useState(false);
  const [toastMsg,    setToastMsg]    = useState('');
  const navigate = useNavigate();

  const { settings } = useSettings();
  const prefix    = settings?.ticketPrefix || 'TKT';
  const firstName = localStorage.getItem('firstName');

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const fetchData = async () => {
    try {
      const [ticketsRes, usersRes, techRes] = await Promise.all([
        getAllTickets(),
        getUserStats(),
        getTechniciens(),
      ]);
      setTickets(ticketsRes.data);
      setUserStats(usersRes.data);
      setTechniciens((techRes.data || []).filter(u => u.role === 'TECHNICIEN'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Toast auto-dismiss
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  useEffect(() => {
    if (!loading && tickets.length) {
      const breached = tickets.filter(t => t.slaBreached).length;
      if (breached > 0) {
        setTimeout(() => triggerToast(`⚠ ${breached} ticket${breached > 1 ? 's ont' : ' a'} dépassé le SLA`), 800);
      }
    }
  }, [loading]);

  // ── Stats tickets ──
  const total          = tickets.length;
  const enCours        = tickets.filter(t => t.status.name === 'En cours').length;
  const resolus        = tickets.filter(t => t.status.name === 'Résolu' || t.status.name === 'Fermé').length;
  const nouveau        = tickets.filter(t => t.status.name === 'Nouveau').length;
  const tauxResolution = total ? Math.round((resolus / total) * 100) : 0;

  const slaBreached = tickets.filter(t => t.slaBreached).length;
  const slaWarning  = tickets.filter(t => {
    if (!t.slaDeadline || t.slaBreached || t.status?.finalStatus) return false;
    const diffMs  = new Date(t.slaDeadline) - new Date();
    const totalMs = (t.priority?.slaHours || 1) * 3600000;
    return diffMs > 0 && (1 - diffMs / totalMs) >= 0.8;
  }).length;

  // ── Top techniciens ──
  const topTechniciens = techniciens
    .map(tech => {
      const assigned = tickets.filter(t => t.assignedTo?.id === tech.id);
      const resolved = assigned.filter(t =>
        t.status?.name === 'Résolu' || t.status?.name === 'Fermé'
      ).length;
      const rate = assigned.length ? Math.round((resolved / assigned.length) * 100) : 0;
      return { ...tech, assigned: assigned.length, resolved, rate };
    })
    .sort((a, b) => b.rate - a.rate || b.resolved - a.resolved)
    .slice(0, 4);

  // ── 5 tickets récents ──
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // ── Smart greeting dynamique ──
  const hour = now.getHours();
  const greetingBase = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const smartSubtitle = !loading
    ? slaBreached > 0
      ? ` ${slaBreached} SLA critique${slaBreached > 1 ? 's' : ''} nécessite${slaBreached > 1 ? 'nt' : ''} votre attention`
      : nouveau > 0
        ? ` ${nouveau} nouveau${nouveau > 1 ? 'x' : ''} ticket${nouveau > 1 ? 's' : ''} en attente`
        : resolus === total && total > 0
          ? ' Excellente journée : tous les tickets traités !'
          : 'Vue de l\'ensemble d\'activités du HelpDesk'
    : 'Vue de l\'ensemble d\'activités du HelpDesk';

  const statusColors = {
    'Nouveau':  { bg: 'bg-gray-100',  text: 'text-gray-700'  },
    'En cours': { bg: 'bg-blue-100',  text: 'text-blue-700'  },
    'Résolu':   { bg: 'bg-green-100', text: 'text-green-700' },
    'Fermé':    { bg: 'bg-red-100',   text: 'text-red-700'   },
  };

  const priorityColors = {
    'Critique': { bg: 'bg-red-100',    text: 'text-red-700'    },
    'Haute':    { bg: 'bg-orange-100', text: 'text-orange-700' },
    'Moyenne':  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'Basse':    { bg: 'bg-gray-100',   text: 'text-gray-600'   },
  };

  const stats = [
    {
      icon: Ticket, label: 'Total tickets', value: loading ? 0 : total,
      sub: `${loading ? 0 : nouveau} nouveaux`,
      trend: 'up', bg: 'bg-blue-500', color: '#3b82f6',
      link: '/admin/tickets', progress: 100, delay: 0,
    },
    {
      icon: Clock, label: 'En cours', value: loading ? 0 : enCours,
      sub: `${loading ? 0 : (total ? Math.round((enCours / total) * 100) : 0)}% du total`,
      trend: 'neutral', bg: 'bg-orange-500', color: '#f97316',
      link: '/admin/tickets',
      progress: total ? Math.round((enCours / total) * 100) : 0, delay: 100,
    },
    {
      icon: CheckCircle, label: 'Tickets résolus', value: loading ? 0 : resolus,
      sub: `Taux : ${loading ? 0 : tauxResolution}%`,
      trend: tauxResolution > 50 ? 'up' : 'down', bg: 'bg-green-500', color: '#22c55e',
      link: '/admin/tickets', progress: tauxResolution, delay: 200,
    },
    {
      icon: Users, label: 'Utilisateurs', value: loading ? 0 : (userStats.total || 0),
      sub: `${loading ? 0 : (userStats.TECHNICIEN || 0)} techniciens`,
      trend: 'up', bg: 'bg-purple-500', color: '#a855f7',
      link: '/admin/users', progress: 100, delay: 300,
      pulse: slaBreached > 0,
    },
  ];

  return (
    <AdminLayout>

      {/* ── TOAST NOTIFICATION ── */}
      <div
        className="fixed top-5 right-5 z-50 transition-all duration-500"
        style={{
          transform: showToast ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
          opacity: showToast ? 1 : 0,
        }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-white text-sm font-medium"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a, #E31E24)',
            minWidth: '280px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      </div>

      {/* ── BANNIÈRE AMÉLIORÉE ── */}
      <div
        className="rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden banner-enter"
        style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #E31E24 100%)' }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
             style={{ backgroundColor: '#fff', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 right-32 w-40 h-40 rounded-full opacity-10"
             style={{ backgroundColor: '#fff', transform: 'translateY(40%)' }} />
        {/* Grille subtile */}
        <div className="absolute inset-0 opacity-5"
             style={{
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
               backgroundSize: '40px 40px',
             }} />

        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1 capitalize">{dateStr}</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">{greetingBase}, {firstName} </h2>
            <p
              className="text-white/70 mb-5 text-sm"
              style={{ transition: 'all 0.5s ease' }}
            >
              {smartSubtitle}
            </p>
            <button
              onClick={() => navigate('/admin/new')}
              className="inline-flex items-center gap-2 bg-white font-semibold
                         px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
              style={{ color: '#E31E24' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <PlusCircle className="w-5 h-5" />
              Créer un nouveau ticket
            </button>
          </div>

          {/* Mini stat cards dans la bannière */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Nouveaux', value: loading ? '…' : nouveau,     color: '#fff'    },
              { label: 'En cours', value: loading ? '…' : enCours,     color: '#fde68a' },
              { label: 'Résolus',  value: loading ? '…' : resolus,     color: '#86efac' },
              { label: 'SLA ⚠',   value: loading ? '…' : slaBreached, color: '#fca5a5', urgent: slaBreached > 0 },
            ].map(({ label, value, color, urgent }) => (
              <div
                key={label}
                className="text-center px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  animation: urgent ? 'pulse-card 2s ease-in-out infinite' : 'none',
                }}
              >
                <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
                <p className="text-xs text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ALERTE SLA AMÉLIORÉE ── */}
      {!loading && (slaBreached > 0 || slaWarning > 0) && (
        <div
          className="mb-6 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap sla-alert-enter"
          style={{
            backgroundColor: slaBreached > 0 ? '#fff1f1' : '#fffbeb',
            border: `1px solid ${slaBreached > 0 ? '#fecaca' : '#fde68a'}`,
            animation: slaBreached > 0 ? 'sla-glow 2s ease-in-out infinite' : 'none',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: slaBreached > 0 ? '#fecaca' : '#fde68a',
                animation: 'pulse-icon 1.5s ease-in-out infinite',
              }}
            >
              <AlertTriangle
                className="w-5 h-5"
                style={{ color: slaBreached > 0 ? '#E31E24' : '#d97706' }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold"
                 style={{ color: slaBreached > 0 ? '#E31E24' : '#d97706' }}>
                {slaBreached > 0
                  ? `${slaBreached} ticket${slaBreached > 1 ? 's' : ''} ont dépassé leur SLA`
                  : `${slaWarning} ticket${slaWarning > 1 ? 's' : ''} approchent de leur deadline SLA`}
              </p>
              <p className="text-xs text-gray-500">
                Action requise — vérifiez les tickets concernés
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/tickets')}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white flex-shrink-0 transition-all"
            style={{ backgroundColor: slaBreached > 0 ? '#E31E24' : '#d97706' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Voir les tickets
          </button>
        </div>
      )}

      {/* ── CARTES STATS ANIMÉES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : stats.map(s => <AnimatedStatCard key={s.label} {...s} />)
        }
      </div>

      {/* ── TICKETS RÉCENTS + TOP TECHNICIENS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Tickets récents */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Tickets récents</h3>
              <p className="text-xs text-gray-400 mt-0.5">Les 5 derniers tickets créés</p>
            </div>
            <Link
              to="/admin/tickets"
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: '#E31E24' }}
            >
              Voir tous <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
              ))}
            </div>
          ) : recentTickets.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Aucun ticket trouvé</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((ticket, idx) => {
                const sc = statusColors[ticket.status.name]     || { bg: 'bg-gray-100', text: 'text-gray-700' };
                const pc = priorityColors[ticket.priority.name] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                return (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    className="flex items-center gap-4 p-4 rounded-xl cursor-pointer
                               transition-all ticket-row-enter"
                    style={{
                      border: `1px solid ${ticket.slaBreached ? '#fecaca' : '#f3f4f6'}`,
                      backgroundColor: ticket.slaBreached ? '#fff8f8' : 'transparent',
                      animationDelay: `${idx * 80}ms`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = ticket.slaBreached ? '#fff8f8' : 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span className="text-xs font-bold text-gray-400 flex-shrink-0 w-20 font-mono">
                      #{prefix}-{String(ticket.id).padStart(3, '0')}
                    </span>
                    <p className="text-sm font-medium text-gray-800 flex-1 truncate">
                      {ticket.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                        {ticket.status.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pc.bg} ${pc.text}`}>
                        {ticket.priority.name}
                      </span>
                      {ticket.slaBreached && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium
                                         bg-red-100 text-red-600 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> SLA
                        </span>
                      )}
                    </div>
                    <div className="flex-shrink-0 w-28 text-right">
                      {ticket.assignedTo
                        ? <span className="text-xs text-gray-500">
                            {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                          </span>
                        : <span className="text-xs text-gray-300 italic">Non assigné</span>}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Techniciens */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Top Techniciens</h3>
              <p className="text-xs text-gray-400">Par taux de résolution</p>
            </div>
            <Link to="/admin/users"
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: '#E31E24' }}>
              Gérer <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-12 rounded-xl skeleton-shimmer" />
              ))}
            </div>
          ) : topTechniciens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Wrench className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Aucun technicien trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topTechniciens.map((tech, idx) => {
                const initials = `${tech.firstName?.charAt(0) || ''}${tech.lastName?.charAt(0) || ''}`;
                const barColor = tech.rate >= 70 ? '#22c55e' : tech.rate >= 40 ? '#f97316' : '#E31E24';
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                return (
                  <div
                    key={tech.id}
                    className="flex items-center gap-3 tech-row-enter"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <span className="text-xs font-bold text-gray-400 w-5 text-center flex-shrink-0">
                      {medal || `#${idx + 1}`}
                    </span>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center
                                 text-white text-xs font-bold flex-shrink-0 shadow-md"
                      style={{ backgroundColor: '#E31E24' }}
                    >
                      {initials || <UserCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate mb-1.5">
                        {tech.firstName} {tech.lastName}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full progress-bar-animate"
                            style={{
                              '--target-width': `${tech.rate}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold flex-shrink-0"
                              style={{ color: barColor, minWidth: '30px' }}>
                          {tech.rate}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900">{tech.resolved}</p>
                      <p className="text-xs text-gray-400">traités</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && (
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { label: 'Taux global', value: `${tauxResolution}%`, color: '#374151' },
                { label: 'Traités', value: `${resolus}/${total}`, color: '#22c55e' },
                { label: 'En cours', value: enCours, color: '#f97316' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-2.5 rounded-xl text-center bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className="text-sm font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LIGNE INFÉRIEURE: Activity Feed + System Health ── */}
      {!loading && tickets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveActivityFeed tickets={tickets} prefix={prefix} />
          </div>
          <div>
            <SystemHealthWidget
              slaBreached={slaBreached}
              enCours={enCours}
              total={total}
            />
          </div>
        </div>
      )}

      {/* ── CSS ANIMATIONS ── */}
      <style>{`
        /* Skeleton shimmer */
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Progress bar animation */
        .progress-bar-animate {
          width: 0;
          animation: grow-bar 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes grow-bar {
          from { width: 0; }
          to   { width: var(--target-width); }
        }

        /* Stat card entrance */
        .stat-card-enter {
          opacity: 0;
          transform: translateY(16px);
          animation: card-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes card-in {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Banner entrance */
        .banner-enter {
          animation: banner-in 0.6s ease-out both;
        }
        @keyframes banner-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* SLA alert entrance */
        .sla-alert-enter {
          animation: alert-in 0.4s ease-out both;
        }
        @keyframes alert-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Ticket row entrance */
        .ticket-row-enter {
          opacity: 0;
          animation: row-in 0.4s ease-out forwards;
          transition: all 0.2s ease;
        }
        @keyframes row-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Technicien row entrance */
        .tech-row-enter {
          opacity: 0;
          animation: row-in 0.4s ease-out forwards;
        }

        /* Feed item entrance */
        .feed-item {
          opacity: 0;
          animation: row-in 0.35s ease-out forwards;
        }

        /* Pulse dot (vert, live) */
        .pulse-dot {
          animation: pulse-live 1.5s ease-in-out infinite;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
        }
        @keyframes pulse-live {
          0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          70%  { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        /* SLA glow pulsation */
        @keyframes sla-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(227, 30, 36, 0.15); }
          50%      { box-shadow: 0 0 0 6px rgba(227, 30, 36, 0); }
        }

        /* Banner SLA mini card pulse */
        @keyframes pulse-card {
          0%, 100% { background-color: rgba(255, 255, 255, 0.1); }
          50%      { background-color: rgba(227, 30, 36, 0.25); }
        }

        /* Pulse icon */
        @keyframes pulse-icon {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.1); }
        }
      `}</style>

    </AdminLayout>
  );
}
