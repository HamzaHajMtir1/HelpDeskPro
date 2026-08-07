// src/components/TicketForm.jsx
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Send, ArrowLeft, Paperclip, X, FileText,
  ChevronDown, ChevronUp, Tag, AlertTriangle,
} from 'lucide-react';
import { createTicket, getCategories, getPriorities, uploadAttachment } from '../api/ticketApi';

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [dropStyle, setDropStyle] = useState({});
  const btnRef = useRef(null);
  const ref = useRef(null);

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setDropStyle({
      position: 'fixed',
      top: rect.bottom + 2,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
      maxHeight: 220,
    });
  };

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const update = () => updatePosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 36px 10px 12px',
          border: open ? '1.5px solid #E31E24' : '1.5px solid #e5e7eb',
          borderRadius: '12px', fontSize: '14px',
          backgroundColor: open ? '#fff' : '#f9fafb',
          outline: 'none', cursor: 'pointer',
          color: selected ? '#374151' : '#9ca3af',
          textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(227,30,36,0.08)' : 'none',
          transition: 'all 0.15s', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : (placeholder || 'Sélectionner…')}
        </span>
        {open
          ? <ChevronUp style={{ width: 14, height: 14, color: '#E31E24', flexShrink: 0 }} />
          : <ChevronDown style={{ width: 14, height: 14, color: '#E31E24', flexShrink: 0 }} />
        }
      </button>

      {open && createPortal(
        <ul style={{
          ...dropStyle,
          backgroundColor: '#fff',
          border: '1.5px solid #E31E24',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflowY: 'auto',
          margin: 0, padding: '4px 0', listStyle: 'none',
          scrollbarWidth: 'thin', scrollbarColor: '#E31E24 #fff1f1',
        }}>
          {options.map(opt => {
            const isActive = String(opt.value) === String(value);
            return (
              <li key={opt.value}
                onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                style={{
                  padding: '9px 14px', fontSize: '14px', cursor: 'pointer',
                  backgroundColor: isActive ? '#fff1f1' : 'transparent',
                  color: isActive ? '#E31E24' : '#374151',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background-color 0.1s',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#fafafa'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
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

const RedInput = ({ value, onChange, placeholder, type = 'text', required }) => (
  <input
    type={type} placeholder={placeholder} value={value}
    onChange={onChange} required={required}
    style={{
      width: '100%', padding: '10px 12px',
      border: '1.5px solid #e5e7eb', borderRadius: '12px',
      fontSize: '14px', backgroundColor: '#f9fafb',
      outline: 'none', transition: 'all 0.15s',
      boxSizing: 'border-box', color: '#111827',
    }}
    onFocus={e => { e.target.style.borderColor = '#E31E24'; e.target.style.boxShadow = '0 0 0 3px rgba(227,30,36,0.08)'; e.target.style.backgroundColor = '#fff'; }}
    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#f9fafb'; }}
  />
);

const FieldLabel = ({ icon: Icon, text, required: req, optional }) => (
  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', letterSpacing: '0.01em' }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {Icon && <Icon style={{ width: 12, height: 12, color: '#E31E24' }} />}
      {text}
      {req && <span style={{ color: '#E31E24' }}>*</span>}
      {optional && <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12 }}>(optionnel)</span>}
    </span>
  </label>
);

const SkeletonField = ({ height = 42, width = '100%', radius = 12, style = {} }) => (
  <div className="tf-skeleton" style={{ height, width, borderRadius: radius, ...style }} />
);

export default function TicketForm({ Layout, redirectPath, backPath, successMessage }) {
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', priorityId: '', type: 'INCIDENT' });
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fichier, setFichier] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [catRes, priRes] = await Promise.all([getCategories(), getPriorities()]);
        setCategories(catRes.data);
        setPriorities(priRes.data);
        if (catRes.data.length > 0) setForm(f => ({ ...f, categoryId: catRes.data[0].id }));
        if (priRes.data.length > 0) setForm(f => ({ ...f, priorityId: priRes.data[0].id }));
      } catch { setError('Impossible de charger les données'); }
      finally { setDataLoading(false); }
    };
    fetchData();
  }, []);

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name + (c.slaHours ? ` — ${c.slaHours}h` : '') }));
  const priorityOptions = priorities.map(p => ({ value: p.id, label: p.name }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Le titre est obligatoire'); return; }
    if (!form.description.trim()) { setError('La description est obligatoire'); return; }
    setLoading(true);
    let createdTicketId = null;
    try {
      const res = await createTicket({ title: form.title, description: form.description, categoryId: Number(form.categoryId), priorityId: Number(form.priorityId), type: form.type });
      createdTicketId = res.data?.id;
    } catch { setError('Erreur lors de la création du ticket'); setLoading(false); return; }
    if (fichier && createdTicketId) {
      try { await uploadAttachment(createdTicketId, fichier); } catch (e) { console.warn('Fichier non uploadé:', e); }
    }
    setLoading(false);
    navigate(redirectPath, successMessage ? { state: { success: successMessage } } : undefined);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) setFichier(file); };

  return (
    <Layout>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(22px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes errorIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .tf-header { animation:fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.04s both; }
        .tf-card { animation:fadeSlideUp 0.50s cubic-bezier(0.22,1,0.36,1) 0.14s both; }
        .tf-field-0 { animation:fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.18s both; }
        .tf-field-1 { animation:fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.24s both; }
        .tf-field-2 { animation:fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.30s both; }
        .tf-field-3 { animation:fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.36s both; }
        .tf-field-4 { animation:fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.42s both; }
        .tf-field-5 { animation:fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.48s both; }
        .tf-skeleton { background:linear-gradient(90deg,#f0f0f5 25%,#f8f8fc 50%,#f0f0f5 75%); background-size:400px 100%; animation:shimmer 1.4s ease-in-out infinite; border-radius:12px; }
        .tf-type-btn { transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .tf-type-btn:hover { transform:translateY(-2px) !important; box-shadow:0 6px 18px rgba(0,0,0,0.10) !important; }
        .tf-submit-btn { transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .tf-submit-btn:hover:not(:disabled) { transform:translateY(-2px) scale(1.02) !important; box-shadow:0 8px 22px rgba(227,30,36,0.35) !important; }
        .tf-cancel-btn { transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .tf-cancel-btn:hover { transform:translateY(-1px) !important; background-color:#f9fafb !important; }
        .tf-error { animation:errorIn 0.3s ease both; }
      `}</style>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="tf-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button type="button" onClick={() => navigate(backPath)}
            style={{ padding: 8, border: '1.5px solid #e5e7eb', borderRadius: 10, backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#6b7280'; }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Créer un ticket</h1>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>Décrivez le problème en détail</p>
          </div>
        </div>

        <div className="tf-card" style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '24px 28px 28px' }}>
          {dataLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div><SkeletonField height={13} width={60} radius={6} style={{ marginBottom: 8 }} /><SkeletonField height={42} /></div>
              <div><SkeletonField height={13} width={90} radius={6} style={{ marginBottom: 8 }} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><SkeletonField height={72} /><SkeletonField height={72} /></div></div>
              <div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><SkeletonField height={13} width={75} radius={6} style={{ marginBottom: 8 }} /><SkeletonField height={42} /></div><div><SkeletonField height={13} width={60} radius={6} style={{ marginBottom: 8 }} /><SkeletonField height={42} /></div></div></div>
              <div><SkeletonField height={13} width={80} radius={6} style={{ marginBottom: 8 }} /><SkeletonField height={120} /></div>
              <div><SkeletonField height={13} width={100} radius={6} style={{ marginBottom: 8 }} /><SkeletonField height={100} /></div>
              <div style={{ display: 'flex', gap: 12 }}><SkeletonField height={42} style={{ flex: 1 }} /><SkeletonField height={42} style={{ flex: 1 }} /></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div className="tf-field-0">
                <FieldLabel text="Titre" req />
                <RedInput placeholder="Ex : Impossible d'accéder au serveur" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>

              <div className="tf-field-1">
                <FieldLabel text="Type de ticket" req />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {['INCIDENT', 'DEMANDE'].map(t => {
                    const active = form.type === t;
                    return (
                      <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} className="tf-type-btn"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '14px 16px', borderRadius: 12, border: `2px solid ${active ? '#E31E24' : '#e5e7eb'}`, backgroundColor: active ? '#fff1f1' : '#f9fafb', cursor: 'pointer', textAlign: 'left', boxShadow: active ? '0 4px 14px rgba(227,30,36,0.18)' : 'none' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#E31E24' : '#374151' }}>{t === 'INCIDENT' ? 'Incident' : 'Demande'}</span>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{t === 'INCIDENT' ? 'Quelque chose ne fonctionne pas' : 'Une nouvelle demande de service'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="tf-field-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <FieldLabel icon={Tag} text="Catégorie" req />
                  <CustomSelect value={form.categoryId} onChange={val => setForm({ ...form, categoryId: val })} options={categoryOptions} placeholder="Choisir une catégorie" />
                </div>
                <div>
                  <FieldLabel icon={AlertTriangle} text="Priorité" req />
                  <CustomSelect value={form.priorityId} onChange={val => setForm({ ...form, priorityId: val })} options={priorityOptions} placeholder="Choisir une priorité" />
                </div>
              </div>

              <div className="tf-field-3">
                <FieldLabel text="Description" req />
                <textarea placeholder="Décrivez le problème en détail : depuis quand, ce que vous avez essayé..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none', transition: 'all 0.15s', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827', lineHeight: 1.6 }}
                  onFocus={e => { e.target.style.borderColor = '#E31E24'; e.target.style.boxShadow = '0 0 0 3px rgba(227,30,36,0.08)'; e.target.style.backgroundColor = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#f9fafb'; }} />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{form.description.length} caractères</p>
              </div>

              <div className="tf-field-4">
                <FieldLabel icon={Paperclip} text="Pièce jointe" optional />
                {!fichier ? (
                  <label onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: 100, border: `2px dashed ${dragOver ? '#E31E24' : '#e5e7eb'}`, borderRadius: 12, cursor: 'pointer', backgroundColor: dragOver ? 'rgba(227,30,36,0.04)' : '#f9fafb', gap: 6 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#E31E24'; e.currentTarget.style.backgroundColor = 'rgba(227,30,36,0.03)'; }}
                    onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#f9fafb'; } }}>
                    <Paperclip style={{ width: 22, height: 22, color: dragOver ? '#E31E24' : '#9ca3af' }} />
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{dragOver ? 'Relâchez pour ajouter' : 'Glissez ou cliquez pour ajouter'}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>PDF, PNG, JPG, DOCX — max 10 MB</p>
                    <input type="file" style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={e => setFichier(e.target.files[0] || null)} />
                  </label>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText style={{ width: 18, height: 18, color: '#16a34a' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#15803d', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fichier.name}</p>
                      <p style={{ fontSize: 11, color: '#16a34a', margin: 0 }}>{(fichier.size / 1024).toFixed(1)} Ko</p>
                    </div>
                    <button type="button" onClick={() => setFichier(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                      <X style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="tf-error" style={{ backgroundColor: '#fff1f1', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#dc2626', flexShrink: 0 }} />{error}
                </div>
              )}

              <div className="tf-field-5" style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <button type="button" onClick={() => navigate(backPath)} className="tf-cancel-btn"
                  style={{ flex: 1, padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontWeight: 500, color: '#6b7280', backgroundColor: '#fff', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={loading} className="tf-submit-btn"
                  style={{ flex: 1, padding: '10px', backgroundColor: loading ? '#f87171' : '#E31E24', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.85 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#b81519'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#E31E24'; }}>
                  {loading ? (
                    <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Envoi…</>
                  ) : (
                    <><Send style={{ width: 14, height: 14 }} />Soumettre le ticket</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}