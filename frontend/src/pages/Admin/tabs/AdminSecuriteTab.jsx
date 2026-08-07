import { useState, useEffect } from 'react';
import { Save, Lock, Key, Shield, Loader2 } from 'lucide-react';
import api from '../../../api/axios';

const RED      = '#E31E24';
const RED_DARK = '#b81519';

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button type="button" onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
      style={{ backgroundColor: checked ? RED : '#e5e7eb' }}>
      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
           style={{ left: checked ? '22px' : '2px' }} />
    </button>
  </div>
);

const b = v => v === 'true' || v === true;

export default function AdminSecuriteTab() {
  const [form, setForm] = useState({
    sessionTimeout:     '30',
    maxLoginAttempts:   '5',
    passwordMinLength:  '8',
    requireUppercase:   true,
    requireNumbers:     true,
    requireSpecialChar: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  const focusRed  = e => { e.target.style.borderColor = RED; e.target.style.boxShadow = '0 0 0 2px rgba(227,30,36,0.1)'; };
  const blurReset = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setForm({
        sessionTimeout:     data.sessionTimeout    || '30',
        maxLoginAttempts:   data.maxLoginAttempts  || '5',
        passwordMinLength:  data.passwordMinLength || '8',
        requireUppercase:   b(data.requireUppercase),
        requireNumbers:     b(data.requireNumbers),
        requireSpecialChar: b(data.requireSpecialChar),
      }))
      .catch(() => setErr('Impossible de charger les paramètres.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      await api.put('/admin/settings', {
        sessionTimeout:     form.sessionTimeout,
        maxLoginAttempts:   form.maxLoginAttempts,
        passwordMinLength:  form.passwordMinLength,
        requireUppercase:   String(form.requireUppercase),
        requireNumbers:     String(form.requireNumbers),
        requireSpecialChar: String(form.requireSpecialChar),
      });
      setMsg('Sécurité enregistrée ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setErr('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin"
           style={{ borderColor: RED, borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Sécurité</h2>
        <p className="text-sm text-gray-500 mt-0.5">Paramètres de sécurité et d'accès</p>
      </div>

      <div className="space-y-4 max-w-2xl">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Session
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Timeout session (min)
              </label>
              <input type="number" min="5"
                value={form.sessionTimeout}
                onChange={e => setForm({ ...form, sessionTimeout: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm outline-none bg-gray-50 transition"
                onFocus={focusRed} onBlur={blurReset} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tentatives max de connexion
              </label>
              <input type="number" min="1"
                value={form.maxLoginAttempts}
                onChange={e => setForm({ ...form, maxLoginAttempts: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm outline-none bg-gray-50 transition"
                onFocus={focusRed} onBlur={blurReset} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Key className="w-4 h-4" /> Politique de mot de passe
          </h3>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Longueur minimale
            </label>
            <input type="number" min="6"
              value={form.passwordMinLength}
              onChange={e => setForm({ ...form, passwordMinLength: e.target.value })}
              className="w-32 px-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm outline-none bg-gray-50 transition"
              onFocus={focusRed} onBlur={blurReset} />
          </div>
          <Toggle checked={form.requireUppercase}
            onChange={v => setForm({ ...form, requireUppercase: v })}
            label="Majuscule obligatoire"
            description="Au moins une lettre majuscule" />
          <Toggle checked={form.requireNumbers}
            onChange={v => setForm({ ...form, requireNumbers: v })}
            label="Chiffre obligatoire"
            description="Au moins un chiffre" />
          <Toggle checked={form.requireSpecialChar}
            onChange={v => setForm({ ...form, requireSpecialChar: v })}
            label="Caractère spécial obligatoire"
            description="Au moins un caractère spécial (!@#...)" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Info
          </h3>
          <p className="text-xs text-gray-400">
            Les règles de mot de passe s'appliquent lors de la création ou
            réinitialisation d'un compte. Les sessions existantes ne sont
            pas affectées par le timeout avant reconnexion.
          </p>
        </div>

        {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{err}</div>}
        {msg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{msg}</div>}

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-white font-semibold rounded-xl text-sm transition"
          style={{ backgroundColor: saving ? '#f09092' : RED }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = RED_DARK; }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = RED; }}>
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
            : <><Save className="w-4 h-4" /> Enregistrer</>}
        </button>
      </div>
    </div>
  );
}
