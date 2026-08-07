import { useState, useEffect } from 'react';
import { Save, Building, Loader2 } from 'lucide-react';
import api from '../../../api/axios';
import { useSettings } from '../../../context/SettingsContext';

const RED      = '#E31E24';
const RED_DARK = '#b81519';

const DEFAULTS = {
  companyName:   'Help Desk IT',
  companySlogan: 'Système de support',
  ticketPrefix:  'TKT',
  logoText:      'Help Desk IT',
};

export default function AdminGeneralTab() {
  const [form,    setForm]    = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');
  const { refresh } = useSettings();

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => {
        setForm({
          companyName:   data.companyName   || DEFAULTS.companyName,
          companySlogan: data.companySlogan || DEFAULTS.companySlogan,
          ticketPrefix:  data.ticketPrefix  || DEFAULTS.ticketPrefix,
          logoText:      data.logoText      || DEFAULTS.logoText,
        });
      })
      .catch(() => setErr('Impossible de charger les paramètres.'))
      .finally(() => setLoading(false));
  }, []);

  const focusRed  = e => { e.target.style.borderColor = RED; e.target.style.boxShadow = '0 0 0 2px rgba(227,30,36,0.1)'; };
  const blurReset = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');

    // Validation : les champs obligatoires ne peuvent pas être vides
    if (!form.companyName.trim()) {
      setErr('Le nom du système est obligatoire.');
      return;
    }
    if (!form.ticketPrefix.trim()) {
      setErr('Le préfixe des tickets est obligatoire.');
      return;
    }

    setSaving(true);
    try {
      // On envoie uniquement les champs non vides
      // logoText est synchronisé avec companyName
      const payload = {
        companyName:   form.companyName.trim(),
        companySlogan: form.companySlogan.trim(),
        ticketPrefix:  form.ticketPrefix.trim().toUpperCase(),
        logoText:      form.companyName.trim(),
      };

      const { data } = await api.put('/admin/settings', payload);

      // Mettre à jour le form avec la réponse DB (source de vérité)
      setForm({
        companyName:   data.companyName   || DEFAULTS.companyName,
        companySlogan: data.companySlogan || DEFAULTS.companySlogan,
        ticketPrefix:  data.ticketPrefix  || DEFAULTS.ticketPrefix,
        logoText:      data.logoText      || DEFAULTS.logoText,
      });

      await refresh();
      setMsg('Paramètres enregistrés avec succès ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(e.response?.data?.message || 'Erreur lors de la sauvegarde.');
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
        <h2 className="text-lg font-bold text-gray-900">Général</h2>
        <p className="text-sm text-gray-500 mt-0.5">Informations générales du système</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Building className="w-4 h-4" /> Informations du système
          </h3>
          <div className="space-y-4">

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nom du système <span className="text-red-500">*</span>
              </label>
              <input
                value={form.companyName}
                onChange={e => setForm({ ...form, companyName: e.target.value })}
                placeholder="Help Desk IT"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm outline-none transition bg-gray-50"
                onFocus={focusRed} onBlur={blurReset}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slogan
              </label>
              <input
                value={form.companySlogan}
                onChange={e => setForm({ ...form, companySlogan: e.target.value })}
                placeholder="Système de support"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm outline-none transition bg-gray-50"
                onFocus={focusRed} onBlur={blurReset}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Préfixe des tickets <span className="text-red-500">*</span>
              </label>
              <input
                value={form.ticketPrefix}
                onChange={e => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setForm({ ...form, ticketPrefix: val });
                }}
                maxLength={6}
                placeholder="TKT"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm outline-none transition bg-gray-50 uppercase
                           font-mono tracking-widest"
                onFocus={focusRed} onBlur={blurReset}
              />
              <p className="text-xs text-gray-400 mt-1">
                Aperçu : <span className="font-mono font-semibold text-gray-600">
                  #{form.ticketPrefix || 'TKT'}-001
                </span>
                {' '}· Lettres et chiffres uniquement, max 6 caractères
              </p>
            </div>

          </div>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {err}
          </div>
        )}
        {msg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-white font-semibold
                     rounded-xl text-sm transition"
          style={{ backgroundColor: saving ? '#f09092' : RED }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = RED_DARK; }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = RED; }}
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
            : <><Save className="w-4 h-4" /> Enregistrer</>}
        </button>

      </form>
    </div>
  );
}
