import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../api/notificationApi';

const POLL_INTERVAL = 30_000;

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const intervalRef  = useRef(null);
  const initialDone  = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      if (!initialDone.current) setLoading(true);
      const [notifsRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.nonLues ?? 0);
    } catch (err) {
      console.error('Erreur chargement notifications :', err);
    } finally {
      setLoading(false);
      initialDone.current = true;
    }
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.nonLues ?? 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll, fetchCount]);

  // ── Marquer une notif comme lue ────────────────────────────────
  const handleMarkAsRead = useCallback(async (id) => {
    // Mise à jour optimiste immédiate
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, lu: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await markAsRead(id);
      // Pas de resync immédiate — le polling s'en charge
    } catch (err) {
      console.error('Erreur marquer lue :', err);
      fetchAll(); // rollback complet si erreur
    }
  }, [fetchAll]);

  // ── Marquer toutes comme lues ──────────────────────────────────
  const handleMarkAllAsRead = useCallback(async () => {
    // Mise à jour optimiste immédiate
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    setUnreadCount(0);

    try {
      await markAllAsRead();
      // Pas de resync immédiate — évite le race condition avec le backend
    } catch (err) {
      console.error('Erreur marquer toutes lues :', err);
      fetchAll(); // rollback complet si erreur
    }
  }, [fetchAll]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh:       fetchAll,
    markAsRead:    handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };
}
