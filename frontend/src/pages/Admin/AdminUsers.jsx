import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  PlusCircle, Search, RefreshCw, RotateCcw, Shield, Wrench, User,
  CheckCircle, XCircle, Users, Pencil, Building2, Phone,
  ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';
import { getAvatarByEmail } from '../../hooks/useAvatar';

const RED      = '#E31E24';
const RED_DARK = '#b81519';

const TH = {
  padding: '10px 16px',
  fontSize: 12, fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
  textAlign: 'left',
};
const TD = {
  padding: '11px 16px',
  fontSize: 14,
  color: '#374151',
  verticalAlign: 'middle',
};

function useCountUp(target, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null;
    const numeric = parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) { setValue(target); return; }
    const timer = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * numeric));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return value;
}

function AnimatedKpiValue({ value, delay = 0 }) {
  const counted = useCountUp(value ?? 0, 1200, delay);
  if (value === undefined || value === null || value === '—') return <span>—</span>;
  return <span>{counted}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   CustomSelect — la liste est rendue via ReactDOM.createPortal dans document.body
   afin d'échapper à tout stacking context ou overflow:hidden parent.
───────────────────────────────────────────────────────────────────────────── */
function CustomSelect({ value, onChange, options, placeholder, minWidth = 160 }) {
  const [open, setOpen]       = useState(false);
  const [dropStyle, setDropStyle] = useState({});
  const btnRef = useRef(null);
  const listRef = useRef(null);

  /* Recalcule la position du portail */
  const calcPosition = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const listH = Math.min(260, window.innerHeight - r.bottom - 12);
    setDropStyle({
      position: 'fixed',
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, minWidth),
      zIndex: 99999,
      maxHeight: listH,
    });
  };

  /* Fermer si clic en dehors */
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        btnRef.current && btnRef.current.contains(e.target)
      ) return;
      if (
        listRef.current && listRef.current.contains(e.target)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  /* Repositionner au scroll / resize */
  useEffect(() => {
    if (!open) return;
    const update = () => calcPosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) calcPosition();
    setOpen(o => !o);
  };

  const selected = options.find(o => String(o.value) === String(value));
  const hasVal   = selected && String(selected.value) !== '' && String(selected.value) !== 'TOUS';

  const dropdown = open && ReactDOM.createPortal(
    <ul
      ref={listRef}
      style={{
        ...dropStyle,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,.12)',
        overflowY: 'auto',
        margin: 0,
        padding: '4px',
        listStyle: 'none',
        scrollbarWidth: 'thin',
      }}
    >
      {options.map(opt => {
        const isActive = String(opt.value) === String(value);
        return (
          <li
            key={opt.value}
            onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
            style={{
              padding: '7px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              backgroundColor: isActive ? '#fff1f1' : 'transparent',
              color: isActive ? RED : '#374151',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {opt.label}
          </li>
        );
      })}
    </ul>,
    document.body
  );

  return (
    <div style={{ position: 'relative', userSelect: 'none', minWidth }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 10px',
          background: '#fff',
          border: open ? `1.5px solid ${RED}` : '1.5px solid #e5e7eb',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: hasVal ? 600 : 400,
          color: hasVal ? RED : '#6b7280',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: open ? `0 0 0 3px rgba(227,30,36,.08)` : 'none',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {hasVal && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: RED, flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected ? selected.label : (placeholder || 'Sélectionner…')}
        </span>
        {open
          ? <ChevronUp  style={{ width: 12, height: 12, color: RED,      flexShrink: 0 }} />
          : <ChevronDown style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />}
      </button>
      {dropdown}
    </div>
  );
}

function RedInput({ value, onChange, placeholder, type = 'text', required }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
      style={{
        width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb',
        borderRadius: 10, fontSize: 13, background: '#fafafa', outline: 'none',
        transition: 'all 0.15s', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827',
      }}
      onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = `0 0 0 3px rgba(227,30,36,.08)`; e.target.style.background = '#fff'; }}
      onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
    />
  );
}

function FieldLabel({ text, required: req }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, letterSpacing: '0.02em' }}>
      {text}{req && <span style={{ color: RED }}> *</span>}
    </label>
  );
}

function PhoneInput({ value, onChange }) {
  const local = value?.startsWith('+216') ? value.slice(4) : value ?? '';
  const handleChange = (e) => {
    const digits = e.target.value.replace(/[^\d\s]/g, '');
    onChange(digits ? '+216' + digits : '');
  };
  return (
    <div
      style={{ display: 'flex', border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fafafa', transition: 'all 0.15s' }}
      onFocusCapture={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(227,30,36,.08)'; e.currentTarget.style.background = '#fff'; }}
      onBlurCapture={e  => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#fafafa'; }}
    >
      <div style={{ padding: '8px 10px', background: '#f3f4f6', borderRight: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', userSelect: 'none', flexShrink: 0 }}>
        🇹🇳 +216
      </div>
      <input
        type="tel"
        placeholder="XX XXX XXX"
        value={local}
        onChange={handleChange}
        maxLength={11}
        style={{ flex: 1, padding: '8px 10px', border: 'none', outline: 'none', fontSize: 13, background: 'transparent', fontFamily: 'inherit', color: '#111827', minWidth: 0 }}
      />
    </div>
  );
}

const ROLE_OPTIONS      = [{ value: 'CLIENT', label: 'Client' }, { value: 'TECHNICIEN', label: 'Technicien' }, { value: 'ADMIN', label: 'Administrateur' }];
const ROLE_FILTER_OPTS  = [{ value: 'TOUS', label: 'Tous les rôles' }, { value: 'ADMIN', label: 'Administrateur' }, { value: 'TECHNICIEN', label: 'Technicien' }, { value: 'CLIENT', label: 'Client' }];
const STAT_FILTER_OPTS  = [{ value: 'TOUS', label: 'Tous les statuts' }, { value: 'ACTIF', label: 'Actif' }, { value: 'INACTIF', label: 'Inactif' }];

const ROLE_CONFIG = {
  ADMIN      : { label: 'Administrateur', bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', dot: '#7c3aed', icon: Shield },
  TECHNICIEN : { label: 'Technicien',     bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', dot: '#f97316', icon: Wrench },
  CLIENT     : { label: 'Client',         bg: '#f3f4f6', text: '#374151', border: '#e5e7eb', dot: '#6b7280', icon: User   },
};

function UserAvatar({ user, size = 36 }) {
  const avatarUrl = getAvatarByEmail(user.email);
  const initials  = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;

  if (avatarUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        border: `2px solid ${RED}30`,
        boxShadow: '0 1px 4px rgba(0,0,0,.1)',
      }}>
        <img src={avatarUrl} alt={initials}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: RED,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.33, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function UserFormModal({ title, avatar, onClose, onSubmit, submitting, submitLabel, form, setForm, specialtyOptions, msg, err }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ backgroundColor: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        animation: 'fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {avatar && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                {avatar}
              </div>
            )}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
          </div>
          <button type="button" onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, padding: 4, borderRadius: 6, lineHeight: 1 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} style={{ padding: '14px 20px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><FieldLabel text="Prénom" required /><RedInput placeholder="Sarra" value={form.firstName} required onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
              <div><FieldLabel text="Nom" required /><RedInput placeholder="Elmaher" value={form.lastName} required onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
            </div>
            <div><FieldLabel text="Email" required /><RedInput type="email" placeholder="exemple@email.com" value={form.email} required onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><FieldLabel text="Entreprise" /><RedInput placeholder="Leoni, Siemens…" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
              <div>
                <FieldLabel text="Téléphone" />
                <PhoneInput value={form.phone} onChange={val => setForm(f => ({ ...f, phone: val }))} />
              </div>
            </div>
            <div>
              <FieldLabel text="Rôle" required />
              <CustomSelect value={form.role} onChange={val => setForm(f => ({ ...f, role: val, specialtyCategoryId: '' }))} options={ROLE_OPTIONS} />
            </div>
            {form.role === 'TECHNICIEN' && (
              <div>
                <FieldLabel text="Spécialité" required />
                <CustomSelect value={form.specialtyCategoryId} onChange={val => setForm(f => ({ ...f, specialtyCategoryId: val }))} options={specialtyOptions} placeholder="-- Choisir --" />
              </div>
            )}
            {err && <div style={{ fontSize: 12, color: '#dc2626', background: '#fff1f1', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 8 }}>{err}</div>}
            {msg && <div style={{ fontSize: 12, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: 8 }}>{msg}</div>}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '9px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#6b7280', background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                Annuler
              </button>
              <button type="submit" disabled={submitting}
                style={{ flex: 1, padding: '9px', background: submitting ? '#f87171' : RED, border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = RED_DARK; }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = RED; }}>
                {submitting
                  ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Chargement…</>
                  : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { showToast, ToastContainer } = useToast();
  const [users,      setUsers]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats,      setStats]      = useState({});
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('TOUS');
  const [statFilter, setStatFilter] = useState('TOUS');

  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ firstName: '', lastName: '', email: '', role: 'CLIENT', specialtyCategoryId: '', company: '', phone: '' });
  const [msg,       setMsg]       = useState('');
  const [err,       setErr]       = useState('');
  const [creating,  setCreating]  = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [editForm,      setEditForm]      = useState({ firstName: '', lastName: '', email: '', role: 'CLIENT', specialtyCategoryId: '', company: '', phone: '' });
  const [editMsg, setEditMsg] = useState('');
  const [editErr, setEditErr] = useState('');
  const [updating, setUpdating] = useState(false);

  const [confirmResetUser, setConfirmResetUser] = useState(null);
  const [resetting,        setResetting]        = useState(false);

  const [animKey, setAnimKey] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes, catRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/users/stats'),
        api.get('/admin/categories/active'),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setCategories(catRes.data);
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      setAnimKey(k => k + 1);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const specialtyOptions     = [{ value: '', label: '-- Choisir une spécialité --' }, ...categories.map(c => ({ value: c.id, label: c.name }))];
  const specialtyOptionsEdit = [{ value: '', label: '-- Aucune spécialité --' },      ...categories.map(c => ({ value: c.id, label: c.name }))];

  const filtered = users.filter(u => {
    const matchS = !search || `${u.firstName} ${u.lastName} ${u.email} ${u.company ?? ''} ${u.phone ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchR = roleFilter === 'TOUS' || u.role === roleFilter;
    const matchT = statFilter === 'TOUS' || (statFilter === 'ACTIF' ? u.enabled : !u.enabled);
    return matchS && matchR && matchT;
  });

  const handleEditClick = user => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      role:      user.role,
      specialtyCategoryId: user.specialtyCategory?.id || '',
      company:   user.company || '',
      phone:     user.phone   || '',
    });
    setEditMsg(''); setEditErr('');
    setShowEditModal(true);
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (creating) return;
    setMsg(''); setErr(''); setCreating(true);
    try {
      await api.post('/admin/users', {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        role:      form.role,
        company:   form.company  || null,
        phone:     form.phone    || null,
        specialtyCategoryId: form.role === 'TECHNICIEN' && form.specialtyCategoryId ? Number(form.specialtyCategoryId) : null,
      });
      setMsg(`Compte créé — email envoyé à ${form.email}`);
      setForm({ firstName: '', lastName: '', email: '', role: 'CLIENT', specialtyCategoryId: '', company: '', phone: '' });
      fetchData();
      setTimeout(() => { setShowModal(false); setMsg(''); }, 2000);
    } catch (e) { setErr(typeof e.response?.data === 'string' ? e.response.data : e.response?.data?.message || 'Erreur lors de la création'); }
    finally { setCreating(false); }
  };

  const handleUpdateUser = async e => {
    e.preventDefault();
    if (updating) return;
    setEditMsg(''); setEditErr(''); setUpdating(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}`, {
        firstName: editForm.firstName,
        lastName:  editForm.lastName,
        email:     editForm.email,
        role:      editForm.role,
        company:   editForm.company  ?? '',
        phone:     editForm.phone    ?? '',
        specialtyCategoryId: editForm.role === 'TECHNICIEN' && editForm.specialtyCategoryId
          ? Number(editForm.specialtyCategoryId)
          : null,
      });
      setEditMsg('Utilisateur mis à jour');
      fetchData();
      setTimeout(() => { setShowEditModal(false); setEditMsg(''); }, 1800);
    } catch (e) {
      setEditErr(
        typeof e.response?.data === 'string'
          ? e.response.data
          : e.response?.data?.message || 'Erreur lors de la mise à jour'
      );
    } finally { setUpdating(false); }
  };

  const handleToggle = async id => {
    try { await api.put(`/admin/users/${id}/toggle`); fetchData(); }
    catch (e) { console.error(e); }
  };

  const handleReset = async () => {
    if (!confirmResetUser) return;
    setResetting(true);
    try {
      await api.put(`/admin/users/${confirmResetUser.id}/reset-password`);
      showToast('success', 'Mot de passe réinitialisé', `Email envoyé à ${confirmResetUser.email}.`);
      setConfirmResetUser(null);
    } catch { showToast('error', 'Erreur', 'Impossible de réinitialiser.'); }
    finally { setResetting(false); }
  };

  const STAT_CARDS = [
    { key: 'total',      label: 'Total utilisateurs', icon: Users,  bg: RED },
    { key: 'ADMIN',      label: 'Administrateurs',    icon: Shield, bg: '#7c3aed' },
    { key: 'TECHNICIEN', label: 'Techniciens',        icon: Wrench, bg: '#ea580c' },
    { key: 'CLIENT',     label: 'Clients',            icon: User,   bg: '#4a4a4a' },
  ];

  return (
    <AdminLayout>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(22px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .au-header  { animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.04s both; }
        .au-kpis    { animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.12s both; }
        .au-filters { animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
        .au-table   { animation: fadeSlideUp 0.50s cubic-bezier(0.22,1,0.36,1) 0.32s both; }

        .au-kpi-0 { animation: fadeSlideUp 0.40s cubic-bezier(0.22,1,0.36,1) 0.12s both; }
        .au-kpi-1 { animation: fadeSlideUp 0.40s cubic-bezier(0.22,1,0.36,1) 0.20s both; }
        .au-kpi-2 { animation: fadeSlideUp 0.40s cubic-bezier(0.22,1,0.36,1) 0.28s both; }
        .au-kpi-3 { animation: fadeSlideUp 0.40s cubic-bezier(0.22,1,0.36,1) 0.36s both; }

        .au-row-0  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.36s both; }
        .au-row-1  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.42s both; }
        .au-row-2  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.48s both; }
        .au-row-3  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.54s both; }
        .au-row-4  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.60s both; }
        .au-row-5  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.66s both; }
        .au-row-6  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.72s both; }
        .au-row-7  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.78s both; }
        .au-row-8  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.84s both; }
        .au-row-9  { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.90s both; }
        .au-row-10 { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 0.96s both; }
        .au-row-11 { animation: fadeSlideUp 0.36s cubic-bezier(0.22,1,0.36,1) 1.02s both; }

        .au-btn-add {
          transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        .au-btn-add:hover {
          transform: translateY(-2px) scale(1.03) !important;
          box-shadow: 0 8px 22px rgba(227,30,36,0.32) !important;
        }
        .au-btn-add:active { transform: scale(0.97) !important; }

        .au-btn-refresh {
          transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        .au-btn-refresh:hover {
          transform: rotate(12deg) scale(1.08) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.10) !important;
          background-color: #f3f4f6 !important;
        }
        .au-btn-refresh:active { transform: rotate(180deg) scale(0.96) !important; }

        .row-user { transition: background-color 0.15s ease !important; }
        .row-user:hover { background: #f9fafb !important; }

        .btn-icon-u { transition: all .15s; border-radius: 8px; }
      `}</style>

      <ToastContainer />

      {/* ══ Modal réinitialisation mot de passe ══ */}
      {confirmResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ backgroundColor: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380,
            boxShadow: '0 20px 60px rgba(0,0,0,.18)', padding: '24px 24px 20px',
            animation: 'fadeSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fff1f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCcw style={{ width: 24, height: 24, color: RED }} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Réinitialiser le mot de passe ?</h2>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0', lineHeight: 1.5 }}>
                  Un mot de passe temporaire sera envoyé à <strong style={{ color: '#374151' }}>{confirmResetUser.email}</strong>.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmResetUser(null)} disabled={resetting}
                style={{ flex: 1, padding: '9px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#fff', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleReset} disabled={resetting}
                style={{ flex: 1, padding: '9px', background: RED, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', cursor: resetting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!resetting) e.currentTarget.style.background = RED_DARK; }}
                onMouseLeave={e => { if (!resetting) e.currentTarget.style.background = RED; }}>
                {resetting
                  ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                  : <><RotateCcw style={{ width: 14, height: 14 }} /> Réinitialiser</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>

        {/* ══ En-tête ══ */}
        <div className="au-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Gestion des utilisateurs</h1>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Administration des comptes et permissions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="au-btn-add"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#fff', background: RED, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = RED_DARK}
            onMouseLeave={e => e.currentTarget.style.background = RED}>
            <PlusCircle style={{ width: 14, height: 14 }} /> Ajouter un utilisateur
          </button>
        </div>

        {/* ══ KPI Cards ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          {STAT_CARDS.map(({ key, label, icon: Icon, bg }, i) => (
            <div
              key={key}
              className={`au-kpi-${i}`}
              style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 22, height: 22, color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0 }}>
                  <AnimatedKpiValue value={stats[key]} delay={i * 100} />
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ══ Barre de filtres ══ */}
        <div
          className="au-filters"
          style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af' }} />
              <input type="text" placeholder="Rechercher par nom, email, entreprise…" value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 12, outline: 'none',
                  background: '#fafafa', boxSizing: 'border-box', transition: 'all 0.15s', fontFamily: 'inherit', color: '#374151',
                }}
                onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = `0 0 0 3px rgba(227,30,36,.08)`; e.target.style.background = '#fff'; }}
                onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
              />
            </div>
            <CustomSelect value={roleFilter} onChange={setRoleFilter} options={ROLE_FILTER_OPTS} minWidth={160} />
            <CustomSelect value={statFilter} onChange={setStatFilter} options={STAT_FILTER_OPTS} minWidth={150} />
            <button
              onClick={fetchData}
              className="au-btn-refresh"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, fontWeight: 500, color: '#6b7280', background: '#fff', cursor: 'pointer' }}>
              <RefreshCw style={{ width: 13, height: 13 }} /> Actualiser
            </button>
          </div>
        </div>

        {/* ══ Tableau ══ */}
        <div
          className="au-table"
          style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <div style={{ width: 28, height: 28, border: `3px solid #fecaca`, borderTopColor: RED, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                  <thead>
                    <tr>
                      {['Utilisateur', 'Email', 'Entreprise', 'Téléphone', 'Rôle', 'Spécialité', 'Statut', 'Créé le', 'Actions'].map((h, i) => (
                        <th key={h} style={{ ...TH, textAlign: i === 8 ? 'center' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody key={animKey}>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: 14, animation: 'fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}>
                          Aucun utilisateur trouvé
                        </td>
                      </tr>
                    ) : filtered.map((user, idx) => {
                      const rc     = ROLE_CONFIG[user.role] || ROLE_CONFIG.CLIENT;
                      const RIcon  = rc.icon;
                      const isLast = idx === filtered.length - 1;
                      const rowAnim = idx < 12 ? `au-row-${idx}` : '';

                      return (
                        <tr key={user.id} className={`row-user ${rowAnim}`}
                          style={{ background: '#fff', borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}>

                          <td style={TD}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <UserAvatar user={user} size={36} />
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{user.firstName} {user.lastName}</p>
                                {user.mustChangePassword && <p style={{ fontSize: 10, color: '#d97706', margin: 0 }}>Mdp temporaire</p>}
                              </div>
                            </div>
                          </td>

                          <td style={{ ...TD, fontSize: 12, color: '#6b7280' }}>{user.email}</td>

                          <td style={TD}>
                            {user.company
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                  <Building2 style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />{user.company}
                                </div>
                              : <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}
                          </td>

                          <td style={TD}>
                            {user.phone
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                  <Phone style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />{user.phone}
                                </div>
                              : <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}
                          </td>

                          <td style={TD}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
                              <RIcon style={{ width: 11, height: 11 }} />{rc.label}
                            </span>
                          </td>

                          <td style={TD}>
                            {user.specialtyCategory
                              ? <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#fff1f1', color: RED, border: '1px solid #fecaca' }}>
                                  {user.specialtyCategory.name}
                                </span>
                              : <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}
                          </td>

                          <td style={TD}>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4,
                              background: user.enabled ? '#f0fdf4' : '#fef2f2',
                              color: user.enabled ? '#15803d' : '#b91c1c',
                              border: `1px solid ${user.enabled ? '#bbf7d0' : '#fecaca'}`,
                            }}>
                              {user.enabled ? <><CheckCircle style={{ width: 10, height: 10 }} />Actif</> : <><XCircle style={{ width: 10, height: 10 }} />Inactif</>}
                            </span>
                          </td>

                          <td style={{ ...TD, fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}
                          </td>

                          <td style={{ ...TD, textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                              <button className="btn-icon-u" onClick={() => handleToggle(user.id)}
                                title={user.enabled ? 'Désactiver' : 'Activer'}
                                style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: user.enabled ? RED : '#16a34a' }}
                                onMouseEnter={e => e.currentTarget.style.background = user.enabled ? '#fff1f1' : '#f0fdf4'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                {user.enabled ? <XCircle style={{ width: 14, height: 14 }} /> : <CheckCircle style={{ width: 14, height: 14 }} />}
                              </button>
                              <button className="btn-icon-u"
                                onClick={() => setConfirmResetUser({ id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email })}
                                title="Réinitialiser le mot de passe"
                                style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
                                <RotateCcw style={{ width: 14, height: 14 }} />
                              </button>
                              <button className="btn-icon-u" onClick={() => handleEditClick(user)}
                                title="Modifier"
                                style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: RED }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fff1f1'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <Pencil style={{ width: 14, height: 14 }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  Total : {stats.total ?? 0} comptes
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <UserFormModal title="Créer un utilisateur" onClose={() => { setShowModal(false); setMsg(''); setErr(''); }}
          onSubmit={handleCreate} submitting={creating} submitLabel="Créer le compte"
          form={form} setForm={setForm} specialtyOptions={specialtyOptions} msg={msg} err={err} />
      )}
      {showEditModal && selectedUser && (
        <UserFormModal title="Modifier l'utilisateur"
          avatar={`${editForm.firstName?.charAt(0)}${editForm.lastName?.charAt(0)}`}
          onClose={() => { setShowEditModal(false); setEditMsg(''); setEditErr(''); }}
          onSubmit={handleUpdateUser} submitting={updating} submitLabel="Enregistrer"
          form={editForm} setForm={setEditForm} specialtyOptions={specialtyOptionsEdit} msg={editMsg} err={editErr} />
      )}
    </AdminLayout>
  );
}
