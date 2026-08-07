/**
 * useAvatar.js — v3 (logout-safe)
 *
 * Stratégie de persistance robuste :
 * ─────────────────────────────────
 * L'avatar est stocké sous la clé "avatar_<email>" dans localStorage.
 *
 * ✅ FIX PRINCIPAL : logout() vidait tout avec localStorage.clear().
 *    Solution → avant clear(), on sauvegarde TOUS les avatars (avatar_*)
 *    dans une variable, puis on les restaure immédiatement après.
 *    Utilisez la fonction `safeLogout()` exportée ici dans vos layouts.
 *
 * Flux complet :
 *   1. Login  → localStorage contient 'email'
 *   2. useAvatar lit avatar_<email> → affiche la photo
 *   3. Changement de photo → écrit dans avatar_<email> + dispatch event
 *   4. Logout → safeLogout() préserve tous les avatar_* puis clear()
 *   5. Re-login avec le même email → avatar_<email> retrouvé ✓
 */

import { useState, useEffect, useCallback } from 'react';

const AVATAR_EVENT = 'avatarUpdated';

/** Clé de stockage pour un email donné */
export function avatarKey(email) {
  if (!email) return null;
  return `avatar_${email.toLowerCase().trim()}`;
}

/** Lire l'avatar d'un utilisateur quelconque (pour AdminUsers, etc.) */
export function getAvatarByEmail(email) {
  const key = avatarKey(email);
  return key ? localStorage.getItem(key) || null : null;
}

/** Enregistrer l'avatar d'un utilisateur */
export function saveAvatarByEmail(email, url) {
  const key = avatarKey(email);
  if (!key) return;
  if (url) {
    localStorage.setItem(key, url);
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * ✅ REMPLACE localStorage.clear() dans tous vos layouts.
 * Préserve tous les avatars (avatar_*) après le clear.
 */
export function safeLogout() {
  // 1. Collecter tous les avatars avant d'effacer
  const avatarsToKeep = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('avatar_')) {
      avatarsToKeep[k] = localStorage.getItem(k);
    }
  }

  // 2. Vider le localStorage (session, tokens, etc.)
  localStorage.clear();

  // 3. Restaurer les avatars
  Object.entries(avatarsToKeep).forEach(([k, v]) => {
    if (v) localStorage.setItem(k, v);
  });
}

function dispatchAvatarEvent(email, url) {
  window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: { email, url } }));
}

/**
 * Hook principal — à utiliser dans ProfilePage et les Layouts.
 * Lit/écrit toujours pour l'utilisateur connecté (email dans localStorage).
 */
export function useAvatar() {
  const getEmail = () => localStorage.getItem('email') || '';

  const readCurrent = () => {
    const email = getEmail();
    return getAvatarByEmail(email);
  };

  const [avatarUrl, setAvatarUrlState] = useState(readCurrent);

  // Écoute les mises à jour depuis ProfilePage (cross-composant)
  useEffect(() => {
    const handler = (e) => {
      const currentEmail = getEmail();
      if (e.detail?.email === currentEmail || !e.detail?.email) {
        setAvatarUrlState(e.detail?.url || null);
      }
    };
    window.addEventListener(AVATAR_EVENT, handler);
    return () => window.removeEventListener(AVATAR_EVENT, handler);
  }, []);

  // Re-lire au montage (utile après login)
  useEffect(() => {
    setAvatarUrlState(readCurrent());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Enregistre et propage le nouvel avatar pour l'utilisateur connecté. */
  const setAvatar = useCallback((url) => {
    const email = getEmail();
    saveAvatarByEmail(email, url);
    setAvatarUrlState(url);
    dispatchAvatarEvent(email, url);
  }, []);

  const clearAvatar = useCallback(() => {
    setAvatar(null);
  }, [setAvatar]);

  return { avatarUrl, setAvatar, clearAvatar };
}
