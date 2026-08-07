import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Plus, BookOpen, Eye, Pencil,
  X, ThumbsUp, CheckCircle, Paperclip,
  Save, Loader2, Upload, Trash2,
  ChevronDown, ChevronUp, Filter,
  TicketCheck, BarChart2, Pin, Library,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAllArticles, searchArticles,getArticle,
  createArticle, updateArticle, deleteArticle
} from '../../api/knowledgeApi';
import api from '../../api/axios';

/* ─── useCountUp ─── */
function useCountUp(target, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let startTime = null;
    const timeoutId = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.round(target * eased));
        if (progress < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeoutId); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);
  return count;
}

/* ─── Design Tokens ─── */
const C = {
  red: '#E31E24', redDark: '#b91519',
  redGlow: 'rgba(227,30,36,0.18)', redGlow2: 'rgba(227,30,36,0.08)',
  black: '#0a0a0f', dark: '#111118', dark2: '#18181f', dark3: '#22222c',
  grey900: '#1f1f23', grey700: '#3a3a42', grey500: '#6b6b75',
  grey300: '#b0b0bb', grey200: '#e2e2e8', grey100: '#f0f0f5',
  grey50: '#f8f8fc', white: '#ffffff',
};

const HEADER_BG = `linear-gradient(135deg, ${C.black} 0%, #1a0406 40%, ${C.red} 100%)`;
const CATEGORIES = ['Sécurité', 'Réseau', 'Matériel', 'Logiciel', 'Email', 'Accès', 'Autre'];
const PAGE_SIZE = 6;

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(22px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(227,30,36,0); }
    50%       { box-shadow: 0 0 0 8px rgba(227,30,36,0.12); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  @keyframes float1 {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%       { transform: translateY(-18px) rotate(8deg); }
  }
  @keyframes float2 {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%       { transform: translateY(-12px) rotate(-6deg); }
  }
  @keyframes float3 {
    0%, 100% { transform: translateY(0) scale(1); }
    50%       { transform: translateY(-8px) scale(1.06); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.93) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes glowPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

  .ak-root { font-family: 'DM Sans', system-ui, sans-serif; }

  .ak-card {
    background: ${C.white};
    border-radius: 18px;
    border: 1px solid ${C.grey200};
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease, border-color 0.2s ease;
    animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }
  .ak-card::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(227,30,36,0.04) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 0;
  }
  .ak-card::after {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, ${C.red} 0%, transparent 100%);
    opacity: 0; transition: opacity 0.3s; border-radius: 18px 0 0 18px;
  }
  .ak-card:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 50px rgba(0,0,0,0.12), 0 0 0 1px rgba(227,30,36,0.15), 0 4px 12px rgba(227,30,36,0.1); border-color: rgba(227,30,36,0.2); }
  .ak-card:hover::before { opacity: 1; }
  .ak-card:hover::after  { opacity: 1; }
  .ak-card:hover .ak-card-icon  { transform: scale(1.12) rotate(-6deg); }
  .ak-card:hover .ak-card-title { color: ${C.red}; }
  .ak-card-icon  { transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }
  .ak-card-title { transition: color 0.2s ease; }

  .ak-skeleton {
    background: linear-gradient(90deg, ${C.grey100} 25%, ${C.grey50} 50%, ${C.grey100} 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }

  .ak-stat { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease; }
  .ak-stat:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }

  .ak-filter-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
  .ak-filter-btn:hover { transform: translateY(-1px) scale(1.04); }

  .ak-search-wrap:focus-within .ak-search-glow { opacity: 1; transform: scale(1.02); }
  .ak-search-glow {
    position: absolute; inset: -3px; border-radius: 16px;
    background: linear-gradient(135deg, rgba(227,30,36,0.2), rgba(180,20,20,0.1));
    filter: blur(10px); opacity: 0; transform: scale(0.98);
    transition: opacity 0.3s, transform 0.3s; pointer-events: none; z-index: 0;
  }

  .ak-orb-1 { animation: float1 6s ease-in-out infinite; }
  .ak-orb-2 { animation: float2 8s ease-in-out infinite 1s; }
  .ak-orb-3 { animation: float3 5s ease-in-out infinite 2s; }

  .ak-modal-box { animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
  .ak-overlay   { animation: overlayIn 0.2s ease both; }

  .ak-show-more:hover .ak-show-more-icon { transform: translateY(3px); }
  .ak-show-more-icon { transition: transform 0.2s; }

  .ak-new-btn { animation: pulse-glow 3s ease-in-out infinite; }
  .ak-new-btn:hover { animation: none; }

  @media (max-width: 900px) {
    .ak-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 600px) {
    .ak-stats-grid { grid-template-columns: 1fr 1fr !important; }
    .ak-hero-inner { flex-direction: column !important; align-items: flex-start !important; }
    .ak-cards-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ─── CustomSelect (createPortal) ─── */
const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const btnRef  = useRef(null);
  const listRef = useRef(null);

  const updateRect = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        btnRef.current  && !btnRef.current.contains(e.target) &&
        listRef.current && !listRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const refresh = () => updateRect();
    window.addEventListener('scroll', refresh, true);
    window.addEventListener('resize', refresh);
    return () => {
      window.removeEventListener('scroll', refresh, true);
      window.removeEventListener('resize', refresh);
    };
  }, [open]);

  const selected = options.find(o => String(o.value) === String(value));

  const dropdownStyle = rect ? {
    position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width,
    maxHeight: Math.min(260, window.innerHeight - rect.bottom - 12),
    zIndex: 99999, background: '#fff', border: `1.5px solid ${C.red}`,
    borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
    overflowY: 'auto', margin: 0, padding: '4px 0', listStyle: 'none',
    scrollbarWidth: 'thin', scrollbarColor: `${C.red} #fff1f1`,
  } : { display: 'none' };

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <button ref={btnRef} type="button"
        onClick={() => { updateRect(); setOpen(o => !o); }}
        style={{
          width: '100%', padding: '11px 36px 11px 14px',
          border: `1.5px solid ${open ? C.red : C.grey200}`, borderRadius: 12,
          fontSize: 13, background: '#fff', outline: 'none', cursor: 'pointer',
          color: selected ? C.grey900 : C.grey500, textAlign: 'left',
          boxShadow: open ? `0 0 0 3px ${C.redGlow}` : 'none', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit',
        }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : (placeholder || 'Choisir…')}
        </span>
        {open
          ? <ChevronUp   size={13} color={C.red} style={{ flexShrink: 0 }} />
          : <ChevronDown size={13} color={C.red} style={{ flexShrink: 0 }} />}
      </button>
      {open && createPortal(
        <ul ref={listRef} style={dropdownStyle}>
          {options.map(opt => {
            const active = String(opt.value) === String(value);
            return (
              <li key={opt.value}
                onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                style={{
                  padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                  background: active ? '#fff5f5' : 'transparent',
                  color: active ? C.red : C.grey700,
                  fontWeight: active ? 600 : 400, transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.grey50; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                {opt.label}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
};

const CATEGORY_OPTIONS = [{ value: '', label: 'Choisir…' }, ...CATEGORIES.map(c => ({ value: c, label: c }))];

/* ─── Field ─── */
function Field({ label, formKey, form, setForm, setError, type = 'text', placeholder = '' }) {
  const base = {
    width: '100%', borderRadius: 12, border: `1.5px solid ${C.grey200}`,
    padding: '11px 14px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
    color: C.grey900, transition: 'border-color .2s, box-shadow .2s', fontFamily: 'inherit',
  };
  const onFocus = e => { e.target.style.borderColor = C.red; e.target.style.boxShadow = `0 0 0 3px ${C.redGlow}`; };
  const onBlur  = e => { e.target.style.borderColor = C.grey200; e.target.style.boxShadow = 'none'; };
  const onChange = e => { setForm(f => ({ ...f, [formKey]: e.target.value })); setError(''); };
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontSize: 10, color: C.grey500, marginBottom: 7,
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px',
      }}>{label}</label>
      {type === 'textarea'
        ? <textarea rows={4} value={form[formKey]} placeholder={placeholder}
            onChange={onChange} onFocus={onFocus} onBlur={onBlur}
            style={{ ...base, resize: 'vertical', lineHeight: 1.65 }} />
        : <input type="text" value={form[formKey]} placeholder={placeholder}
            onChange={onChange} onFocus={onFocus} onBlur={onBlur} style={base} />}
    </div>
  );
}

/* ─── Skeleton Card ─── */
function SkeletonCard() {
  return (
    <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grey200}`, padding: '20px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="ak-skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="ak-skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
          <div className="ak-skeleton" style={{ height: 14, width: '60%' }} />
        </div>
      </div>
      <div className="ak-skeleton" style={{ height: 12, width: '100%', marginBottom: 8 }} />
      <div className="ak-skeleton" style={{ height: 12, width: '75%', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="ak-skeleton" style={{ height: 24, width: 70, borderRadius: 20 }} />
        <div className="ak-skeleton" style={{ height: 24, width: 55, borderRadius: 20 }} />
      </div>
    </div>
  );
}

/* ─── ArticleModal ─── */
function ArticleModal({ article, onClose, onSave }) {
  const [form, setForm] = useState(
    article
      ? { title: article.title || '', problem: article.problem || '',
          solution: article.solution || '', category: article.category || '', tags: article.tags || '' }
      : { title: '', problem: '', solution: '', category: '', tags: '' }
  );
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [uploadError, setUploadError] = useState('');
  const [newFiles,    setNewFiles]    = useState([]);
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef(null);

  const hasTicket = !!article?.ticketId;
  const hasId     = !!article?.id;
  const busy      = saving || uploading;

  function addFiles(files) {
    setNewFiles(p => [...p, ...Array.from(files)]);
    setUploadError('');
  }

  async function uploadFile(file) {
    const token = localStorage.getItem('token');
    const fd = new FormData(); fd.append('file', file);
    if (hasTicket) {
      const r = await fetch(`https://helpdesk.4d-gile.com/api/tickets/${article.ticketId}/attachments`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) throw new Error('Upload échoué');
      const u = await r.json();
      await api.patch(`/tickets/${article.ticketId}/solution/attachment/${u.id}`);
      return u;
    } else {
      const r = await fetch(`https://helpdesk.4d-gile.com/api/knowledge/${article.id}/attachments`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) throw new Error('Upload échoué');
      return r.json();
    }
  }

  async function handleSave() {
    if (!form.title.trim() || !form.problem.trim() || !form.solution.trim()) {
      setError('Titre, problème et solution sont obligatoires.'); return;
    }
    setSaving(true); setError('');
    try {
      if (article?.id) await updateArticle(article.id, form);
      else             await createArticle(form);
      if (newFiles.length > 0 && hasId) {
        setUploading(true);
        for (const f of newFiles) {
          try { await uploadFile(f); }
          catch { setUploadError(`Erreur upload : ${f.name}`); }
        }
        setUploading(false);
        await new Promise(r => setTimeout(r, 500));
      }
      try {
        const updated = await getArticle(article?.id);
        onSave(updated.data);
      } catch { onSave(); }
    } catch { setError('Erreur lors de la sauvegarde.'); }
    finally  { setSaving(false); setUploading(false); }
  }

  return (
    <div className="ak-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(8,8,14,0.75)',
      backdropFilter: 'blur(6px)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="ak-modal-box" style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 640,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
      }}>
        {/* Header */}
        <div style={{
          background: HEADER_BG, borderRadius: '24px 24px 0 0', padding: '22px 26px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          <div className="ak-orb-1" style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div className="ak-orb-2" style={{ position: 'absolute', bottom: -30, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {article?.id ? <Pencil size={17} color="#fff" /> : <Plus size={17} color="#fff" />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
                {article?.id ? "Modifier l'article" : 'Nouvel article'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
                {article?.id ? article.title : 'Base de connaissances'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.8)', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            <X size={15} />
          </button>
        </div>

        {/* Body scrollable */}
        <div style={{ padding: '26px 26px 30px', overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
          <Field label="Titre *" formKey="title" form={form} setForm={setForm} setError={setError}
                 placeholder="Ex: Problème de connexion VPN" />
          <Field label="Problème / Symptôme *" formKey="problem" form={form} setForm={setForm} setError={setError}
                 type="textarea" placeholder="Décrivez le problème rencontré..." />
          <Field label="Solution *" formKey="solution" form={form} setForm={setForm} setError={setError}
                 type="textarea" placeholder="Décrivez la solution étape par étape..." />
          {error && <p style={{ margin: '-10px 0 16px', fontSize: 12, color: C.red, fontWeight: 500 }}>{error}</p>}

          {/* Catégorie + Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <label style={{
                display: 'block', fontSize: 10, color: C.grey500, marginBottom: 7,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px',
              }}>Catégorie</label>
              <CustomSelect
                value={form.category}
                onChange={v => setForm(f => ({ ...f, category: v }))}
                options={CATEGORY_OPTIONS}
                placeholder="Choisir…"
              />
            </div>
            <Field label="Tags (virgule)" formKey="tags" form={form} setForm={setForm} setError={setError}
                   placeholder="vpn, réseau..." />
          </div>

          {/* PJ existantes */}
          {hasId && article?.solutionAttachments?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{
                margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: C.grey500,
                textTransform: 'uppercase', letterSpacing: '0.9px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Paperclip size={11} color={C.grey500} /> Pièces jointes actuelles
              </p>
              {article.solutionAttachments.map(att => (
                <div key={att.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: '#f0fdf4',
                  borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 6,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Paperclip size={13} color="#16a34a" />
                  </div>
                  <p style={{ margin: 0, flex: 1, fontSize: 12, fontWeight: 600, color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</p>
                  <span style={{ fontSize: 10, color: '#86efac', flexShrink: 0 }}>{att.uploadedBy}</span>
                </div>
              ))}
            </div>
          )}

          {/* Zone upload */}
          {hasId && (
            <div style={{ marginBottom: 26 }}>
              <p style={{
                margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: C.grey500,
                textTransform: 'uppercase', letterSpacing: '0.9px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Upload size={11} color={C.grey500} /> Ajouter une pièce jointe
              </p>
              {!hasTicket && (
                <p style={{
                  margin: '0 0 10px', fontSize: 11, color: C.grey500,
                  background: C.grey50, padding: '7px 12px', borderRadius: 9,
                  border: `1px solid ${C.grey200}`, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  📁 Stockés directement dans la base de connaissances.
                </p>
              )}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                style={{
                  border: `2px dashed ${dragOver ? C.red : C.grey200}`,
                  borderRadius: 14, padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? '#fff5f5' : C.grey50, transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.background = '#fff5f5'; }}
                onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.borderColor = C.grey200; e.currentTarget.style.background = C.grey50; } }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: dragOver ? '#fff1f1' : C.grey100,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px', transition: 'background 0.2s',
                }}>
                  <Upload size={19} color={dragOver ? C.red : C.grey500} />
                </div>
                <p style={{ margin: 0, fontSize: 13, color: C.grey700, fontWeight: 500 }}>
                  Glissez ou <span style={{ color: C.red, fontWeight: 700 }}>cliquez pour choisir</span>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: C.grey500 }}>PDF, PNG, JPG, DOC, DOCX</p>
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                     multiple onChange={e => addFiles(e.target.files)} style={{ display: 'none' }} />
              {newFiles.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {newFiles.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 13px', background: '#fff5f5',
                      borderRadius: 10, border: '1px solid #fecaca',
                    }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff1f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Paperclip size={13} color={C.red} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#b91c1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                        <p style={{ margin: 0, fontSize: 10, color: '#fca5a5' }}>{(f.size / 1024).toFixed(0)} Ko · En attente d'upload</p>
                      </div>
                      <button onClick={() => setNewFiles(p => p.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 2, display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = C.red}
                        onMouseLeave={e => e.currentTarget.style.color = '#fca5a5'}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {uploadError && <p style={{ margin: '8px 0 0', fontSize: 12, color: C.red }}>{uploadError}</p>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} disabled={busy}
              style={{
                padding: '10px 22px', borderRadius: 12, border: `1px solid ${C.grey200}`,
                background: '#fff', fontSize: 13, fontWeight: 500, color: C.grey500,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.grey100; e.currentTarget.style.borderColor = C.grey500; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = C.grey200; }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={busy}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px',
                borderRadius: 12, border: 'none',
                background: busy ? '#86efac' : '#16a34a',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
                boxShadow: busy ? 'none' : '0 4px 14px rgba(22,163,74,0.35)',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#15803d'; }}
              onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#16a34a'; }}>
              {uploading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Upload…</>
               : saving  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde…</>
               :            <><Save size={14} /> {article?.id ? 'Sauvegarder' : "Créer l'article"}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ArticleDetail ─── */
function ArticleDetail({ article, onClose, onEdit }) {
  if (!article) return null;
  const tags = article.tags ? String(article.tags).split(',').filter(Boolean) : [];

  // Téléchargement PJ ticket (via attachment ID)
  const dl = (id, name, tid) => {
    const token = localStorage.getItem('token');
    fetch(`https://helpdesk.4d-gile.com/api/tickets/${tid}/attachments/${id}/download`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b); a.download = name; a.click();
        URL.revokeObjectURL(a.href);
      }).catch(console.error);
  };

  // ✅ Téléchargement PJ manuelle KB (via storedFileName)
  const dlKB = (storedFileName, originalName, articleId) => {
    const token = localStorage.getItem('token');
    fetch(`https://helpdesk.4d-gile.com/api/knowledge/${articleId}/attachments/${storedFileName}/download`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = originalName;
        a.click();
        URL.revokeObjectURL(a.href);
      }).catch(console.error);
  };

  return (
    <div className="ak-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(8,8,14,0.72)',
      backdropFilter: 'blur(6px)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="ak-modal-box" style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
        scrollbarWidth: 'none',
      }}>
        <div style={{ background: HEADER_BG, borderRadius: '24px 24px 0 0', padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
          <div className="ak-orb-1" style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div className="ak-orb-3" style={{ position: 'absolute', bottom: -30, right: 120, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              {article.category && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 6,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.7px',
                }}>📁 {article.category}</span>
              )}
              <h2 style={{ margin: '0 0 10px', color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.3 }}>{article.title}</h2>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={11} /> {article.views} vues
                </span>
                {article.helpful > 0 && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ThumbsUp size={11} /> {article.helpful} utile
                  </span>
                )}
                {article.createdByName && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Par {article.createdByName}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => { onClose(); setTimeout(() => onEdit(article), 100); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600, transition: 'background 0.15s', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                <Pencil size={12} /> Modifier
              </button>
              <button onClick={onClose}
                style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 28px 28px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.grey500, textTransform: 'uppercase', letterSpacing: '0.9px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.red, display: 'inline-block' }} /> Description du problème
          </p>
          <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16, border: '1px solid #fecaca', marginBottom: 22 }}>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: '#7f1d1d' }}>{article.problem || 'Aucune description disponible'}</p>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.grey500, textTransform: 'uppercase', letterSpacing: '0.9px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={11} color="#16a34a" /> Solution
          </p>
          {article.solutionComment ? (
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, border: '1px solid #bbf7d0', marginBottom: 18 }}>
              <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={11} /> SOLUTION OFFICIELLE ÉPINGLÉE
              </p>
              <p style={{ margin: '0 0 10px', fontSize: 13.5, lineHeight: 1.7, color: '#166534', whiteSpace: 'pre-wrap' }}>{article.solutionComment.content}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#86efac' }}>Par {article.solutionComment.authorName} · {new Date(article.solutionComment.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          ) : (
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, border: '1px solid #bbf7d0', marginBottom: 18 }}>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: '#166534', whiteSpace: 'pre-wrap' }}>{article.solution || 'Aucune solution documentée'}</p>
            </div>
          )}

          {article.solutionAttachments?.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: C.grey500, textTransform: 'uppercase', letterSpacing: '0.9px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Paperclip size={11} /> Pièces jointes solution
              </p>
              {article.solutionAttachments.map(att => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', background: '#f0fdf4', borderRadius: 11, border: '1px solid #bbf7d0', marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Paperclip size={15} color="#16a34a" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#15803d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.fileName}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#86efac' }}>Par {att.uploadedBy} · {new Date(att.uploadedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {/* ✅ Bouton conditionnel : ticket → dl par ID, KB manuel → dlKB par storedFileName */}
                  {(article.ticketId || att.storedFileName) && (
                    <button
                      onClick={() => article.ticketId
                        ? dl(att.id, att.fileName, article.ticketId)
                        : dlKB(att.storedFileName, att.fileName, article.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, border: '1px solid #86efac', background: '#dcfce7', fontSize: 12, fontWeight: 600, color: '#16a34a', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                      <Eye size={12} /> Ouvrir
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tags.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: C.grey500, textTransform: 'uppercase', letterSpacing: '0.9px' }}>🏷️ Tags</p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {tags.map(t => (
                  <span key={t} style={{ fontSize: 12, padding: '5px 13px', borderRadius: 20, background: C.grey100, color: C.grey700, fontWeight: 500 }}>{t.trim()}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${C.grey100}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            {article.ticketId && <span style={{ fontSize: 12, color: C.grey500 }}>🎫 Ticket #TKT-{String(article.ticketId).padStart(3, '0')}</span>}
            {article.createdByName && <span style={{ fontSize: 12, color: C.grey500 }}>👤 {article.createdByName}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ArticleCard ─── */
function ArticleCard({ article, onEdit, onView, delay = 0 }) {
  const tags = article.tags ? String(article.tags).split(',').filter(Boolean) : [];
  return (
    <div className="ak-card" onClick={() => onView(article)} style={{ animationDelay: `${delay}ms` }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle at top right, ${C.redGlow} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
      {article.solutionCommentId && (
        <div style={{ position: 'absolute', top: 14, right: 14, background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', borderRadius: 8, padding: '3px 9px', fontSize: 10, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 3, border: '1px solid #86efac', zIndex: 2 }}>
          <CheckCircle size={9} /> Épinglée
        </div>
      )}
      <div style={{ padding: '20px 20px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 12 }}>
          <div className="ak-card-icon" style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 18px ${C.redGlow}` }}>
            <BookOpen size={20} color="#fff" />
          </div>
          <p className="ak-card-title" style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.grey900, lineHeight: 1.45, paddingRight: article.solutionCommentId ? 78 : 0, paddingTop: 2 }}>{article.title}</p>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: C.grey500, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.problem}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {article.category && <span style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 20, background: '#fff5f5', color: C.red, fontWeight: 600, border: '1px solid #fecaca' }}>{article.category}</span>}
          {article.solutionCommentId && <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 20, background: '#dcfce7', color: '#16a34a', fontWeight: 600, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle size={9} /> Solution</span>}
          {article.solutionAttachmentIds?.length > 0 && <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 20, background: '#fff5f5', color: C.red, fontWeight: 600, border: `1px solid ${C.red}25`, display: 'flex', alignItems: 'center', gap: 3 }}><Paperclip size={9} /> {article.solutionAttachmentIds.length} PJ</span>}
          {tags.slice(0, 2).map(t => <span key={t} style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 20, background: C.grey100, color: C.grey500, fontWeight: 500 }}>{t.trim()}</span>)}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.grey100}`, padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, transparent, #fafafa)', position: 'relative', zIndex: 1 }}
           onClick={e => e.stopPropagation()}>
        <span style={{ fontSize: 11.5, color: C.grey500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={12} /> {article.views || 0}
          {article.helpful > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><ThumbsUp size={12} /> {article.helpful}</span>}
        </span>
        <button onClick={() => onEdit(article)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, width: 'auto', height: 30, padding: '0 12px', borderRadius: 9, border: `1px solid ${C.grey200}`, background: '#fff', cursor: 'pointer', transition: 'all 0.18s', color: C.grey500, fontSize: 11.5, fontWeight: 500, fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; e.currentTarget.style.background = '#fff5f5'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.grey200; e.currentTarget.style.color = C.grey500; e.currentTarget.style.background = '#fff'; }}>
          <Pencil size={12} /> Modifier
        </button>
      </div>
    </div>
  );
}

/* ─── StatCard ─── */
function StatCard({ label, value, Icon, color, delay = 0 }) {
  const animated = useCountUp(value, 1100, delay + 200);
  const gradients = { red: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, dark: `linear-gradient(135deg, ${C.grey900}, ${C.grey700})`, green: 'linear-gradient(135deg, #059669, #10b981)', blue: 'linear-gradient(135deg, #2563eb, #3b82f6)' };
  const shadows   = { red: '0 6px 18px rgba(227,30,36,0.35)', dark: '0 6px 18px rgba(0,0,0,0.3)', green: '0 6px 18px rgba(16,185,129,0.35)', blue: '0 6px 18px rgba(59,130,246,0.35)' };
  return (
    <div className="ak-stat" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.95)', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', animationDelay: `${delay}ms`, animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div>
        <p style={{ margin: '0 0 5px', fontSize: 11.5, color: C.grey500, fontWeight: 500 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.grey900, letterSpacing: '-0.8px', fontVariantNumeric: 'tabular-nums' }}>{animated.toLocaleString('fr-FR')}</p>
      </div>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: gradients[color] || gradients.dark, boxShadow: shadows[color] || shadows.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', flexShrink: 0 }}
           onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.14) rotate(-9deg)'}
           onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        <Icon size={20} color="#fff" strokeWidth={1.8} />
      </div>
    </div>
  );
}

/* ─── Page principale AdminKnowledge ─── */
export default function AdminKnowledge() {
  const [articles,  setArticles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState('');
  const [modal,     setModal]     = useState(null);
  const [detail,    setDetail]    = useState(null);
  const [catFilter, setCatFilter] = useState('');
  const [sortBy,    setSortBy]    = useState('recent');
  const [focused,   setFocused]   = useState(false);
  const [visible,   setVisible]   = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = query ? await searchArticles(query) : await getAllArticles();
      setArticles(res.data);
      setVisible(PAGE_SIZE);
    } catch { setArticles([]); }
    finally  { setLoading(false); }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [load]);

  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
  const allFiltered = articles
    .filter(a => !catFilter || a.category === catFilter)
    .sort((a, b) => {
      if (sortBy === 'views')   return (b.views || 0) - (a.views || 0);
      if (sortBy === 'helpful') return (b.helpful || 0) - (a.helpful || 0);
      return b.id - a.id;
    });

  const displayed = allFiltered.slice(0, visible);
  const hasMore   = visible < allFiltered.length;
  const remaining = allFiltered.length - visible;

  const stats = [
    { label: 'Articles total',      value: articles.length,                                  Icon: Library,     color: 'red'   },
    { label: 'Depuis tickets',      value: articles.filter(a => a.ticketId).length,          Icon: TicketCheck, color: 'dark'  },
    { label: 'Vues totales',        value: articles.reduce((s, a) => s + (a.views || 0), 0), Icon: Eye,         color: 'blue'  },
    { label: 'Solutions épinglées', value: articles.filter(a => a.solutionCommentId).length, Icon: Pin,         color: 'green' },
  ];

  return (
    <AdminLayout>
      <style>{GLOBAL_STYLES}</style>
      <div className="ak-root">

        {modal && (
          <ArticleModal
            article={modal === 'create' ? null : modal}
            onClose={() => setModal(null)}
            onSave={(updatedArticle) => {
              setModal(null);
              if (updatedArticle) {
                setArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
              }
              load();
            }}
          />
        )}
        {detail && (
          <ArticleDetail
            article={detail}
            onClose={() => setDetail(null)}
            onEdit={a => setModal(a)}
          />
        )}

        {/* Hero */}
        <div style={{ borderRadius: 24, marginBottom: 22, position: 'relative', overflow: 'hidden', background: HEADER_BG, padding: '32px 36px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="ak-orb-1" style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div className="ak-orb-2" style={{ position: 'absolute', bottom: -50, right: 120, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div className="ak-orb-3" style={{ position: 'absolute', top: 20, right: 200, width: 60, height: 60, borderRadius: '50%', background: 'rgba(227,30,36,0.25)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

          <div className="ak-hero-inner" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 6 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <BookOpen size={19} color="#fff" />
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>Base de connaissances</h2>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(227,30,36,0.35)', border: '1px solid rgba(227,30,36,0.5)', fontSize: 10, fontWeight: 700, color: 'rgba(255,100,100,0.9)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>AI-Powered</span>
              </div>
              <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.55)', fontSize: 13.5 }}>Gérez et consultez les solutions documentées de votre équipe</p>

              {/* Search */}
              <div className="ak-search-wrap" style={{ position: 'relative', maxWidth: 520 }}>
                <div className="ak-search-glow" />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', background: focused ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)', border: `1.5px solid ${focused ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)'}`, borderRadius: 14, boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.25s' }}>
                  <Search size={15} style={{ marginLeft: 14, flexShrink: 0, transition: 'color 0.2s' }} color={focused ? '#fff' : 'rgba(255,255,255,0.45)'} />
                  <input type="text" placeholder="Rechercher un problème, une solution…"
                    value={query} onChange={e => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{ flex: 1, padding: '13px 12px', background: 'transparent', border: 'none', fontSize: 13.5, outline: 'none', color: '#fff', fontFamily: 'inherit' }} />
                  {query && (
                    <button onClick={() => setQuery('')}
                      style={{ marginRight: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', display: 'flex', padding: 2, transition: 'color 0.15s', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                      <X size={13} />
                    </button>
                  )}
                </div>
                {query && !loading && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 10, background: 'rgba(18,18,28,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '5px 13px', display: 'flex', alignItems: 'center', gap: 7, backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, flexShrink: 0, animation: 'glowPulse 1.5s ease-in-out infinite' }} />
                    <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{allFiltered.length} résultat{allFiltered.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            <button className="ak-new-btn" onClick={() => setModal('create')}
              style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: 'none', borderRadius: 14, padding: '13px 24px', color: C.red, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.2)', transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)', alignSelf: 'flex-start', marginTop: 6, fontFamily: 'inherit', letterSpacing: '-0.1px' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.25)'; e.currentTarget.style.animation = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'; }}>
              <Plus size={17} /> Nouvel article
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="ak-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 60} />)}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, animation: 'fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.2s both' }}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: C.grey500, fontWeight: 600, marginRight: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Filter size={13} /> Filtrer :
            </span>
            {['', ...categories].map(c => {
              const active = catFilter === c;
              return (
                <button key={c || 'all'} className="ak-filter-btn"
                  onClick={() => { setCatFilter(c); setVisible(PAGE_SIZE); }}
                  style={{ padding: '6px 16px', borderRadius: 20, cursor: 'pointer', border: `1.5px solid ${active ? C.red : C.grey200}`, background: active ? `linear-gradient(135deg,${C.red},${C.redDark})` : '#fff', color: active ? '#fff' : C.grey500, fontSize: 12.5, fontWeight: 600, transition: 'all 0.2s', boxShadow: active ? `0 4px 14px ${C.redGlow}` : 'none', fontFamily: 'inherit' }}>
                  {c || 'Toutes'}
                </button>
              );
            })}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 12, border: `1px solid ${C.grey200}`, fontSize: 12.5, color: C.grey700, background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: 'inherit', fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <option value="recent">⏱ Plus récents</option>
            <option value="views">👁 Plus vus</option>
            <option value="helpful">👍 Plus utiles</option>
          </select>
        </div>

        {/* Grille */}
        {loading ? (
          <div className="ak-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : allFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 0', animation: 'fadeSlideUp 0.4s ease both' }}>
            <div style={{ width: 70, height: 70, borderRadius: 20, background: `linear-gradient(135deg,${C.grey100},${C.grey50})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: `1px solid ${C.grey200}` }}>
              <BookOpen size={30} color={C.grey300} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: C.grey700 }}>Aucun résultat</p>
            <p style={{ margin: '0 0 24px', fontSize: 13.5, color: C.grey500 }}>
              {query ? `Aucun article pour "${query}"` : 'Créez votre premier article de connaissances'}
            </p>
            <button onClick={() => setModal('create')}
              style={{ background: `linear-gradient(135deg,${C.red},${C.redDark})`, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 26px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 18px ${C.redGlow}` }}>
              + Nouvel article
            </button>
          </div>
        ) : (
          <>
            <div className="ak-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {displayed.map((a, i) => (
                <ArticleCard key={a.id} article={a} delay={i < PAGE_SIZE ? i * 55 : 0}
                  onEdit={art => setModal(art)} onView={art => setDetail(art)} />
              ))}
            </div>
            {hasMore && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32, gap: 12, animation: 'fadeSlideUp 0.4s ease both' }}>
                <p style={{ margin: 0, fontSize: 12.5, color: C.grey500, fontWeight: 500 }}>
                  Affichage de <strong style={{ color: C.grey700 }}>{displayed.length}</strong> sur <strong style={{ color: C.grey700 }}>{allFiltered.length}</strong> articles
                </p>
                <button className="ak-show-more" onClick={() => setVisible(v => v + PAGE_SIZE)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '14px 36px', borderRadius: 16, background: '#fff', border: `1.5px solid ${C.grey200}`, cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.boxShadow = `0 8px 28px ${C.redGlow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.grey200; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = ''; }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.grey900 }}>Afficher {Math.min(PAGE_SIZE, remaining)} articles de plus</span>
                  <ChevronDown className="ak-show-more-icon" size={18} color={C.red} />
                </button>
              </div>
            )}
            {!hasMore && allFiltered.length > PAGE_SIZE && (
              <p style={{ textAlign: 'center', marginTop: 28, fontSize: 12.5, color: C.grey300, animation: 'fadeIn 0.4s ease both' }}>
                ✓ Tous les {allFiltered.length} articles affichés
              </p>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}