import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';

const TYPE_META = {
  TICKET_CREE:         { color: '#3b82f6', label: 'Nouveau ticket'  },
  TICKET_ASSIGNE:      { color: '#3b82f6', label: 'Assigné'         },
  TICKET_RESOLU:       { color: '#10b981', label: 'Résolu'          },
  TICKET_CLOTURE:      { color: '#6b7280', label: 'Clôturé'         },
  SLA_WARNING:         { color: '#f59e0b', label: 'SLA ⚠'           },
  SLA_BREACH:          { color: '#E31E24', label: 'SLA dépassé'     },
  NOUVEAU_COMMENTAIRE: { color: '#8b5cf6', label: 'Commentaire'     },
  INFO_REQUISE:        { color: '#f97316', label: 'Info requise'    },
  TICKET_NON_ASSIGNE:  { color: '#6b7280', label: 'Non assigné'     },
  ESCALADE:            { color: '#E31E24', label: 'Escalade'        },
};

function dot(type) {
  return TYPE_META[type]?.color ?? '#6b7280';
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

// ── Retourne le préfixe de route selon le rôle stocké ────────────
function getNotificationsPath() {
  const role = localStorage.getItem('role');
  if (role === 'CLIENT')     return '/notifications';
  if (role === 'TECHNICIEN') return '/tech/notifications';
  return '/admin/notifications'; // ADMIN par défaut
}

function getTicketPath(ticketId) {
  const role = localStorage.getItem('role');
  if (role === 'CLIENT')     return `/tickets/${ticketId}`;
  if (role === 'TECHNICIEN') return `/tech/tickets/${ticketId}`;
  return `/admin/tickets/${ticketId}`;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Fermer en cliquant à l'extérieur
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleClick(notif) {
    if (!notif.lu) markAsRead(notif.id);
    if (notif.ticketId) navigate(getTicketPath(notif.ticketId));
    setOpen(false);
  }

  // Aperçu limité à 5 notifs dans le dropdown
  const preview = notifications.slice(0, 5);

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Bouton cloche ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative',
          padding: '8px',
          borderRadius: '12px',
          border: 'none',
          background: open ? '#f3f4f6' : 'transparent',
          cursor: 'pointer',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
        onMouseLeave={e => e.currentTarget.style.background = open ? '#f3f4f6' : 'transparent'}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '6px', right: '6px',
            minWidth: '16px', height: '16px',
            background: '#E31E24',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '360px',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#fef2f2',
                  color: '#E31E24',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '1px 7px',
                  borderRadius: '10px',
                }}>
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Tout marquer comme lu"
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', color: '#E31E24', fontWeight: 500,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 8px', borderRadius: '8px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <CheckCheck size={14} />
                Tout lire
              </button>
            )}
          </div>

          {/* Liste (aperçu 5 notifs) */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '32px',
                color: '#9ca3af', gap: '8px',
              }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px' }}>Chargement…</span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '32px',
                color: '#9ca3af', gap: '8px',
              }}>
                <Bell size={28} strokeWidth={1.2} />
                <span style={{ fontSize: '13px' }}>Aucune notification</span>
              </div>
            ) : (
              preview.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: notif.lu ? 'transparent' : '#fafafa',
                    borderBottom: '1px solid #f9fafb',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.background = notif.lu ? 'transparent' : '#fafafa'}
                >
                  {/* Point coloré */}
                  <div style={{ paddingTop: '4px', flexShrink: 0 }}>
                    <span style={{
                      display: 'block',
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      background: notif.lu ? '#d1d5db' : dot(notif.type),
                      transition: 'background 0.2s',
                    }} />
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '2px',
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: notif.lu ? 500 : 600,
                        color: '#111827',
                        lineHeight: 1.3,
                      }}>
                        {notif.titre}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}>
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: 0,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {notif.message}
                    </p>
                    {TYPE_META[notif.type] && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 7px',
                        borderRadius: '8px',
                        background: dot(notif.type) + '18',
                        color: dot(notif.type),
                      }}>
                        {TYPE_META[notif.type].label}
                      </span>
                    )}
                  </div>

                  {/* Marquer lu */}
                  {!notif.lu && (
                    <button
                      onClick={e => { e.stopPropagation(); markAsRead(notif.id); }}
                      title="Marquer comme lu"
                      style={{
                        alignSelf: 'flex-start',
                        marginTop: '2px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#d1d5db',
                        padding: '2px',
                        borderRadius: '4px',
                        flexShrink: 0,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
                      onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}

            {/* "Et X de plus…" si plus de 5 */}
            {notifications.length > 5 && (
              <div style={{
                padding: '8px 16px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#9ca3af',
                borderBottom: '1px solid #f3f4f6',
              }}>
                Et {notifications.length - 5} autre{notifications.length - 5 > 1 ? 's' : ''}…
              </div>
            )}
          </div>

          {/* Footer — Voir toutes (route selon rôle) */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid #f3f4f6',
            textAlign: 'center',
          }}>
            <button
              onClick={() => { navigate(getNotificationsPath()); setOpen(false); }}
              style={{
                fontSize: '12px',
                color: '#E31E24',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              Voir toutes les notifications
              {notifications.length > 0 && (
                <span style={{ marginLeft: '4px', color: '#9ca3af', fontWeight: 400 }}>
                  ({notifications.length})
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
