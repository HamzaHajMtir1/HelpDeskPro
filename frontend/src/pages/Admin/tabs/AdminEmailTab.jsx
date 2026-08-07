import { useState, useEffect } from 'react';
import { Save, Mail, Send, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';
import api from '../../../api/axios';

const RED      = '#E31E24';
const RED_DARK = '#b81519';

export default function AdminEmailTab() {
  const [form, setForm] = useState({
    smtpHost:     '',
    smtpPort:     '587',
    smtpUser:     '',
    smtpPassword: '',
    fromName:     'Help Desk IT',
    fromEmail:    '',
  });

  const [showPwd,    setShowPwd]    = useState(false);
  const [pwdSet,     setPwdSet]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');

  const focusRed  = e => { e.target.style.borderColor = RED; e.target.style.boxShadow = '0 0 0 2px rgba(227,30,36,0.1)'; };
  const blurReset = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };

  const flash = (type, msg) => {
    if (type === 'ok')  { setSuccessMsg(msg); setErrorMsg('');   setTimeout(() => setSuccessMsg(''), 5000); }
    if (type === 'err') { setErrorMsg(msg);   setSuccessMsg(''); setTimeout(() => setErrorMsg(''),   6000); }
  };

  // Chargement initial
  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => {
        setForm(f => ({
          ...f,
          smtpHost:     data.smtpHost  || 'smtp.gmail.com',
          smtpPort:     data.smtpPort  || '587',
          smtpUser:     data.smtpUser  || '',
          fromName:     data.fromName  || 'Help Desk IT',
          fromEmail:    data.fromEmail || '',
          smtpPassword: '',
        }));
        setPwdSet(!!data.smtpPasswordSet);
      })
      .catch(() => flash('err', 'Impossible de charger les parametres.'))
      .finally(() => setLoading(false));
  }, []);

  // Sauvegarde
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(''); setErrorMsg('');

    const payload = {
      smtpHost:  form.smtpHost.trim(),
      smtpPort:  form.smtpPort.trim(),
      smtpUser:  form.smtpUser.trim(),
      fromName:  form.fromName.trim(),
      fromEmail: form.fromEmail.trim(),
    };
    // smtpPassword envoye UNIQUEMENT si renseigne
    if (form.smtpPassword.trim() !== '') {
      payload.smtpPassword = form.smtpPassword.trim();
    }

    try {
      const { data } = await api.put('/admin/settings', payload);
      if (typeof data.smtpPasswordSet === 'boolean') {
        setPwdSet(data.smtpPasswordSet);
      } else if (form.smtpPassword.trim() !== '') {
        setPwdSet(true);
      }
      setForm(f => ({ ...f, smtpPassword: '' }));
      flash('ok', 'Configuration SMTP enregistree avec succes');
    } catch (err) {
      flash('err', err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // Test SMTP
  const handleTest = async () => {
    const target = form.smtpUser.trim();
    if (!target) {
      flash('err', "Renseignez le champ Utilisateur pour recevoir l'email de test.");
      return;
    }
    if (!pwdSet && form.smtpPassword.trim() === '') {
      flash('err', "Enregistrez d'abord un mot de passe SMTP avant de tester.");
      return;
    }
    setTesting(true);
    setSuccessMsg(''); setErrorMsg('');
    try {
      await api.post('/admin/settings/email/test', { toEmail: target });
      flash('ok', `Email de test envoye a ${target} - verifiez votre boite.`);
    } catch (err) {
      flash('err', err.response?.data?.message || 'Echec SMTP. Verifiez host / port / utilisateur / mot de passe.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-4 rounded-full animate-spin"
           style={{ borderColor: `${RED} ${RED} ${RED} transparent` }} />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Configuration Email</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Parametres SMTP utilises pour l'envoi de tous les emails automatiques
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 max-w-2xl">

        {/* Serveur SMTP */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" style={{ color: RED }} />
            Serveur SMTP
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Hote SMTP</label>
                <input
                  value={form.smtpHost}
                  placeholder="smtp.gmail.com"
                  onChange={e => setForm({ ...form, smtpHost: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition bg-gray-50"
                  onFocus={focusRed} onBlur={blurReset}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
                <input
                  value={form.smtpPort}
                  placeholder="587"
                  onChange={e => setForm({ ...form, smtpPort: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition bg-gray-50"
                  onFocus={focusRed} onBlur={blurReset}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Utilisateur SMTP (adresse d'envoi)
              </label>
              <input
                type="email"
                value={form.smtpUser}
                placeholder="votre@gmail.com"
                onChange={e => setForm({ ...form, smtpUser: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition bg-gray-50"
                onFocus={focusRed} onBlur={blurReset}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mot de passe SMTP
                {pwdSet
                  ? <span className="ml-2 text-green-600 font-normal text-xs">Enregistre</span>
                  : <span className="ml-2 text-orange-500 font-normal text-xs">Non configure</span>
                }
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.smtpPassword}
                  placeholder={pwdSet
                    ? 'Laisser vide pour conserver le mot de passe actuel'
                    : 'Saisir le mot de passe SMTP'}
                  onChange={e => setForm({ ...form, smtpPassword: e.target.value })}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm outline-none transition bg-gray-50"
                  onFocus={focusRed} onBlur={blurReset}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPwd ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-start gap-1.5 mt-1.5">
                <Info className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Pour Gmail : utilisez un mot de passe d'application (16 caracteres) depuis myaccount.google.com/apppasswords
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expediteur */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Expediteur affiche</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom d'affichage</label>
              <input
                value={form.fromName}
                placeholder="Help Desk IT"
                onChange={e => setForm({ ...form, fromName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition bg-gray-50"
                onFocus={focusRed} onBlur={blurReset}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email expediteur</label>
              <input
                type="email"
                value={form.fromEmail}
                placeholder="helpdesk@company.com"
                onChange={e => setForm({ ...form, fromEmail: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition bg-gray-50"
                onFocus={focusRed} onBlur={blurReset}
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || saving}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </button>

          <button
            type="submit"
            disabled={saving || testing}
            className="flex items-center gap-2 px-6 py-2.5 text-white font-semibold rounded-xl text-sm disabled:opacity-40 transition"
            style={{ backgroundColor: saving ? '#f09092' : RED }}
            onMouseEnter={e => { if (!saving && !testing) e.currentTarget.style.backgroundColor = RED_DARK; }}
            onMouseLeave={e => { if (!saving && !testing) e.currentTarget.style.backgroundColor = RED; }}
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              : <><Save className="w-4 h-4" /> Enregistrer</>}
          </button>
        </div>
      </form>
    </div>
  );
}
