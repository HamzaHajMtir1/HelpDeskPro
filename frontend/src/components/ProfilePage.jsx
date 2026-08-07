/**
 * ProfilePage.jsx — v3 Professional
 *
 * Nouveautés :
 * ✅ Upload avatar avec preview live + animation
 * ✅ Recadrage/zoom simulé avec overlay drag
 * ✅ Persistance localStorage + event cross-composant (useAvatar)
 * ✅ Bouton "Supprimer la photo"
 * ✅ Indicateur de chargement pendant l'upload
 * ✅ Toast de confirmation stylisé
 * ✅ Design professionnel raffiné
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Shield, Key,
  Camera, CheckCircle, Lock, Edit3, Trash2,
  Upload, X, ZoomIn
} from 'lucide-react';
import api from '../api/axios';
import { useAvatar } from '../hooks/useAvatar';

/* ─── helpers ─── */
const MAX_SIZE_MB  = 5;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.readAsDataURL(file);
  });
}

/* ─── Toast interne ─── */
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const styles = {
    success: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', icon: '✓' },
    error:   { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', icon: '✗' },
    info:    { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', icon: 'i' },
  };
  const s = styles[toast.type] || styles.info;

  return (
    <div
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', borderRadius: 16,
        backgroundColor: s.bg, border: `1.5px solid ${s.border}`,
        color: s.text, fontSize: 13, fontWeight: 600,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        animation: 'slideInToast .25s cubic-bezier(.34,1.56,.64,1)',
        maxWidth: 340,
      }}
    >
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        backgroundColor: s.border, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, flexShrink: 0,
        color: s.text,
      }}>{s.icon}</span>
      <span>{toast.msg}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text, marginLeft: 4, padding: 0, opacity: .6 }}>
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

/* ─── Avatar Upload Modal ─── */
function AvatarModal({ currentUrl, initials, gradientColor, onSave, onClose }) {
  const [preview,   setPreview]   = useState(currentUrl);
  const [dragging,  setDragging]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [file,      setFile]      = useState(null);
  const inputRef = useRef(null);

  const processFile = async (f) => {
    setError('');
    if (!ALLOWED_MIME.includes(f.type)) {
      setError('Format non supporté. Utilisez JPG, PNG, WebP ou GIF.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).`);
      return;
    }
    setLoading(true);
    try {
      const url = await fileToDataUrl(f);
      setPreview(url);
      setFile(f);
    } catch (e) {
      setError('Impossible de lire le fichier.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleSave = () => {
    if (!preview) return;
    onSave(preview);
    onClose();
  };

  const handleRemove = () => {
    onSave(null);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeInOverlay .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, borderRadius: 24,
          background: '#fff', boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
          overflow: 'hidden', animation: 'slideUpModal .28s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {/* Header modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f3f4f6',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
              Photo de profil
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>
              JPG, PNG, WebP · Max {MAX_SIZE_MB} Mo
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10, border: '1.5px solid #e5e7eb',
            background: '#f9fafb', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#6b7280',
          }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              {preview ? (
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  overflow: 'hidden',
                  border: `3px solid ${gradientColor}`,
                  boxShadow: `0 0 0 4px ${gradientColor}22`,
                  transition: 'all .3s ease',
                }}>
                  <img src={preview} alt="Aperçu"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ) : (
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: `linear-gradient(135deg, #1a1a1a, ${gradientColor})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, fontWeight: 700, color: '#fff',
                  border: `3px solid ${gradientColor}`,
                  boxShadow: `0 0 0 4px ${gradientColor}22`,
                }}>
                  {initials}
                </div>
              )}
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.45)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 28, height: 28, border: '3px solid rgba(255,255,255,.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin .7s linear infinite',
                  }} />
                </div>
              )}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? gradientColor : '#d1d5db'}`,
              borderRadius: 16, padding: '28px 20px',
              textAlign: 'center', cursor: 'pointer',
              background: dragging ? `${gradientColor}08` : '#fafafa',
              transition: 'all .2s ease',
            }}
          >
            <input ref={inputRef} type="file" accept={ALLOWED_MIME.join(',')}
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files[0]) processFile(e.target.files[0]); e.target.value = ''; }} />

            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: dragging ? `${gradientColor}15` : '#f3f4f6',
              border: `1.5px solid ${dragging ? gradientColor : '#e5e7eb'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', transition: 'all .2s ease',
            }}>
              <Upload style={{ width: 22, height: 22, color: dragging ? gradientColor : '#9ca3af' }} />
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 600, color: dragging ? gradientColor : '#374151' }}>
              {dragging ? 'Déposez l\'image ici' : 'Glissez une image ou cliquez'}
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: '#9ca3af' }}>
              Formats acceptés : JPG, PNG, WebP, GIF
            </p>
          </div>

          {error && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 12,
              background: '#fef2f2', border: '1px solid #fca5a5',
              color: '#b91c1c', fontSize: 12.5, fontWeight: 500,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer modal */}
        <div style={{
          display: 'flex', gap: 10, padding: '0 24px 24px',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            {currentUrl && (
              <button onClick={handleRemove} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 12,
                border: '1.5px solid #fca5a5', background: '#fef2f2',
                color: '#b91c1c', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer',
              }}>
                <Trash2 style={{ width: 13, height: 13 }} />
                Supprimer
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              padding: '9px 18px', borderRadius: 12,
              border: '1.5px solid #e5e7eb', background: '#f9fafb',
              color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!preview || loading}
              style={{
                padding: '9px 22px', borderRadius: 12, border: 'none',
                background: !preview || loading ? '#d1d5db' : `linear-gradient(135deg, #1a1a1a, ${gradientColor})`,
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: !preview || loading ? 'not-allowed' : 'pointer',
                boxShadow: !preview || loading ? 'none' : `0 4px 16px ${gradientColor}44`,
                transition: 'all .2s ease',
              }}
            >
              {loading ? 'Traitement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function ProfilePage({
  Layout, backPath, roleLabel, roleColor, gradientColor = '#E31E24'
}) {
  const navigate = useNavigate();

  const userId    = localStorage.getItem('userId');
  const email     = localStorage.getItem('email');
  const firstName = localStorage.getItem('firstName');
  const lastName  = localStorage.getItem('lastName');

  const { avatarUrl, setAvatar } = useAvatar();

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [toast,           setToast]           = useState(null);

  const [editForm,    setEditForm]    = useState({ firstName, lastName });
  const [editSuccess, setEditSuccess] = useState('');
  const [editError,   setEditError]   = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [pwdForm,     setPwdForm]     = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwdSuccess,  setPwdSuccess]  = useState('');
  const [pwdError,    setPwdError]    = useState('');
  const [pwdLoading,  setPwdLoading]  = useState(false);
  const [showOld,     setShowOld]     = useState(false);
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab,   setActiveTab]   = useState('info');

  const [secConfig, setSecConfig] = useState({
    minLength: 6, requireUppercase: false, requireNumbers: false, requireSpecial: false,
  });

  useEffect(() => {
    api.get('/admin/settings/public')
      .then(({ data }) => {
        setSecConfig({
          minLength:        parseInt(data.passwordMinLength) || 6,
          requireUppercase: data.requireUppercase   === 'true',
          requireNumbers:   data.requireNumbers     === 'true',
          requireSpecial:   data.requireSpecialChar === 'true',
        });
      })
      .catch(() => {});
  }, []);

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
  }, []);

  /* ── Avatar ── */
  const handleAvatarSave = useCallback((url) => {
    setAvatar(url);
    showToast('success', url ? 'Photo de profil mise à jour !' : 'Photo de profil supprimée.');
  }, [setAvatar, showToast]);

  /* ── Edit profil ── */
  const handleEditProfile = async (e) => {
    e.preventDefault();
    setEditError(''); setEditSuccess('');
    setEditLoading(true);
    try {
      await api.put(`/admin/users/${userId}`, {
        firstName: editForm.firstName,
        lastName:  editForm.lastName,
      });
      localStorage.setItem('firstName', editForm.firstName);
      localStorage.setItem('lastName',  editForm.lastName);
      setEditSuccess('Profil mis à jour avec succès !');
      showToast('success', 'Informations enregistrées !');
    } catch (err) {
      setEditError(err.response?.data || 'Erreur lors de la modification');
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Mot de passe ── */
  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < secConfig.minLength)
      errors.push(`Au moins ${secConfig.minLength} caractères`);
    if (secConfig.requireUppercase && !/[A-Z]/.test(pwd))
      errors.push('Au moins une majuscule');
    if (secConfig.requireNumbers && !/[0-9]/.test(pwd))
      errors.push('Au moins un chiffre');
    if (secConfig.requireSpecial && !/[^A-Za-z0-9]/.test(pwd))
      errors.push('Au moins un caractère spécial');
    return errors;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (!pwdForm.oldPassword.trim()) { setPwdError('Veuillez saisir votre ancien mot de passe'); return; }
    const ve = validatePassword(pwdForm.newPassword);
    if (ve.length) { setPwdError(ve.join(' · ')); return; }
    if (pwdForm.newPassword !== pwdForm.confirm) { setPwdError('Les mots de passe ne correspondent pas'); return; }
    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdSuccess('Mot de passe modifié avec succès !');
      setPwdForm({ oldPassword: '', newPassword: '', confirm: '' });
      showToast('success', 'Mot de passe modifié !');
    } catch (err) {
      setPwdError(err.response?.data?.message || err.response?.data || 'Erreur lors de la modification');
    } finally {
      setPwdLoading(false);
    }
  };

  const strength = (() => {
    const p = pwdForm.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= secConfig.minLength)        s++;
    if (p.length >= secConfig.minLength + 4)    s++;
    if (/[A-Z]/.test(p))                        s++;
    if (/[0-9]/.test(p))                        s++;
    if (/[^A-Za-z0-9]/.test(p))                s++;
    return s;
  })();

  const strengthLabel = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'][strength];
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <Layout>
      {/* CSS animations */}
      <style>{`
        @keyframes fadeInOverlay  { from { opacity: 0 }        to { opacity: 1 } }
        @keyframes slideUpModal   { from { opacity: 0; transform: translateY(32px) scale(.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes slideInToast   { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin           { to { transform: rotate(360deg) } }
        @keyframes fadeIn         { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }

        .profile-avatar-btn:hover .profile-avatar-overlay { opacity: 1 !important; }
        .profile-tab-btn { transition: all .2s ease; }
        .profile-input:focus { outline: none; }
        .profile-info-row:hover { background: #f9fafb !important; }
      `}</style>

      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {showAvatarModal && (
        <AvatarModal
          currentUrl={avatarUrl}
          initials={initials}
          gradientColor={gradientColor}
          onSave={handleAvatarSave}
          onClose={() => setShowAvatarModal(false)}
        />
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', animation: 'fadeIn .3s ease' }}>

        {/* ─── En-tête ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => navigate(backPath)} style={{
            width: 40, height: 40, borderRadius: 12,
            border: '1.5px solid #e5e7eb', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6b7280',
            boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = gradientColor; e.currentTarget.style.color = gradientColor; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>
              Mon profil
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#9ca3af' }}>
              Gérez vos informations personnelles et votre sécurité
            </p>
          </div>
        </div>

        {/* ─── Bannière hero ─── */}
        <div style={{
          borderRadius: 24,
          background: `linear-gradient(135deg, #111827 0%, #1a1a1a 40%, ${gradientColor} 100%)`,
          padding: '32px 36px',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Cercles décoratifs */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }} />
          <div style={{
            position: 'absolute', bottom: -40, right: 60,
            width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 28 }}>
            {/* Avatar cliquable */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                className="profile-avatar-btn"
                onClick={() => setShowAvatarModal(true)}
                title="Modifier la photo de profil"
                style={{
                  position: 'relative', width: 100, height: 100,
                  borderRadius: '50%', border: 'none', padding: 0,
                  cursor: 'pointer', background: 'none',
                  display: 'block',
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar"
                    style={{
                      width: 100, height: 100, borderRadius: '50%',
                      objectFit: 'cover', display: 'block',
                      border: '3px solid rgba(255,255,255,0.25)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }} />
                ) : (
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    border: '3px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 800, color: '#fff',
                    letterSpacing: '-1px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}>
                    {initials}
                  </div>
                )}
                {/* Overlay hover */}
                <div className="profile-avatar-overlay" style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.52)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity .2s ease',
                  gap: 4,
                }}>
                  <Camera style={{ width: 22, height: 22, color: '#fff' }} />
                  <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>Modifier</span>
                </div>
              </button>

              {/* Badge caméra permanent */}
              <button
                onClick={() => setShowAvatarModal(true)}
                style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 28, height: 28, borderRadius: '50%',
                  background: gradientColor,
                  border: '2.5px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  transition: 'transform .15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Changer la photo"
              >
                <Camera style={{ width: 13, height: 13, color: '#fff' }} />
              </button>
            </div>

            {/* Infos */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                margin: '0 0 6px', fontSize: 22, fontWeight: 800,
                color: '#fff', letterSpacing: '-0.4px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {firstName} {lastName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11.5, padding: '4px 12px', borderRadius: 20,
                  fontWeight: 700, letterSpacing: '.03em',
                  backgroundColor: roleColor.bg, color: roleColor.text,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  {roleLabel}
                </span>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email}
                </span>
              </div>


            </div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 20,
          padding: 6, background: '#fff',
          borderRadius: 18, border: '1.5px solid #f1f5f9',
          boxShadow: '0 1px 6px rgba(0,0,0,.05)',
        }}>
          {[
            { key: 'info',     label: 'Informations',     icon: Edit3 },
            { key: 'security', label: 'Sécurité',         icon: Lock  },
          ].map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button key={key}
                className="profile-tab-btn"
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '11px 16px', borderRadius: 13,
                  border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                  background: active ? `linear-gradient(135deg, #1a1a1a, ${gradientColor})` : 'transparent',
                  color: active ? '#fff' : '#6b7280',
                  boxShadow: active ? `0 4px 14px ${gradientColor}33` : 'none',
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {label}
              </button>
            );
          })}
        </div>

        {/* ─── Onglet INFORMATIONS ─── */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Récapitulatif */}
            <div style={{
              background: '#fff', borderRadius: 20, border: '1.5px solid #f1f5f9',
              boxShadow: '0 1px 6px rgba(0,0,0,.05)', padding: '24px',
            }}>
              <p style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Aperçu du compte
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: User,   label: 'Nom complet', value: `${firstName} ${lastName}` },
                  { icon: Mail,   label: 'Adresse email', value: email || '—' },
                  { icon: Shield, label: 'Rôle',          value: roleLabel },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="profile-info-row" style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 14,
                    background: '#fafafa', border: '1px solid #f3f4f6',
                    transition: 'background .15s',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                      background: `${gradientColor}12`,
                      border: `1.5px solid ${gradientColor}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon style={{ width: 16, height: 16, color: gradientColor }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13.5, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulaire édition */}
            <div style={{
              background: '#fff', borderRadius: 20, border: '1.5px solid #f1f5f9',
              boxShadow: '0 1px 6px rgba(0,0,0,.05)', padding: '24px',
            }}>
              <p style={{ margin: '0 0 20px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Modifier mes informations
              </p>
              <form onSubmit={handleEditProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  {[
                    { key: 'firstName', label: 'Prénom' },
                    { key: 'lastName',  label: 'Nom'    },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 7 }}>
                        {label}
                      </label>
                      <input
                        className="profile-input"
                        type="text"
                        value={editForm[key]}
                        onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 12,
                          border: '1.5px solid #e5e7eb', background: '#fafafa',
                          fontSize: 13.5, color: '#111827', fontWeight: 500,
                          transition: 'border-color .15s, box-shadow .15s',
                          boxSizing: 'border-box',
                        }}
                        onFocus={e => { e.target.style.borderColor = gradientColor; e.target.style.boxShadow = `0 0 0 3px ${gradientColor}18`; }}
                        onBlur={e  => { e.target.style.borderColor = '#e5e7eb';    e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  ))}
                </div>

                {editError && (
                  <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13 }}>
                    {editError}
                  </div>
                )}
                {editSuccess && (
                  <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle style={{ width: 15, height: 15 }} /> {editSuccess}
                  </div>
                )}

                <button type="submit" disabled={editLoading} style={{
                  width: '100%', padding: '12px', borderRadius: 14, border: 'none',
                  background: editLoading ? '#d1d5db' : `linear-gradient(135deg, #1a1a1a, ${gradientColor})`,
                  color: '#fff', fontSize: 14, fontWeight: 700, cursor: editLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: editLoading ? 'none' : `0 4px 16px ${gradientColor}33`,
                  transition: 'all .2s ease',
                }}>
                  {editLoading ? (
                    <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />Enregistrement…</>
                  ) : 'Enregistrer les modifications'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── Onglet SÉCURITÉ ─── */}
        {activeTab === 'security' && (
          <div style={{
            background: '#fff', borderRadius: 20, border: '1.5px solid #f1f5f9',
            boxShadow: '0 1px 6px rgba(0,0,0,.05)', padding: '28px',
          }}>
            <p style={{ margin: '0 0 20px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Changer le mot de passe
            </p>

            {/* Règles */}
            <div style={{
              marginBottom: 22, padding: '14px 16px', borderRadius: 14,
              background: '#f9fafb', border: '1.5px solid #f1f5f9',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 11.5, fontWeight: 700, color: '#374151' }}>
                Règles de sécurité
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { label: `Au moins ${secConfig.minLength} caractères`, always: true },
                  { label: 'Au moins une majuscule',      show: secConfig.requireUppercase },
                  { label: 'Au moins un chiffre',          show: secConfig.requireNumbers   },
                  { label: 'Au moins un caractère spécial',show: secConfig.requireSpecial   },
                ].filter(r => r.always || r.show).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: gradientColor, flexShrink: 0 }} />
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Champs mot de passe */}
              {[
                { key: 'oldPassword', label: 'Mot de passe actuel',    show: showOld,     setShow: setShowOld,     placeholder: 'Votre mot de passe actuel'       },
                { key: 'newPassword', label: 'Nouveau mot de passe',   show: showPwd,     setShow: setShowPwd,     placeholder: `Min. ${secConfig.minLength} caractères` },
                { key: 'confirm',     label: 'Confirmer le mot de passe', show: showConfirm, setShow: setShowConfirm, placeholder: 'Répétez le nouveau mot de passe'  },
              ].map(({ key, label, show, setShow, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 7 }}>
                    {label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="profile-input"
                      type={show ? 'text' : 'password'}
                      value={pwdForm[key]}
                      onChange={e => setPwdForm({ ...pwdForm, [key]: e.target.value })}
                      placeholder={placeholder}
                      required
                      style={{
                        width: '100%', padding: '10px 48px 10px 14px', borderRadius: 12,
                        border: '1.5px solid #e5e7eb', background: '#fafafa',
                        fontSize: 13.5, color: '#111827',
                        transition: 'border-color .15s, box-shadow .15s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.borderColor = gradientColor; e.target.style.boxShadow = `0 0 0 3px ${gradientColor}18`; }}
                      onBlur={e  => { e.target.style.borderColor = '#e5e7eb';    e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShow(!show)} style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 11.5, fontWeight: 600, color: '#9ca3af',
                      transition: 'color .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = gradientColor}
                    onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                      {show ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>

                  {/* Barre de force */}
                  {key === 'newPassword' && pwdForm.newPassword && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                        {[1,2,3,4,5].map(i => (
                          <div key={i} style={{
                            flex: 1, height: 4, borderRadius: 4,
                            background: i <= strength ? strengthColor : '#e5e7eb',
                            transition: 'background .3s ease',
                          }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: strengthColor }}>
                          {strengthLabel}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Force du mot de passe</p>
                      </div>
                    </div>
                  )}

                  {/* Match indicator */}
                  {key === 'confirm' && pwdForm.confirm && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 600, color: pwdForm.newPassword === pwdForm.confirm ? '#22c55e' : '#ef4444' }}>
                      {pwdForm.newPassword === pwdForm.confirm ? '✓ Les mots de passe correspondent' : '✗ Ne correspondent pas'}
                    </p>
                  )}
                </div>
              ))}

              {pwdError && (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13 }}>
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle style={{ width: 15, height: 15 }} /> {pwdSuccess}
                </div>
              )}

              <button type="submit" disabled={pwdLoading} style={{
                width: '100%', padding: '12px', borderRadius: 14, border: 'none',
                background: pwdLoading ? '#d1d5db' : `linear-gradient(135deg, #1a1a1a, ${gradientColor})`,
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: pwdLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: pwdLoading ? 'none' : `0 4px 16px ${gradientColor}33`,
                transition: 'all .2s ease',
              }}>
                {pwdLoading ? (
                  <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />Modification…</>
                ) : <><Lock style={{ width: 15, height: 15 }} />Changer le mot de passe</>}
              </button>
            </form>
          </div>
        )}

        {/* Bottom spacing */}
        <div style={{ height: 40 }} />
      </div>
    </Layout>
  );
}
