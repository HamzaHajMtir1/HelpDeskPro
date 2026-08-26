// pages/admin/AccountRequestsPage.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { generatePassword } from '../../utils/secureRandom';
import axios from "axios";
import {
  UserPlus, Check, X, Clock, Building,
  Mail, Phone, MessageSquare, Users, AlertCircle,
  Wrench, ChevronDown, ChevronUp
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import { useToast } from "../../components/Toast";

const API = "/api";

/* ─── CustomSelect (identique à AdminUsers) ─── */
const CustomSelect = ({ value, onChange, options, placeholder, dropUp = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const RED = '#E31E24';

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '10px 36px 10px 12px',
          border: open ? `1.5px solid ${RED}` : '1.5px solid #e5e7eb',
          borderRadius: '12px',
          fontSize: '14px',
          backgroundColor: open ? '#fff' : '#fafafa',
          outline: 'none',
          cursor: 'pointer',
          color: selected ? '#374151' : '#9ca3af',
          textAlign: 'left',
          boxShadow: open ? `0 0 0 3px rgba(227,30,36,0.1)` : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : (placeholder || 'Sélectionner…')}
        </span>
        {open
          ? <ChevronUp  style={{ width: 16, height: 16, color: RED, flexShrink: 0 }} />
          : <ChevronDown style={{ width: 16, height: 16, color: RED, flexShrink: 0 }} />}
      </button>

      {open && (
        <ul style={{
          position: 'absolute', left: 0, right: 0,
          ...(dropUp
            ? { bottom: 'calc(100% + 4px)', top: 'auto' }
            : { top:    'calc(100% + 4px)', bottom: 'auto' }),
          backgroundColor: '#fff',
          border: `1.5px solid ${RED}`,
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 9999, maxHeight: '220px', overflowY: 'auto',
          margin: 0, padding: '4px 0', listStyle: 'none',
        }}>
          {options.map(opt => {
            const isActive = String(opt.value) === String(value);
            return (
              <li
                key={opt.value}
                onMouseDown={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: '9px 14px', fontSize: '14px', cursor: 'pointer',
                  backgroundColor: isActive ? '#fff1f1' : 'transparent',
                  color: isActive ? RED : '#374151',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#fafafa'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const ROLE_OPTIONS = [
  { value: 'CLIENT',     label: 'Client' },
  { value: 'TECHNICIEN', label: 'Technicien' },
];

export default function AccountRequestsPage() {
  const { showToast, ToastContainer } = useToast();
  const RED = '#E31E24';

  const [requests,      setRequests]      = useState([]);
  const [categories,    setCategories]    = useState([]);   // ✅ spécialités
  const [selected,      setSelected]      = useState(null);
  const [form,          setForm]          = useState({
    username: '', role: 'CLIENT', tempPassword: '',
    company: '', phone: '', specialtyCategoryId: '',       // ✅
  });
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("PENDING");
  const [emailError,    setEmailError]    = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [rejectReason,  setRejectReason]  = useState('');
  const [rejectModal,   setRejectModal]   = useState({
    open: false, id: null, name: '', email: ''
  });

  useEffect(() => {
    fetchRequests();
    fetchCategories(); // ✅
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/account-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch {
      showToast('error', 'Erreur de chargement', 'Impossible de récupérer les demandes.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Charger les catégories actives (même endpoint qu'AdminUsers)
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/categories/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch {
      // silencieux — le champ sera vide si erreur
    }
  };

  const specialtyOptions = [
    { value: '', label: '-- Choisir une spécialité --' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ];

  const openModal = (req) => {
    setSelected(req);
    setEmailError('');
    setForm({
      username:            req.email,
      role:                'CLIENT',
      tempPassword:        generateTempPassword(),
      company:             req.company || '',
      phone:               req.phone   || '',
      specialtyCategoryId: '',                             // ✅ reset
    });
  };

  const generateTempPassword = () => generatePassword();

  const checkEmailAvailable = useCallback(async (email) => {
    if (!email || !email.includes('@')) return;
    setCheckingEmail(true);
    setEmailError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API}/account-requests/check-email?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data.available) setEmailError(res.data.message);
    } catch { /* silencieux */ }
    finally { setCheckingEmail(false); }
  }, []);

  const handleCreate = async () => {
    if (!selected) return;
    if (emailError) { showToast('error', 'Email invalide', emailError); return; }

    // ✅ Validation spécialité obligatoire pour TECHNICIEN
    if (form.role === 'TECHNICIEN' && !form.specialtyCategoryId) {
      showToast('error', 'Spécialité requise',
        'Veuillez sélectionner une spécialité pour ce technicien.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        specialtyCategoryId: form.role === 'TECHNICIEN' && form.specialtyCategoryId
          ? Number(form.specialtyCategoryId)
          : null,
      };
      await axios.post(
        `${API}/account-requests/${selected.id}/approve`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelected(null);
      fetchRequests();
      showToast('success', 'Compte créé !', `Email envoyé à ${selected.fullName}.`);
    } catch (err) {
      const data    = err.response?.data || {};
      const errCode = data.error || '';
      if (errCode === 'EMAIL_EXISTS') {
        setEmailError(data.message || `L'adresse ${form.username} est déjà utilisée.`);
        showToast('error', 'Email déjà utilisé', data.message);
      } else {
        showToast('error', 'Erreur', data.message || 'Impossible de créer le compte.');
      }
    }
  };

  const askReject = (req) => {
    setRejectReason('');
    setRejectModal({ open: true, id: req.id, name: req.fullName, email: req.email });
  };

  const handleReject = async () => {
    const { id, name, email } = rejectModal;
    setRejectModal({ open: false, id: null, name: '', email: '' });
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/account-requests/${id}/reject`,
        { reason: rejectReason || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
      showToast('info', 'Demande rejetée',
        `La demande de ${name} a été rejetée. Un email a été envoyé à ${email}.`);
    } catch {
      showToast('error', 'Erreur', 'Impossible de rejeter la demande.');
    }
  };

  const pending  = requests.filter(r => r.status === "PENDING");
  const approved = requests.filter(r => r.status === "APPROVED");
  const rejected = requests.filter(r => r.status === "REJECTED");
  const displayed = activeTab === "PENDING"  ? pending
                  : activeTab === "APPROVED" ? approved : rejected;

  const statusColor = (status) => {
    if (status === "PENDING")  return { bg: '#fff7ed', color: '#ea580c', label: 'En attente' };
    if (status === "APPROVED") return { bg: '#f0fdf4', color: '#16a34a', label: 'Approuvée'  };
    return                            { bg: '#fef2f2', color: '#dc2626', label: 'Rejetée'    };
  };

  return (
    <AdminLayout>
      <ToastContainer />
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Demandes de création de comptes</h1>
            <p className="text-sm text-gray-500 mt-1">Gérez les demandes d'accès à la plateforme</p>
          </div>
          <button onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: RED }}>
            <Users className="w-4 h-4" /> Actualiser
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'En attente', count: pending.length,  color: '#ea580c', bg: '#fff7ed', icon: Clock },
            { label: 'Approuvées', count: approved.length, color: '#16a34a', bg: '#f0fdf4', icon: Check },
            { label: 'Rejetées',   count: rejected.length, color: '#dc2626', bg: '#fef2f2', icon: X     },
          ].map(({ label, count, color, bg, icon: Icon }) => (
            <div key={label}
                 className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                   style={{ backgroundColor: bg }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit">
          {[
            { key: 'PENDING',  label: 'En attente', count: pending.length  },
            { key: 'APPROVED', label: 'Approuvées', count: approved.length },
            { key: 'REJECTED', label: 'Rejetées',   count: rejected.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                backgroundColor: activeTab === tab.key ? RED : 'transparent',
                color:           activeTab === tab.key ? '#fff' : '#6b7280',
              }}>
              {tab.label}
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                  color:           activeTab === tab.key ? '#fff' : '#374151',
                }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Liste ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 rounded-full animate-spin"
                 style={{ borderColor: '#f3f4f6', borderTopColor: RED }} />
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ backgroundColor: '#fef2f2' }}>
              <UserPlus className="w-8 h-8" style={{ color: RED }} />
            </div>
            <p className="text-gray-500 font-medium">Aucune demande {
              activeTab === 'PENDING' ? 'en attente' :
              activeTab === 'APPROVED' ? 'approuvée' : 'rejetée'
            }</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(req => {
              const s = statusColor(req.status);
              return (
                <div key={req.id}
                     className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6
                                flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center
                                    text-white font-bold text-lg flex-shrink-0"
                         style={{ backgroundColor: RED }}>
                      {req.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-900">{req.fullName}</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" /> {req.email}
                        </span>
                        {req.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" /> {req.phone}
                          </span>
                        )}
                        {req.company && (
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" /> {req.company}
                          </span>
                        )}
                      </div>
                      {req.message && (
                        <p className="text-sm text-gray-400 mt-2 flex items-start gap-1 italic">
                          <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          "{req.message}"
                        </p>
                      )}
                      <p className="text-xs text-gray-300 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Reçu le {new Date(req.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {req.status === "PENDING" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openModal(req)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                                   font-medium text-white transition-all"
                        style={{ backgroundColor: RED }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = RED}>
                        <UserPlus className="w-4 h-4" /> Créer le compte
                      </button>
                      <button onClick={() => askReject(req)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                                   font-medium border border-gray-200 text-gray-600
                                   hover:bg-gray-50 transition-all">
                        <X className="w-4 h-4" /> Rejeter
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* MODAL — Création compte                     */}
      {/* ════════════════════════════════════════════ */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: '480px' }}>
            <div className="bg-white rounded-2xl w-full shadow-2xl">

              {/* Header */}
              <div className="px-8 py-6 flex items-center justify-between"
                   style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center
                                  text-white font-bold" style={{ backgroundColor: RED }}>
                    {selected.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Créer le compte</h2>
                    <p className="text-sm text-gray-500">{selected.fullName}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600
                                   hover:bg-gray-100 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-8 py-6 space-y-4">

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Email de connexion
                  </label>
                  <input
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none
                                transition ${emailError
                                  ? 'border-red-400 bg-red-50'
                                  : 'border-gray-200 focus:border-red-400'}`}
                    value={form.username}
                    onChange={e => { setForm({ ...form, username: e.target.value }); setEmailError(''); }}
                    onBlur={e => checkEmailAvailable(e.target.value)}
                  />
                  {checkingEmail && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-500
                                       rounded-full animate-spin inline-block" />
                      Vérification...
                    </p>
                  )}
                  {emailError && !checkingEmail && (
                    <p className="text-xs text-red-600 mt-1 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Entreprise */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    <span className="inline-flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" style={{ color: RED }} />
                      Entreprise
                    </span>
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                               focus:outline-none focus:border-red-400 transition"
                    placeholder="Leoni, Siemens..."
                    value={form.company}
                    onChange={e => setForm({ ...form, company: e.target.value })}
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" style={{ color: RED }} />
                      Téléphone
                    </span>
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                               focus:outline-none focus:border-red-400 transition"
                    placeholder="+216 XX XXX XXX"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {/* Rôle */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Rôle</label>
                  <CustomSelect
                    value={form.role}
                    onChange={val => setForm({
                      ...form,
                      role: val,
                      specialtyCategoryId: '',  // ✅ reset quand on change de rôle
                    })}
                    options={ROLE_OPTIONS}
                  />
                </div>

                {/* ✅ Spécialité — visible uniquement si TECHNICIEN */}
                {form.role === 'TECHNICIEN' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      <span className="inline-flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" style={{ color: RED }} />
                        Spécialité <span style={{ color: RED }}>*</span>
                      </span>
                    </label>
                    <CustomSelect
                      value={form.specialtyCategoryId}
                      onChange={val => setForm({ ...form, specialtyCategoryId: val })}
                      options={specialtyOptions}
                      placeholder="-- Choisir une spécialité --"
                      dropUp
                    />
                    {!form.specialtyCategoryId && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Obligatoire pour un technicien
                      </p>
                    )}
                  </div>
                )}

                {/* Mot de passe temporaire */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Mot de passe temporaire
                  </label>
                  <div className="relative">
                    <input
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                 font-mono focus:outline-none focus:border-red-400"
                      value={form.tempPassword}
                      onChange={e => setForm({ ...form, tempPassword: e.target.value })}
                    />
                    <button
                      onClick={() => setForm({ ...form, tempPassword: generateTempPassword() })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
                      style={{ backgroundColor: '#fef2f2', color: RED }}>
                      Régénérer
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 flex gap-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                <button
                  onClick={handleCreate}
                  disabled={
                    !!emailError ||
                    checkingEmail ||
                    (form.role === 'TECHNICIEN' && !form.specialtyCategoryId) // ✅
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                             font-medium text-white transition-all disabled:opacity-50
                             disabled:cursor-not-allowed"
                  style={{ backgroundColor: RED }}
                  onMouseEnter={e => { if (!emailError) e.currentTarget.style.backgroundColor = '#b91c1c'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = RED; }}>
                  <Check className="w-4 h-4" />
                  Créer &amp; Envoyer email
                </button>
                <button onClick={() => setSelected(null)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600
                             hover:bg-gray-50 transition-all">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL — Rejet                               */}
      {/* ════════════════════════════════════════════ */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ backgroundColor: '#fff1f1' }}>
              <X className="w-7 h-7" style={{ color: RED }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Rejeter cette demande ?</h3>
            <p className="text-sm text-gray-500 mb-4">
              La demande de <span className="font-semibold text-gray-700">{rejectModal.name}</span>{' '}
              sera rejetée et un email sera envoyé à{' '}
              <span className="font-semibold">{rejectModal.email}</span>.
            </p>
            <div className="text-left mb-5">
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Motif du rejet <span className="text-gray-400">(optionnel)</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ex : Informations incomplètes, demande hors périmètre..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                           focus:outline-none focus:border-red-300 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal({ open: false, id: null, name: '', email: '' })}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm
                           text-gray-600 hover:bg-gray-50 transition font-medium">
                Annuler
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 text-white font-semibold rounded-xl text-sm
                           transition flex items-center justify-center gap-2"
                style={{ backgroundColor: RED }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = RED}>
                <X className="w-4 h-4" /> Rejeter &amp; Notifier
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
