import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, Loader2, ArrowLeft,
  Search, X, ExternalLink,
  Ticket, UserCheck, CheckCircle, Lock,
  AlertTriangle, AlertOctagon, MessageSquare,
  Clock, Timer, TrendingUp
} from 'lucide-react';
import useNotifications from '../hooks/useNotifications';

// ── Metadata par type ─────────────────────────────────────────────
const TYPE_META = {
  TICKET_CREE:         { color: '#3b82f6', bg: '#eff6ff', label: 'Nouveau ticket',  Icon: Ticket        },
  TICKET_ASSIGNE:      { color: '#0891b2', bg: '#ecfeff', label: 'Assigné',          Icon: UserCheck     },
  TICKET_RESOLU:       { color: '#10b981', bg: '#f0fdf4', label: 'Résolu',           Icon: CheckCircle   },
  TICKET_CLOTURE:      { color: '#6b7280', bg: '#f9fafb', label: 'Clôturé',          Icon: Lock          },
  SLA_WARNING:         { color: '#f59e0b', bg: '#fffbeb', label: 'SLA ⚠',            Icon: AlertTriangle },
  SLA_BREACH:          { color: '#E31E24', bg: '#fff1f1', label: 'SLA dépassé',      Icon: AlertOctagon  },
  NOUVEAU_COMMENTAIRE: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Commentaire',      Icon: MessageSquare },
  INFO_REQUISE:        { color: '#f97316', bg: '#fff7ed', label: 'Info requise',     Icon: Clock         },
  TICKET_NON_ASSIGNE:  { color: '#6b7280', bg: '#f9fafb', label: 'Non assigné',      Icon: Timer         },
  ESCALADE:            { color: '#E31E24', bg: '#fff1f1', label: 'Escalade',         Icon: TrendingUp    },
};

const ALL_TYPES = [
  { value: 'all',              label: 'Tous les types' },
  { value: 'TICKET_CREE',      label: 'Nouveau ticket' },
  { value: 'TICKET_ASSIGNE',   label: 'Assigné' },
  { value: 'TICKET_RESOLU',    label: 'Résolu' },
  { value: 'TICKET_CLOTURE',   label: 'Clôturé' },
  { value: 'SLA_WARNING',      label: 'SLA Warning' },
  { value: 'SLA_BREACH',       label: 'SLA Dépassé' },
  { value: 'NOUVEAU_COMMENTAIRE', label: 'Commentaire' },
  { value: 'INFO_REQUISE',     label: 'Info requise' },
  { value: 'ESCALADE',         label: 'Escalade' },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function AllNotificationsPage() {
  const navigate   = useNavigate();
  const role       = localStorage.getItem('role');

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all'); // 'all' | 'unread' | 'read'

  // ── Navigation vers le ticket selon le rôle ───────────────────
  function goToTicket(notif) {
    if (!notif.lu) markAsRead(notif.id);
    if (!notif.ticketId) return;
    if (role === 'CLIENT')     navigate(`/tickets/${notif.ticketId}`);
    else if (role === 'TECHNICIEN') navigate(`/tech/tickets/${notif.ticketId}`);
    else navigate(`/admin/tickets/${notif.ticketId}`);
  }

  // ── Back selon le rôle ────────────────────────────────────────
  function goBack() {
    if (role === 'CLIENT')     navigate('/tickets');
    else if (role === 'TECHNICIEN') navigate('/tech/tickets');
    else navigate('/admin/dashboard');
  }

  // ── Filtrage ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const matchSearch = search.trim() === '' ||
        n.titre.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || n.type === filterType;
      const matchRead = filterRead === 'all' ||
        (filterRead === 'unread' && !n.lu) ||
        (filterRead === 'read'   && n.lu);
      return matchSearch && matchType && matchRead;
    });
  }, [notifications, search, filterType, filterRead]);

  const unreadFiltered = filtered.filter(n => !n.lu).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>

      {/* ── En-tête ─────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={goBack}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px',
                  borderRadius: '10px', border: '1px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', color: '#6b7280',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
              >
                <ArrowLeft size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '10px',
                  background: '#fff1f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bell size={18} color="#E31E24" />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                    Notifications
                  </h1>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''} au total
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton tout lire */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                  background: '#fff1f1',
                  color: '#E31E24',
                  fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff1f1'}
              >
                <CheckCheck size={14} />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Corps ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px' }}>

        {/* ── Barre de recherche + filtres ── */}
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
        }}>
          {/* Recherche */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={14} style={{
              position: 'absolute', left: '10px', top: '50%',
              transform: 'translateY(-50%)', color: '#9ca3af',
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans les notifications…"
              style={{
                width: '100%', padding: '8px 32px 8px 32px',
                borderRadius: '10px', border: '1px solid #e5e7eb',
                fontSize: '13px', outline: 'none', background: '#f9fafb',
                color: '#111827', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#E31E24'}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: '8px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', display: 'flex', padding: '2px',
              }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filtre type */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px', border: '1px solid #e5e7eb',
              fontSize: '12px', background: '#f9fafb', color: '#374151',
              cursor: 'pointer', outline: 'none', fontWeight: 500,
            }}
            onFocus={e => e.target.style.borderColor = '#E31E24'}
            onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
          >
            {ALL_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Filtre lu/non lu */}
          <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '3px' }}>
            {[
              { value: 'all',    label: 'Tout' },
              { value: 'unread', label: `Non lues${unreadFiltered > 0 ? ` (${unreadFiltered})` : ''}` },
              { value: 'read',   label: 'Lues' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterRead(opt.value)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px', border: 'none',
                  fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: filterRead === opt.value ? '#fff' : 'transparent',
                  color: filterRead === opt.value ? '#111827' : '#6b7280',
                  boxShadow: filterRead === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats rapides ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total',    value: notifications.length,               bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
            { label: 'Non lues', value: unreadCount,                        bg: '#fff1f1', color: '#E31E24', border: '#fecaca' },
            { label: 'Lues',     value: notifications.length - unreadCount, bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, minWidth: '100px',
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Liste des notifications ── */}
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {loading && notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', color: '#9ca3af', gap: '12px' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#E31E24' }} />
              <span style={{ fontSize: '13px' }}>Chargement des notifications…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', color: '#9ca3af', gap: '12px' }}>
              <Bell size={36} strokeWidth={1.2} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                {notifications.length === 0 ? 'Aucune notification' : 'Aucun résultat pour ces filtres'}
              </span>
              {(search || filterType !== 'all' || filterRead !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setFilterType('all'); setFilterRead('all'); }}
                  style={{ fontSize: '12px', color: '#E31E24', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            filtered.map((notif, idx) => {
              const meta = TYPE_META[notif.type] ?? { color: '#6b7280', bg: '#f9fafb', label: notif.type, Icon: Bell };
              const isLast = idx === filtered.length - 1;
              const IconComponent = meta.Icon;

              return (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '16px 20px',
                    cursor: notif.ticketId ? 'pointer' : 'default',
                    background: notif.lu ? '#fff' : '#fefaf9',
                    borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                    transition: 'background 0.12s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (notif.ticketId) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => e.currentTarget.style.background = notif.lu ? '#fff' : '#fefaf9'}
                  onClick={() => notif.ticketId && goToTicket(notif)}
                >
                  {/* Barre gauche si non lue */}
                  {!notif.lu && (
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: '3px', background: '#E31E24', borderRadius: '0 2px 2px 0',
                    }} />
                  )}

                  {/* Icône type */}
                  <div style={{
                    width: '40px', height: '40px', flexShrink: 0,
                    borderRadius: '12px',
                    background: meta.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {IconComponent && <IconComponent size={18} color={meta.color} strokeWidth={1.8} />}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: notif.lu ? 500 : 700,
                        color: '#111827',
                        lineHeight: 1.3,
                      }}>
                        {notif.titre}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                        <span style={{ fontSize: '10px', color: '#d1d5db', whiteSpace: 'nowrap' }}>
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '12px', color: '#6b7280',
                      margin: '0 0 8px', lineHeight: 1.5,
                    }}>
                      {notif.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Badge type */}
                      <span style={{
                        fontSize: '10px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '8px',
                        background: meta.bg, color: meta.color,
                        border: `1px solid ${meta.color}28`,
                      }}>
                        {meta.label}
                      </span>

                      {/* Lien ticket */}
                      {notif.ticketId && (
                        <span style={{
                          fontSize: '10px', color: '#9ca3af',
                          display: 'flex', alignItems: 'center', gap: '3px',
                        }}>
                          <ExternalLink size={10} />
                          Ticket #{String(notif.ticketId).padStart(3, '0')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', flexShrink: 0 }}>
                    {!notif.lu && (
                      <button
                        onClick={e => { e.stopPropagation(); markAsRead(notif.id); }}
                        title="Marquer comme lu"
                        style={{
                          width: '28px', height: '28px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '8px', border: '1px solid #e5e7eb',
                          background: '#fff', cursor: 'pointer',
                          color: '#d1d5db', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.borderColor = '#bbf7d0'; e.currentTarget.style.background = '#f0fdf4'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Résultats */}
        {filtered.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '16px' }}>
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
            {notifications.length !== filtered.length && ` sur ${notifications.length}`}
          </p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}