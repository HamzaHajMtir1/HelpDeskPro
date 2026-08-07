import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, ToggleLeft, ToggleRight, RefreshCw, Tag } from 'lucide-react';
import api from '../../../api/axios';

const RED      = '#E31E24';
const RED_DARK = '#b81519';

const PRESET_COLORS = [
  '#E31E24','#3b82f6','#f59e0b','#8b5cf6',
  '#22c55e','#ef4444','#f97316','#06b6d4',
  '#1a1a1a','#6b7280',
];

export default function AdminCategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState({ name: '', description: '', color: '#3b82f6' });
  const [err,        setErr]        = useState('');
  const [msg,        setMsg]        = useState('');

  // Modal de confirmation suppression
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, name: '' });

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/categories'); setCategories(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', color: '#3b82f6' });
    setErr(''); setMsg('');
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#3b82f6' });
    setErr(''); setMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!form.name.trim()) { setErr('Le nom est obligatoire.'); return; }
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, form);
        setMsg('Catégorie mise à jour ✅');
      } else {
        await api.post('/admin/categories', form);
        setMsg('Catégorie créée ✅');
      }
      load();
      setTimeout(() => { setShowModal(false); setMsg(''); }, 1200);
    } catch (e) {
      setErr(e.response?.data?.message || e.response?.data || 'Erreur serveur');
    }
  };

  const handleToggle = async (id) => {
    try { await api.patch(`/admin/categories/${id}/toggle`); load(); }
    catch (e) { console.error(e); }
  };

  const askDelete = (id, name) => {
    setConfirmModal({ open: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/categories/${confirmModal.id}`);
      load();
    } catch (e) {
      window.alert(e.response?.data?.message || 'Suppression impossible');
    } finally {
      setConfirmModal({ open: false, id: null, name: '' });
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Catégories</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {categories.length} catégorie(s) configurée(s)
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
            <PlusCircle className="w-4 h-4" /> Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
               style={{ borderColor: RED, borderTopColor: 'transparent' }} />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Aucune catégorie</p>
          <p className="text-sm mt-1">Créez votre première catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm
                         p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center
                              text-white flex-shrink-0"
                   style={{ backgroundColor: cat.color || '#6b7280' }}>
                <Tag className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {cat.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {cat.description || '—'}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(cat)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100
                             rounded-lg transition" title="Modifier">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleToggle(cat.id)}
                  className="p-2 rounded-lg transition"
                  style={{ color: cat.active ? '#22c55e' : '#9ca3af' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  title={cat.active ? 'Désactiver' : 'Activer'}>
                  {cat.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => askDelete(cat.id, cat.name)}
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
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
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
                  placeholder="Ex: Réseau, Matériel..."
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                             text-sm bg-gray-50 outline-none transition"
                  onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = '0 0 0 2px rgba(227,30,36,0.1)'; }}
                  onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Problèmes liés au réseau..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                             text-sm bg-gray-50 outline-none transition"
                  onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = '0 0 0 2px rgba(227,30,36,0.1)'; }}
                  onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Couleur</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-7 h-7 rounded-lg border-2 transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor: form.color === c ? '#1a1a1a' : 'transparent',
                        transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                      }} />
                  ))}
                  <input type="color"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    title="Couleur personnalisée" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: form.color }} />
                  <span className="text-xs text-gray-400">
                    Aperçu : <strong>{form.name || 'Catégorie'}</strong>
                  </span>
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
                             text-sm transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: RED }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = RED_DARK}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = RED}>
                  <PlusCircle className="w-4 h-4" />
                  {editing ? 'Enregistrer' : 'Créer'}
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
              Supprimer cette catégorie ?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              La catégorie{' '}
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
