import { useState, useEffect, useRef } from 'react';
import { PlusCircle, Ticket, Clock, CheckCircle, AlertTriangle, BarChart2,
         Circle, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ClientLayout from '../../layouts/ClientLayout';
import { getMyTickets } from '../../api/ticketApi';
import { useSettings } from '../../context/SettingsContext';

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: CountUp sans npm
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
        const eased    = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(end * eased));
        if (progress >= 1) clearInterval(timer);
      }, 16);
    }, delay);
    return () => clearTimeout(timeout);
  }, [end, duration, delay]);

  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Stat card client animée
// ─────────────────────────────────────────────────────────────────────────────
function ClientStatCard({ icon: Icon, label, value, bg, link, filter, delay = 0 }) {
  const animated = useCountUp(value, 1200, delay);
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={filter ? `/tickets?status=${filter}` : '/tickets'}
      className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3
                 shadow-sm stat-card-enter block"
      style={{
        animationDelay: `${delay}ms`,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
        style={{
          transition: 'transform 0.3s ease',
          transform: hovered ? 'rotate(-8deg) scale(1.12)' : 'rotate(0) scale(1)',
        }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{animated}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Mini timeline d'un ticket
// ─────────────────────────────────────────────────────────────────────────────
function TicketTimeline({ ticket, prefix }) {
  const steps = [
    { key: 'created',  label: 'Créé',     color: '#6b7280', done: true },
    { key: 'assigned', label: 'Assigné',  color: '#3b82f6', done: !!ticket.assignedTo },
    { key: 'progress', label: 'En cours', color: '#f97316', done: ticket.status?.name === 'En cours' || ticket.status?.name === 'Résolu' || ticket.status?.name === 'Fermé' },
    { key: 'resolved', label: 'Résolu',   color: '#22c55e', done: ticket.status?.name === 'Résolu' || ticket.status?.name === 'Fermé' },
  ];

  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1 flex-1">
          <div className="flex flex-col items-center gap-1 flex-1" title={step.label}>
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
              style={{
                backgroundColor: step.done ? step.color : '#e5e7eb',
                transform: step.done ? 'scale(1)' : 'scale(0.8)',
              }}
            >
              {step.done && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-xs text-gray-400 leading-none" style={{ fontSize: '9px' }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-0.5 flex-1 rounded-full mb-3 transition-all duration-700"
              style={{ backgroundColor: step.done && steps[i + 1].done ? step.color : '#e5e7eb' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT: Widget progression globale
// ─────────────────────────────────────────────────────────────────────────────
function ProgressWidget({ total, resolus, enCours, nouveau, infoRequise }) {
  const tauxResolution = total ? Math.round((resolus / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Vue d'ensemble</h3>
          <p className="text-xs text-gray-400">Progression de vos tickets</p>
        </div>
        <div
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: tauxResolution >= 70 ? '#f0fdf4' : '#fff7ed',
            color: tauxResolution >= 70 ? '#16a34a' : '#d97706',
          }}
        >
          {tauxResolution}% résolus
        </div>
      </div>

      {/* Barre segmentée */}
      {total > 0 && (
        <div className="flex rounded-full overflow-hidden h-3 mb-3 gap-0.5">
          {resolus > 0 && (
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${(resolus / total) * 100}%`,
                backgroundColor: '#22c55e',
                borderRadius: enCours === 0 && infoRequise === 0 && nouveau === 0 ? '999px' : '999px 0 0 999px',
              }}
              title={`Résolus: ${resolus}`}
            />
          )}
          {enCours > 0 && (
            <div
              className="h-full transition-all duration-1000"
              style={{ width: `${(enCours / total) * 100}%`, backgroundColor: '#f97316' }}
              title={`En cours: ${enCours}`}
            />
          )}
          {infoRequise > 0 && (
            <div
              className="h-full transition-all duration-1000"
              style={{ width: `${(infoRequise / total) * 100}%`, backgroundColor: '#eab308' }}
              title={`Info requise: ${infoRequise}`}
            />
          )}
          {nouveau > 0 && (
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${(nouveau / total) * 100}%`,
                backgroundColor: '#6b7280',
                borderRadius: '0 999px 999px 0',
              }}
              title={`Nouveaux: ${nouveau}`}
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs flex-wrap">
        {[
          { label: 'Résolus',      value: resolus,      color: '#22c55e' },
          { label: 'En cours',     value: enCours,      color: '#f97316' },
          { label: 'Info requise', value: infoRequise,  color: '#eab308' },
          { label: 'Nouveaux',     value: nouveau,      color: '#6b7280' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-500">{label} :</span>
            <span className="font-bold text-gray-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL: ClientDashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const firstName    = localStorage.getItem('firstName');
  const navigate     = useNavigate();
  const { settings } = useSettings();
  const prefix       = settings?.ticketPrefix || 'TKT';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  useEffect(() => {
    getMyTickets()
      .then(res => setTickets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total       = tickets.length;
  const nouveau     = tickets.filter(t => t.status.name === 'Nouveau').length;
  const enCours     = tickets.filter(t => t.status.name === 'En cours').length;
  const resolus     = tickets.filter(t => t.status.name === 'Résolu').length;
  const infoRequise = tickets.filter(t =>
    t.status.name === 'Information requise' || t.status.name === 'Informations requises'
  ).length;

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const stats = [
    { icon: Ticket,        label: 'Total tickets',  value: loading ? 0 : total,       bg: 'bg-blue-500',   filter: '',                    delay: 0   },
    { icon: AlertTriangle, label: 'Nouveaux',        value: loading ? 0 : nouveau,     bg: 'bg-gray-500',   filter: 'Nouveau',             delay: 60  },
    { icon: Clock,         label: 'En cours',        value: loading ? 0 : enCours,     bg: 'bg-orange-500', filter: 'En cours',            delay: 120 },
    { icon: Circle,        label: 'Info requise',    value: loading ? 0 : infoRequise, bg: 'bg-yellow-500', filter: 'Information requise', delay: 180 },
    { icon: CheckCircle,   label: 'Résolus',         value: loading ? 0 : resolus,     bg: 'bg-green-500',  filter: 'Résolu',              delay: 240 },
  ];

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

  const isOverdue = (ticket) => {
    const created = new Date(ticket.createdAt);
    const now     = new Date();
    const diffH   = (now - created) / 3600000;
    return diffH > ticket.priority.slaHours &&
           ticket.status.name !== 'Résolu' &&
           ticket.status.name !== 'Fermé';
  };

  const smartSub = !loading
    ? resolus === total && total > 0
      ? '🎉 Tous vos tickets sont résolus !'
      : enCours > 0
        ? `⚙ ${enCours} ticket${enCours > 1 ? 's' : ''} en cours de traitement`
        : infoRequise > 0
          ? `💬 ${infoRequise} ticket${infoRequise > 1 ? 's' : ''} en attente d'informations`
          : nouveau > 0
            ? `📬 ${nouveau} ticket${nouveau > 1 ? 's' : ''} en attente de prise en charge`
            : 'Gérez facilement vos tickets et suivez leur progression.'
    : 'Gérez facilement vos tickets et suivez leur progression.';

  return (
    <ClientLayout>

      {/* ── BANNIÈRE ── */}
      <div
        className="rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden banner-enter"
        style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #E31E24 100%)' }}
      >
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <Link
          to="/client/stats"
          className="absolute top-4 right-4 inline-flex items-center gap-1.5
                     px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
        >
          <BarChart2 className="w-3 h-3" />
          Mes stats
        </Link>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {getGreeting()}, {firstName}
          </h2>
          <p className="mb-5 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {smartSub}
          </p>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 bg-white font-semibold
                       px-6 py-3 rounded-xl transition-all shadow-lg"
            style={{ color: '#E31E24' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <PlusCircle className="w-5 h-5" />
            Nouveau ticket
          </Link>
        </div>
      </div>

      {/* ── CARTES STATS ANIMÉES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {loading
          ? Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 skeleton-shimmer" />
            ))
          : stats.map(s => <ClientStatCard key={s.label} {...s} />)
        }
      </div>

      {/* ── PROGRESSION GLOBALE ── */}
      {!loading && total > 0 && (
        <ProgressWidget
          total={total}
          resolus={resolus}
          enCours={enCours}
          nouveau={nouveau}
          infoRequise={infoRequise}
        />
      )}

      {/* ── TICKETS RÉCENTS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Mes tickets récents</h3>
          <Link to="/tickets" className="text-sm font-medium hover:underline" style={{ color: '#E31E24' }}>
            Voir tous →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="text-center py-10">
            <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun ticket pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Créez votre premier ticket pour commencer</p>
            <button
              onClick={() => navigate('/tickets/new')}
              className="mt-4 px-5 py-2 text-white rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: '#E31E24' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Créer un ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTickets.map((ticket, idx) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="border rounded-xl p-4 cursor-pointer ticket-row-enter"
                style={{
                  borderColor: isOverdue(ticket) ? '#fecaca' : '#f3f4f6',
                  backgroundColor: isOverdue(ticket) ? '#fff5f5' : 'transparent',
                  animationDelay: `${idx * 80}ms`,
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#E31E24';
                  e.currentTarget.style.transform   = 'translateX(4px)';
                  e.currentTarget.style.boxShadow   = '0 4px 16px rgba(227,30,36,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isOverdue(ticket) ? '#fecaca' : '#f3f4f6';
                  e.currentTarget.style.transform   = 'translateX(0)';
                  e.currentTarget.style.boxShadow   = 'none';
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-400 font-mono">
                        #{prefix}-{String(ticket.id).padStart(3, '0')}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[ticket.status.name] || 'bg-gray-100 text-gray-700'}`}>
                        {ticket.status.name}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${priorityColors[ticket.priority.name]}`}>
                        {ticket.priority.name}
                      </span>
                      {isOverdue(ticket) && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium
                                         bg-red-100 text-red-600 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          SLA dépassé
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{ticket.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                      <span>Créé le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                      {ticket.assignedTo
                        ? <span>• Technicien : {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                        : <span className="text-orange-400">• En attente d'assignation</span>}
                    </div>
                    <TicketTimeline ticket={ticket} prefix={prefix} />
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 shadow-sm"
                      style={{ backgroundColor: ticket.category?.color || '#94a3b8' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CSS ANIMATIONS ── */}
      <style>{`
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .stat-card-enter {
          opacity: 0;
          animation: card-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .banner-enter {
          animation: banner-in 0.5s ease-out both;
        }
        @keyframes banner-in {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ticket-row-enter {
          opacity: 0;
          animation: row-in 0.4s ease-out forwards;
        }
        @keyframes row-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

    </ClientLayout>
  );
}