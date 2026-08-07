// components/Toast.jsx
// ─────────────────────────────────────────────────────────────
//  Remplace TOUS les alert() / confirm() natifs du navigateur
//  Usage :
//    const { showToast, showConfirm, ToastContainer } = useToast();
//    showToast('success', 'Compte créé !', 'Email envoyé à Jean.')
//    const ok = await showConfirm('Supprimer ce ticket ?', 'Le ticket #TKT-050 sera définitivement supprimé.')
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Trash2, AlertCircle } from 'lucide-react';

/* ── Icônes et couleurs par type ── */
const TYPES = {
  success: {
    icon: CheckCircle2,
    bg: '#f0fdf4',
    border: '#86efac',
    iconColor: '#16a34a',
    bar: '#16a34a',
  },
  error: {
    icon: XCircle,
    bg: '#fef2f2',
    border: '#fca5a5',
    iconColor: '#dc2626',
    bar: '#dc2626',
  },
  warning: {
    icon: AlertTriangle,
    bg: '#fffbeb',
    border: '#fcd34d',
    iconColor: '#d97706',
    bar: '#f59e0b',
  },
  info: {
    icon: Info,
    bg: '#eff6ff',
    border: '#bfdbfe',
    iconColor: '#2563eb',
    bar: '#3b82f6',
  },
};

/* ══════════════════════════════════════════════════════════════
   TOAST — notification temporaire (3 s)
══════════════════════════════════════════════════════════════ */
function ToastItem({ toast, onRemove }) {
  const cfg = TYPES[toast.type] || TYPES.info;
  const Icon = cfg.icon;

  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${cfg.border}`,
        borderLeft: `4px solid ${cfg.bar}`,
        borderRadius: 14,
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        minWidth: 320,
        maxWidth: 420,
        animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Icône */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: cfg.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={cfg.iconColor} />
      </div>

      {/* Texte */}
      <div style={{ flex: 1, paddingTop: 2 }}>
        {toast.title && (
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p style={{ margin: toast.title ? '4px 0 0' : 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Bouton fermer */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 6,
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>

      {/* Barre de progression */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 3,
          background: cfg.bar,
          borderRadius: '0 0 0 14px',
          animation: 'toastBar 3s linear forwards',
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CONFIRM DIALOG — remplace window.confirm()
══════════════════════════════════════════════════════════════ */
function ConfirmDialog({ dialog, onResolve }) {
  if (!dialog) return null;

  const isDelete = dialog.variant === 'delete';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          animation: 'dialogIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Icône centrale */}
        <div style={{ padding: '32px 32px 0', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: isDelete ? '#fef2f2' : '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDelete
              ? <Trash2 size={28} color="#E31E24" />
              : <AlertCircle size={28} color="#f59e0b" />
            }
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '20px 32px 0', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
            {dialog.title}
          </h2>
          {dialog.message && (
            <p style={{ margin: '10px 0 0', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
              {dialog.message}
            </p>
          )}
        </div>

        {/* Boutons */}
        <div style={{ padding: '24px 32px 28px', display: 'flex', gap: 12 }}>
          <button
            onClick={() => onResolve(false)}
            style={{
              flex: 1,
              height: 44,
              border: '1.5px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Annuler
          </button>
          <button
            onClick={() => onResolve(true)}
            style={{
              flex: 1,
              height: 44,
              border: 'none',
              borderRadius: 12,
              background: isDelete ? '#E31E24' : '#f59e0b',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDelete ? '#b91c1c' : '#d97706'}
            onMouseLeave={e => e.currentTarget.style.background = isDelete ? '#E31E24' : '#f59e0b'}
          >
            {isDelete && <Trash2 size={16} />}
            {dialog.confirmLabel || 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOOK useToast — à utiliser dans tes composants
══════════════════════════════════════════════════════════════ */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  /* Ajoute un toast temporaire */
  const showToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* Ouvre une dialog de confirmation — retourne une Promise<boolean> */
  const showConfirm = useCallback(({ title, message, confirmLabel = 'Confirmer', variant = 'default' }) => {
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setDialog({ title, message, confirmLabel, variant });
    });
  }, []);

  const handleResolve = useCallback((value) => {
    setDialog(null);
    resolveRef.current?.(value);
  }, []);

  /* Composant conteneur à placer UNE FOIS dans ton App ou layout */
  const ToastContainer = useCallback(() => (
    <>
      {/* Keyframes injectés une seule fois */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes toastBar {
          from { width: 100%; }
          to   { width: 0%;   }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dialogIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>

      {/* Stack de toasts */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>

      {/* Dialog de confirmation */}
      <ConfirmDialog dialog={dialog} onResolve={handleResolve} />
    </>
  ), [toasts, dialog, removeToast, handleResolve]);

  return { showToast, showConfirm, ToastContainer };
}
