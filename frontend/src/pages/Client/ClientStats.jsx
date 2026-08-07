import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, AlertTriangle,
  Clock, CheckCircle, TrendingUp,
  ChevronRight, ChevronDown, Info, Bell,
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import ClientLayout from '../../layouts/ClientLayout';
import { getMyTickets } from '../../api/ticketApi';
import { useSettings } from '../../context/SettingsContext';

const RED = '#E31E24';

const diffDays = (a, b = new Date()) =>
  Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—';

/* ─── Barre de progression ─── */
const ProgressBar = ({ pct, color, label, sub }) => (
  <div>
    <div className="flex justify-between items-baseline mb-1.5">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

/* ─── Carte ticket cliquable ───────────────────────────────────────────
   1 ticket  → clic direct ouvre le ticket
   N tickets → clic expand la liste, chaque ligne ouvre son ticket
   ────────────────────────────────────────────────────────────────────── */
const AlertCard = ({ icon: Icon, title, desc, tickets, color, bg, prefix, navigate }) => {
  const [expanded, setExpanded] = useState(false);
  const single = tickets.length === 1;

  const handleMain = () => {
    if (single) navigate(`/tickets/${tickets[0].id}`);
    else setExpanded(v => !v);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: bg, border: `1.5px solid ${color}30` }}
    >
      <button
        onClick={handleMain}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                   transition-all hover:brightness-95 active:scale-[0.99]"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {single
              ? `${prefix}-${String(tickets[0].id).padStart(3,'0')} · ${tickets[0].title}`
              : desc ?? `${tickets.length} tickets — cliquez pour voir`}
          </p>
        </div>
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold
                     flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          {tickets.length}
        </span>
        {single
          ? <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          : expanded
            ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color }} />
            : <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        }
      </button>

      {/* Liste expandable */}
      {!single && expanded && (
        <div className="border-t" style={{ borderColor: `${color}20` }}>
          {tickets.map((t, i) => (
            <button
              key={t.id}
              onClick={() => navigate(`/tickets/${t.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left
                         transition-all hover:brightness-95"
              style={{
                borderBottom: i < tickets.length - 1 ? `1px solid ${color}15` : 'none',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono font-bold text-gray-400 mr-2">
                  {prefix}-{String(t.id).padStart(3,'0')}
                </span>
                <span className="text-xs font-medium text-gray-700 truncate">
                  {t.title}
                </span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 mr-1">
                {diffDays(t.createdAt)}j
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Jauge circulaire ─── */
const ScoreGauge = ({ value, label, color }) => {
  const data = [
    { value: 100, fill: '#f3f4f6' },
    { value,      fill: color    },
  ];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="95%"
            startAngle={220} endAngle={-40}
            data={data} barSize={8}
          >
            <RadialBar dataKey="value" cornerRadius={4} background={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{value}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center leading-tight">{label}</p>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════ */
export default function ClientStats() {
  const navigate     = useNavigate();
  const { settings } = useSettings();
  const prefix       = settings?.ticketPrefix || 'TKT';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTickets()
      .then(res => {
        const d = res.data;
        setTickets(Array.isArray(d) ? d : d?.content ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const {
    infoRequired, slaBreached, waitingLong,
    total, tauxResolution, tauxSla,
    avgResolutionDays, byCategory, oldest,
  } = useMemo(() => {
    const active   = tickets.filter(t => !t.status?.finalStatus);
    const resolved = tickets.filter(t =>  t.status?.finalStatus);
    const total    = tickets.length;

    const infoRequired = active.filter(t =>
      t.status?.name?.toLowerCase().includes('information')
    );
    const slaBreached = active.filter(t => t.slaBreached);
    const waitingLong = active.filter(t =>
      !t.slaBreached &&
      !t.status?.name?.toLowerCase().includes('information') &&
      diffDays(t.createdAt) > 3
    );

    const tauxResolution = total
      ? Math.round((resolved.length / total) * 100) : 0;
    const tauxSla = total
      ? Math.round(((total - tickets.filter(t => t.slaBreached).length) / total) * 100)
      : 100;

    const resDays = resolved
      .map(t => diffDays(t.createdAt, t.updatedAt ?? new Date()))
      .filter(v => v >= 0);
    const avgResolutionDays = resDays.length
      ? Math.round(resDays.reduce((s, v) => s + v, 0) / resDays.length)
      : null;

    const catMap = {};
    active.forEach(t => {
      const name  = t.category?.name  ?? 'Autre';
      const color = t.category?.color ?? '#9ca3af';
      if (!catMap[name]) catMap[name] = { name, color, count: 0 };
      catMap[name].count++;
    });
    const byCategory = Object.values(catMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const oldest = [...active].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    )[0] ?? null;

    return {
      infoRequired, slaBreached, waitingLong,
      total, tauxResolution, tauxSla,
      avgResolutionDays, byCategory, oldest,
    };
  }, [tickets]);

  if (loading) return (
    <ClientLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 rounded-full animate-spin"
             style={{ border: `3px solid #f3f4f6`, borderTopColor: RED }} />
      </div>
    </ClientLayout>
  );

  return (
    <ClientLayout>
      <div className="max-w-2xl mx-auto pb-10">

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-gray-200 text-gray-400
                       hover:text-gray-700 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Suivi de mes demandes</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {total} demande{total > 1 ? 's' : ''} au total
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════
            SECTION 1 — À FAIRE DE VOTRE CÔTÉ
        ════════════════════════════════════ */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <h2 className="text-sm font-bold text-gray-800">À faire de votre côté</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Ces tickets attendent une réponse ou une information de votre part.
            Sans votre retour, ils restent bloqués.
          </p>

          {infoRequired.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl
                            bg-green-50 border border-green-100">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700">
                Aucun ticket n'attend votre réponse.
              </p>
            </div>
          ) : (
            <AlertCard
              icon={MessageSquare}
              title="Le technicien attend votre réponse"
              tickets={infoRequired}
              color="#f59e0b"
              bg="#fffbeb"
              prefix={prefix}
              navigate={navigate}
            />
          )}
        </section>

        {/* ════════════════════════════════════
            SECTION 2 — À SURVEILLER
        ════════════════════════════════════ */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-800">À surveiller</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Ces tickets ne nécessitent pas d'action de votre part,
            mais méritent un œil.
          </p>

          {slaBreached.length === 0 && waitingLong.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl
                            bg-gray-50 border border-gray-100">
              <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-500">
                Tout se déroule normalement.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {slaBreached.length > 0 && (
                <AlertCard
                  icon={AlertTriangle}
                  title="Délai de traitement dépassé"
                  desc="Notre équipe est en train de traiter ces tickets en urgence"
                  tickets={slaBreached}
                  color={RED}
                  bg="#fff5f5"
                  prefix={prefix}
                  navigate={navigate}
                />
              )}
              {waitingLong.length > 0 && (
                <AlertCard
                  icon={Clock}
                  title="En attente depuis plus de 3 jours"
                  desc="Ces tickets sont en cours de traitement"
                  tickets={waitingLong}
                  color="#6366f1"
                  bg="#f5f3ff"
                  prefix={prefix}
                  navigate={navigate}
                />
              )}
            </div>
          )}
        </section>

        {/* ════════════════════════════════════
            SECTION 3 — BILAN
        ════════════════════════════════════ */}
        {total > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" style={{ color: RED }} />
              <h2 className="text-sm font-bold text-gray-800">Bilan de mes tickets</h2>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-around mb-5">
                <ScoreGauge
                  value={tauxResolution}
                  label={`Taux de\nrésolution`}
                  color="#16a34a"
                />
                <ScoreGauge
                  value={tauxSla}
                  label={`Délais\nrespectés`}
                  color={tauxSla >= 80 ? '#3b82f6' : RED}
                />
                {avgResolutionDays !== null && (
                  <div className="flex flex-col items-center">
                    <div
                      className="w-24 h-24 rounded-full flex items-center
                                 justify-center border-4"
                      style={{ borderColor: '#f3f4f6' }}
                    >
                      <span className="text-xl font-bold text-gray-900">
                        {avgResolutionDays}j
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center leading-tight">
                      Délai moyen<br />de résolution
                    </p>
                  </div>
                )}
              </div>

              {byCategory.length > 0 && (
                <div className="border-t border-gray-50 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Demandes actives par domaine
                  </p>
                  <div className="space-y-3">
                    {byCategory.map(cat => {
                      const activeTotal = byCategory.reduce((s, c) => s + c.count, 0);
                      const pct = activeTotal
                        ? Math.round((cat.count / activeTotal) * 100) : 0;
                      return (
                        <ProgressBar
                          key={cat.name}
                          label={cat.name}
                          pct={pct}
                          color={cat.color}
                          sub={`${cat.count} ticket${cat.count > 1 ? 's' : ''} en cours`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════
            SECTION 4 — TICKET LE PLUS ANCIEN
        ════════════════════════════════════ */}
        {oldest && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" style={{ color: RED }} />
              <h2 className="text-sm font-bold text-gray-800">
                Ticket le plus ancien encore ouvert
              </h2>
            </div>
            <button
              onClick={() => navigate(`/tickets/${oldest.id}`)}
              className="w-full text-left bg-white rounded-2xl border border-gray-100
                         shadow-sm p-4 hover:shadow-md transition-all
                         hover:border-gray-200 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-gray-400">
                      #{prefix}-{String(oldest.id).padStart(3, '0')}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: `${oldest.status?.color ?? '#9ca3af'}18`,
                        color: oldest.status?.color ?? '#6b7280',
                      }}
                    >
                      {oldest.status?.name}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {oldest.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ouvert le {fmt(oldest.createdAt)} —{' '}
                    <span className="font-semibold text-gray-600">
                      {diffDays(oldest.createdAt)} jour
                      {diffDays(oldest.createdAt) > 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </button>
          </section>
        )}

        {/* ════════════════════════════════════
            NOTE DE BAS DE PAGE
        ════════════════════════════════════ */}
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
          style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            Pour débloquer un ticket en attente de votre réponse, ouvrez-le
            et envoyez un message dans la section messagerie. Notre équipe
            sera notifiée immédiatement.
          </p>
        </div>

      </div>
    </ClientLayout>
  );
}
