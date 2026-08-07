import { useState, useEffect } from 'react';
import { Save, Bell, AlertTriangle, Loader2 } from 'lucide-react';
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

export default function AdminNotificationsTab() {
  const [form, setForm] = useState({
    notifNewTicket:      true,
    notifTicketAssigned: true,
    notifNewComment:     true,
    notifTicketResolved: true,
    notifSlaBreached:    true,
    notifSlaBefore30:    true,
    notifUnassigned1h:   true,
    notifDailyReport:    false,
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setForm({
        notifNewTicket:      b(data.notifNewTicket),
        notifTicketAssigned: b(data.notifTicketAssigned),
        notifNewComment:     b(data.notifNewComment),
        notifTicketResolved: b(data.notifTicketResolved),
        notifSlaBreached:    b(data.notifSlaBreached),
        notifSlaBefore30:    b(data.notifSlaBefore30),
        notifUnassigned1h:   b(data.notifUnassigned1h),
        notifDailyReport:    b(data.notifDailyReport),
      }))
      .catch(() => setErr('Impossible de charger les paramètres.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      // On envoie les booléens en string pour le backend clé-valeur
      await api.put('/admin/settings', {
        notifNewTicket:      String(form.notifNewTicket),
        notifTicketAssigned: String(form.notifTicketAssigned),
        notifNewComment:     String(form.notifNewComment),
        notifTicketResolved: String(form.notifTicketResolved),
        notifSlaBreached:    String(form.notifSlaBreached),
        notifSlaBefore30:    String(form.notifSlaBefore30),
        notifUnassigned1h:   String(form.notifUnassigned1h),
        notifDailyReport:    String(form.notifDailyReport),
      });
      setMsg('Notifications enregistrées ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setErr('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin"
           style={{ borderColor: RED, borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-500 mt-0.5">Gérez les alertes et notifications email</p>
      </div>

      <div className="space-y-4 max-w-2xl">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications email
          </h3>
          <Toggle checked={form.notifNewTicket}
            onChange={v => set('notifNewTicket', v)}
            label="Nouveau ticket créé"
            description="Notifie le client à la création" />
          <Toggle checked={form.notifTicketAssigned}
            onChange={v => set('notifTicketAssigned', v)}
            label="Ticket assigné"
            description="Notifie le technicien lors d'une assignation" />
          <Toggle checked={form.notifNewComment}
            onChange={v => set('notifNewComment', v)}
            label="Nouveau commentaire"
            description="Notifie les parties concernées" />
          <Toggle checked={form.notifTicketResolved}
            onChange={v => set('notifTicketResolved', v)}
            label="Ticket résolu"
            description="Notifie le client" />
          <Toggle checked={form.notifSlaBreached}
            onChange={v => set('notifSlaBreached', v)}
            label="Dépassement SLA"
            description="Alerte admin + technicien si SLA dépassé" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Alertes système
          </h3>
          <Toggle checked={form.notifSlaBefore30}
            onChange={v => set('notifSlaBefore30', v)}
            label="Alerte SLA (30 min avant échéance)"
            description="Prévient avant le dépassement" />
          <Toggle checked={form.notifUnassigned1h}
            onChange={v => set('notifUnassigned1h', v)}
            label="Tickets non assignés après 1h"
            description="Alerte l'admin si aucun tech n'a pris en charge" />
          <Toggle checked={form.notifDailyReport}
            onChange={v => set('notifDailyReport', v)}
            label="Rapport quotidien d'activité"
            description="Envoyé chaque matin à l'admin" />
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
