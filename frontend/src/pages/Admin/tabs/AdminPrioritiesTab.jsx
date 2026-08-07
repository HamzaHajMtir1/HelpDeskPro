import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../../api/axios';

const RED      = '#E31E24';
const RED_DARK = '#b81519';

const EMOJI_MAP = { 'Critique': '🔴', 'Haute': '🟠', 'Moyenne': '🟡', 'Basse': '🟢' };

export default function AdminPrioritiesTab() {
  const [priorities, setPriorities] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [form,       setForm]       = useState({ name: '', color: '#ef4444', slaHours: 24 });
  const [msg,        setMsg]        = useState('');
  const [err,        setErr]        = useState('');

  // Modal de confirmation suppression
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, name: '' });

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/priorities'); setPriorities(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', color: '#ef4444', slaHours: 24 });
    setMsg(''); setErr('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({ name: p.name, color: p.color || '#ef4444', slaHours: p.slaHours || 24 });
    setMsg(''); setErr('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!form.name.trim()) { setErr('Le nom est obligatoire.'); return; }
    if (form.slaHours < 1) { setErr('Le SLA doit être ≥ 1 heure.'); return; }
    try {
      if (editItem) {
        await api.put(`/admin/priorities/${editItem.id}`, form);
        setMsg('Priorité modifiée ✅');
      } else {
        await api.post('/admin/priorities', form);
        setMsg('Priorité créée ✅');
      }
      load();
      setTimeout(() => { setShowModal(false); setMsg(''); }, 1200);
    } catch (e) {
      setErr(e.response?.data?.message || e.response?.data || 'Erreur serveur');
    }
  };

  const askDelete = (id, name) => {
    setConfirmModal({ open: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/priorities/${confirmModal.id}`);
      load();
    } catch (e) {
      window.alert(e.response?.data?.message || 'Suppression impossible');
    } finally {
      setConfirmModal({ open: false, id: null, name: '' });
    }
  };

  const focusRed  = e => { e.target.style.borderColor = RED; e.target.style.boxShadow = '0 0 0 2px rgba(227,30,36,0.1)'; };
  const blurReset = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Priorités des tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {priorities.length} priorité(s) configurée(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400
                       hover:bg-gray-50 transition" title="Rafraîchir">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm
                       font-semibold rounded-xl transition"
            style={{ backgroundColor: RED }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = RED_DARK}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = RED}>
            <PlusCircle className="w-4 h-4" /> Ajouter une priorité
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
               style={{ borderColor: RED, borderTopColor: 'transparent' }} />
        </div>
      ) : priorities.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Aucune priorité</p>
          <p className="text-sm mt-1">Ajoutez votre première priorité</p>
        </div>
      ) : (
        <div className="space-y-3">
          {priorities.map(p => (
            <div key={p.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm
                         p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center
                              flex-shrink-0 text-xl"
                   style={{ backgroundColor: (p.color || '#ef4444') + '20' }}>
                {EMOJI_MAP[p.name] || '⚪'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium
                                   bg-green-100 text-green-700">Actif</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: (p.color || '#ef4444') + '20',
                          color: p.color || '#ef4444'
                        }}>
                    SLA : {p.slaHours}h
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(p)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100
                             rounded-lg transition" title="Modifier">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => askDelete(p.id, p.name)}
                  className="p-2 rounded-lg transition"
                  style={{ color: RED }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff1f1'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulaire création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editItem ? 'Modifier la priorité' : 'Nouvelle priorité'}
              </h3>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100
                           rounded-lg transition">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Critique, Haute, Basse..."
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                             text-sm bg-gray-50 outline-none transition"
                  onFocus={focusRed} onBlur={blurReset}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  SLA (heures) *
                </label>
                <input
                  type="number" min="1" max="9999"
                  value={form.slaHours}
                  onChange={e => setForm({ ...form, slaHours: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                             text-sm bg-gray-50 outline-none transition"
                  onFocus={focusRed} onBlur={blurReset}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Délai maximum de résolution pour cette priorité
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Couleur</label>
                <div className="flex items-center gap-3">
                  <input type="color"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    title="Choisir une couleur" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg"
                         style={{ backgroundColor: form.color + '30', border: `2px solid ${form.color}` }} />
                    <span className="text-sm text-gray-600 font-mono">{form.color}</span>
                  </div>
                </div>
              </div>

              {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{err}</p>}
              {msg && <p className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-xl">{msg}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm
                             text-gray-600 hover:bg-gray-50 transition">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 text-white font-semibold py-2.5 rounded-xl
                             text-sm transition"
                  style={{ backgroundColor: RED }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = RED_DARK}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = RED}>
                  {editItem ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            {/* Icône */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ backgroundColor: '#fff1f1' }}>
              <Trash2 className="w-7 h-7" style={{ color: RED }} />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Supprimer cette priorité ?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              La priorité{' '}
              <span className="font-semibold text-gray-700">« {confirmModal.name} »</span>{' '}
              sera définitivement supprimée.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ open: false, id: null, name: '' })}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm
                           text-gray-600 hover:bg-gray-50 transition font-medium">
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 text-white font-semibold rounded-xl text-sm
                           transition flex items-center justify-center gap-2"
                style={{ backgroundColor: RED }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = RED_DARK}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = RED}>
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
