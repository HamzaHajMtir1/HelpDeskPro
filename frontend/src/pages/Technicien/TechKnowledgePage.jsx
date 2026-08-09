import { useState, useEffect, useRef } from 'react';
import {
  Search, BookOpen, Eye, ThumbsUp, ThumbsDown,
  X, CheckCircle, Edit2, Paperclip, Save,
  Loader2, Upload, Trash2, TicketCheck, Pin, ChevronDown
} from 'lucide-react';
import TechnicienLayout from '../../layouts/TechnicienLayout';
import {
  getAllArticles, searchArticles, getArticle,
  voteArticle, updateArticle,
} from '../../api/knowledgeApi';
import api from '../../api/axios';

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

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(22px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes spin    { to { transform: rotate(360deg); } }
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

  .tk-root { font-family: 'DM Sans', system-ui, sans-serif; }

  .tk-card {
    background: ${C.white};
    border-radius: 18px;
    border: 1px solid ${C.grey200};
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease, border-color 0.2s ease;
    animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tk-card::after {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, ${C.red} 0%, transparent 100%);
    opacity: 0; transition: opacity 0.3s; border-radius: 18px 0 0 18px;
  }
  .tk-card:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 20px 50px rgba(0,0,0,0.12), 0 0 0 1px rgba(227,30,36,0.15), 0 4px 12px rgba(227,30,36,0.1);
    border-color: rgba(227,30,36,0.2);
  }
  .tk-card:hover::after { opacity: 1; }
  .tk-card:hover .tk-card-icon  { transform: scale(1.12) rotate(-6deg); }
  .tk-card:hover .tk-card-title { color: ${C.red}; }
  .tk-card-icon  { transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }
  .tk-card-title { transition: color 0.2s ease; }

  .tk-skeleton {
    background: linear-gradient(90deg, ${C.grey100} 25%, ${C.grey50} 50%, ${C.grey100} 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }

  .tk-stat { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease; }
  .tk-stat:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }

  .tk-filter-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
  .tk-filter-btn:hover { transform: translateY(-1px) scale(1.04); }

  .tk-search-wrap:focus-within .tk-search-glow { opacity: 1; transform: scale(1.02); }
  .tk-search-glow {
    position: absolute; inset: -3px; border-radius: 16px;
    background: linear-gradient(135deg, rgba(227,30,36,0.2), rgba(180,20,20,0.1));
    filter: blur(10px); opacity: 0; transform: scale(0.98);
    transition: opacity 0.3s, transform 0.3s; pointer-events: none; z-index: 0;
  }

  .tk-orb-1 { animation: float1 6s ease-in-out infinite; }
  .tk-orb-2 { animation: float2 8s ease-in-out infinite 1s; }
  .tk-orb-3 { animation: float3 5s ease-in-out infinite 2s; }

  .tk-modal-box { animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
  .tk-overlay   { animation: overlayIn 0.2s ease both; }

  @media (max-width: 900px) {
    .tk-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .tk-cards-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ─── useCountUp ─── */
function useCountUp(target, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let startTime = null;
    const tid = setTimeout(() => {
      const step = (ts) => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.round(target * eased));
        if (progress < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(tid); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);
  return count;
}

/* ─── StatCard ─── */
function StatCard({ label, value, Icon, color, delay = 0 }) {
  const animated = useCountUp(value, 1100, delay + 200);
  const gradients = {
    red:   `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
    dark:  `linear-gradient(135deg, ${C.grey900}, ${C.grey700})`,
    green: 'linear-gradient(135deg, #059669, #10b981)',
    blue:  'linear-gradient(135deg, #2563eb, #3b82f6)',
  };
  const shadows = {
    red:   '0 6px 18px rgba(227,30,36,0.35)',
    dark:  '0 6px 18px rgba(0,0,0,0.3)',
    green: '0 6px 18px rgba(16,185,129,0.35)',
    blue:  '0 6px 18px rgba(59,130,246,0.35)',
  };
  return (
    <div className="tk-stat" style={{
      background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.95)', borderRadius: 16,
      padding: '16px 18px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
      animationDelay: `${delay}ms`, animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      <div>
        <p style={{ margin: '0 0 5px', fontSize: 11.5, color: C.grey500, fontWeight: 500 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.grey900, letterSpacing: '-0.8px' }}>
          {animated.toLocaleString('fr-FR')}
        </p>
      </div>
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: gradients[color] || gradients.dark,
        boxShadow: shadows[color] || shadows.dark,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', flexShrink: 0,
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.14) rotate(-9deg)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        <Icon size={20} color="#fff" strokeWidth={1.8} />
      </div>
    </div>
  );
}

/* ─── SkeletonCard ─── */
function SkeletonCard() {
  return (
    <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grey200}`, padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="tk-skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="tk-skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
          <div className="tk-skeleton" style={{ height: 14, width: '60%' }} />
        </div>
      </div>
      <div className="tk-skeleton" style={{ height: 12, width: '100%', marginBottom: 8 }} />
      <div className="tk-skeleton" style={{ height: 12, width: '75%', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="tk-skeleton" style={{ height: 24, width: 70, borderRadius: 20 }} />
        <div className="tk-skeleton" style={{ height: 24, width: 55, borderRadius: 20 }} />
      </div>
    </div>
  );
}

/* ─── EditModal ─── */
function EditModal({ article, onClose, onSaved }) {
  const [solution,    setSolution]    = useState(article.solution || '');
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [uploadError, setUploadError] = useState('');
  const [newFiles,    setNewFiles]    = useState([]);
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef(null);
  const busy = saving || uploading;

  function addFiles(files) {
    setNewFiles(p => [...p, ...Array.from(files)]);
    setUploadError('');
  }

  async function uploadFile(file) {
    const token = localStorage.getItem('token');
    const fd = new FormData(); fd.append('file', file);
    if (article.ticketId) {
      const r = await fetch(`/api/tickets/${article.ticketId}/attachments`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) throw new Error('Upload échoué');
      const u = await r.json();
      await api.patch(`/tickets/${article.ticketId}/solution/attachment/${u.id}`);
      return u;
    } else {
      const r = await fetch(`/api/knowledge/${article.id}/attachments`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) throw new Error('Upload échoué');
      return r.json();
    }
  }

  async function handleSave() {
    if (!solution.trim()) { setError('La solution ne peut pas être vide.'); return; }
    setSaving(true); setError('');
    try {
      await updateArticle(article.id, {
        title: article.title, problem: article.problem,
        solution: solution.trim(), category: article.category, priority: article.priority,
      });
      if (newFiles.length > 0) {
        setUploading(true);
        for (const f of newFiles) {
          try { await uploadFile(f); }
          catch { setUploadError(`Erreur upload : ${f.name}`); }
        }
        setUploading(false);
        await new Promise(r => setTimeout(r, 500));
      }
      try {
        const updated = await getArticle(article.id);
        onSaved(updated.data);
      } catch { onSaved(solution.trim()); }
    } catch { setError('Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); setUploading(false); }
  }

  return (
    <div className="tk-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(8,8,14,0.75)',
      backdropFilter: 'blur(6px)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="tk-modal-box" style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 620,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
      }}>
        {/* Header */}
        <div style={{
          background: HEADER_BG, borderRadius: '24px 24px 0 0', padding: '22px 26px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          <div className="tk-orb-1" style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div className="tk-orb-2" style={{ position: 'absolute', bottom: -30, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Edit2 size={17} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
                Modifier la solution
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
                {article.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
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

        {/* Body */}
        <div style={{ padding: '24px 26px 28px', overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
          {/* Problème */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.grey500,
                        textTransform: 'uppercase', letterSpacing: '0.9px',
                        display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.red, display: 'inline-block' }}/>
              Problème
            </p>
            <div style={{ background: '#fef2f2', borderRadius: 12, padding: '12px 16px', border: '1px solid #fecaca' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#7f1d1d', lineHeight: 1.65 }}>{article.problem}</p>
            </div>
          </div>

          {/* Solution */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.grey500,
                        textTransform: 'uppercase', letterSpacing: '0.9px',
                        display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={11} color="#16a34a" /> Solution *
            </p>
            <textarea value={solution} onChange={e => { setSolution(e.target.value); setError(''); }}
              rows={7} placeholder="Décrivez la solution étape par étape…"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                border: `1.5px solid ${error ? C.red : C.grey200}`,
                fontSize: 13, lineHeight: 1.75, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
                color: C.grey900, background: '#fff', resize: 'vertical',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#22c55e'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; }}
              onBlur={e  => { e.target.style.borderColor = error ? C.red : C.grey200; e.target.style.boxShadow = 'none'; }} />
            {error && <p style={{ margin: '5px 0 0', fontSize: 12, color: C.red }}>{error}</p>}
          </div>

          {/* PJ existantes */}
          {article.solutionAttachments?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: C.grey500,
                          textTransform: 'uppercase', letterSpacing: '0.9px',
                          display: 'flex', alignItems: 'center', gap: 5 }}>
                <Paperclip size={11} color={C.grey500} /> Pièces jointes actuelles
              </p>
              {article.solutionAttachments.map(att => (
                <div key={att.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: '#f0fdf4',
                  borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 6,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#dcfce7',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Paperclip size={13} color="#16a34a" />
                  </div>
                  <p style={{ margin: 0, flex: 1, fontSize: 12, fontWeight: 600, color: '#15803d',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</p>
                  <span style={{ fontSize: 10, color: '#86efac', flexShrink: 0 }}>{att.uploadedBy}</span>
                </div>
              ))}
            </div>
          )}

          {/* Zone upload */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: C.grey500,
                        textTransform: 'uppercase', letterSpacing: '0.9px',
                        display: 'flex', alignItems: 'center', gap: 5 }}>
              <Upload size={11} color={C.grey500} /> Ajouter une pièce jointe
            </p>
            {!article.ticketId && (
              <p style={{ margin: '0 0 10px', fontSize: 11, color: C.grey500,
                          background: C.grey50, padding: '7px 12px', borderRadius: 9,
                          border: `1px solid ${C.grey200}`, display: 'flex', alignItems: 'center', gap: 6 }}>
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
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff1f1',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Paperclip size={13} color={C.red} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#b91c1c',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#fca5a5' }}>{(f.size / 1024).toFixed(0)} Ko · En attente</p>
                    </div>
                    <button onClick={() => setNewFiles(p => p.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                               color: '#fca5a5', padding: 2, display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}
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

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} disabled={busy} style={{
              padding: '10px 22px', borderRadius: 12, border: `1px solid ${C.grey200}`,
              background: '#fff', fontSize: 13, fontWeight: 500, color: C.grey500,
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.grey100; e.currentTarget.style.borderColor = C.grey500; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = C.grey200; }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={busy} style={{
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
               :            <><Save size={14} /> Sauvegarder</>}
            </button>
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
    <div className="tk-card" onClick={() => onView(article)} style={{ animationDelay: `${delay}ms` }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120,
                    background: `radial-gradient(circle at top right, ${C.redGlow} 0%, transparent 70%)`,
                    pointerEvents: 'none', zIndex: 0 }} />
      {article.solutionCommentId && (
        <div style={{ position: 'absolute', top: 14, right: 14, background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
                      borderRadius: 8, padding: '3px 9px', fontSize: 10, fontWeight: 700, color: '#15803d',
                      display: 'flex', alignItems: 'center', gap: 3, border: '1px solid #86efac', zIndex: 2 }}>
          <CheckCircle size={9} /> Épinglée
        </div>
      )}
      <div style={{ padding: '20px 20px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 12 }}>
          <div className="tk-card-icon" style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 18px ${C.redGlow}`,
          }}>
            <BookOpen size={20} color="#fff" />
          </div>
          <p className="tk-card-title" style={{
            margin: 0, fontWeight: 700, fontSize: 14, color: C.grey900,
            lineHeight: 1.45, paddingRight: article.solutionCommentId ? 78 : 0, paddingTop: 2,
          }}>{article.title}</p>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: C.grey500, lineHeight: 1.65,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.problem}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {article.category && (
            <span style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 20, background: '#fff5f5',
                           color: C.red, fontWeight: 600, border: '1px solid #fecaca' }}>{article.category}</span>
          )}
          {article.solutionCommentId && (
            <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 20, background: '#dcfce7',
                           color: '#16a34a', fontWeight: 600, border: '1px solid #bbf7d0',
                           display: 'flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle size={9} /> Solution
            </span>
          )}
          {/* ✅ CHANGEMENT : badge PJ mis à jour */}
          {(article.solutionAttachmentIds?.length > 0 || article.solutionAttachments?.length > 0) && (
            <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 20, background: '#fff5f5',
                           color: C.red, fontWeight: 600, border: `1px solid ${C.red}25`,
                           display: 'flex', alignItems: 'center', gap: 3 }}>
              <Paperclip size={9} /> {Math.max(article.solutionAttachmentIds?.length || 0, article.solutionAttachments?.length || 0)} PJ
            </span>
          )}
          {tags.slice(0, 2).map(t => (
            <span key={t} style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 20,
                                   background: C.grey100, color: C.grey500, fontWeight: 500 }}>{t.trim()}</span>
          ))}
        </div>
      </div>
      <div style={{
        borderTop: `1px solid ${C.grey100}`, padding: '10px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(to bottom, transparent, #fafafa)',
        position: 'relative', zIndex: 1,
      }} onClick={e => e.stopPropagation()}>
        <span style={{ fontSize: 11.5, color: C.grey500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={12} /> {article.views || 0}
          {article.helpful > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <ThumbsUp size={12} /> {article.helpful}
            </span>
          )}
        </span>
        <button onClick={() => onEdit(article)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px',
          height: 30, borderRadius: 9, border: `1px solid ${C.grey200}`,
          background: '#fff', cursor: 'pointer', transition: 'all 0.18s',
          color: C.grey500, fontSize: 11.5, fontWeight: 500, fontFamily: 'inherit',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; e.currentTarget.style.background = '#fff5f5'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.grey200; e.currentTarget.style.color = C.grey500; e.currentTarget.style.background = '#fff'; }}>
          <Edit2 size={12} /> Modifier
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Page principale TechKnowledgePage
   ═══════════════════════════════════════ */
const PAGE_SIZE = 6;
export default function TechKnowledgePage() {
  const [articles,  setArticles]  = useState([]);
  const [query,     setQuery]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [detail,    setDetail]    = useState(null);
  const [editing,   setEditing]   = useState(null);
  const [catFilter, setCatFilter] = useState('');
  const [sortBy,    setSortBy]    = useState('recent');
  const [voted,     setVoted]     = useState({});
  const [focused,   setFocused]   = useState(false);
  const [visible,   setVisible]   = useState(PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = query ? await searchArticles(query) : await getAllArticles();
        setArticles(res.data);
      } finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (articles.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('articleId');
    if (articleId) {
      setTimeout(async () => {
        try { const res = await getArticle(parseInt(articleId)); setDetail(res.data); }
        catch (e) { console.error(e); }
      }, 300);
    }
  }, [articles]);

  const handleVote = async (type) => {
    if (voted[detail.id]) return;
    try {
      await voteArticle(detail.id, type);
      setVoted(v => ({ ...v, [detail.id]: type }));
      setDetail(d => ({
        ...d,
        helpful:    type === 'up'   ? (d.helpful   || 0) + 1 : d.helpful,
        notHelpful: type === 'down' ? (d.notHelpful || 0) + 1 : d.notHelpful,
      }));
    } catch (e) { console.error(e); }
  };

  // Téléchargement PJ ticket (via attachment ID)
  const handleDownloadKB = (attachmentId, fileName, ticketId) => {
    const token = localStorage.getItem('token');
    fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
        URL.revokeObjectURL(a.href);
      }).catch(console.error);
  };

  // Téléchargement PJ manuelle KB (via storedFileName)
  const handleDownloadManual = (storedFileName, originalName, articleId) => {
    const token = localStorage.getItem('token');
    fetch(`/api/knowledge/${articleId}/attachments/${storedFileName}/download`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = originalName;
        a.click();
        URL.revokeObjectURL(a.href);
      }).catch(console.error);
  };

  const handleEditSaved = (updatedArticle) => {
    if (updatedArticle && typeof updatedArticle === 'object') {
      setArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
      if (detail?.id === updatedArticle.id) setDetail(updatedArticle);
    } else {
      setArticles(prev => prev.map(a => a.id === editing.id ? { ...a, solution: updatedArticle } : a));
      if (detail?.id === editing.id) setDetail(d => ({ ...d, solution: updatedArticle }));
    }
    setEditing(null);
  };

  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
  const allFiltered = articles
    .filter(a => !catFilter || a.category === catFilter)
    .sort((a, b) => {
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const displayed = allFiltered.slice(0, visible);
  const hasMore   = visible < allFiltered.length;
  const remaining = allFiltered.length - visible;

  const stats = [
    { label: 'Articles total',      value: articles.length,                                  Icon: BookOpen,    color: 'red'   },
    { label: 'Depuis tickets',      value: articles.filter(a => a.ticketId).length,          Icon: TicketCheck, color: 'dark'  },
    { label: 'Vues totales',        value: articles.reduce((s, a) => s + (a.views || 0), 0), Icon: Eye,         color: 'blue'  },
    { label: 'Solutions épinglées', value: articles.filter(a => a.solutionCommentId).length, Icon: Pin,         color: 'green' },
  ];

  return (
    <TechnicienLayout>
      <style>{GLOBAL_STYLES}</style>
      <div className="tk-root">
        {editing && <EditModal article={editing} onClose={() => setEditing(null)} onSaved={handleEditSaved} />}

        {/* ══ Hero ══ */}
        <div style={{
          borderRadius: 24, marginBottom: 22, position: 'relative', overflow: 'hidden',
          background: HEADER_BG, padding: '32px 36px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <div className="tk-orb-1" style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div className="tk-orb-2" style={{ position: 'absolute', bottom: -50, right: 120, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div className="tk-orb-3" style={{ position: 'absolute', top: 20, right: 200, width: 60, height: 60, borderRadius: '50%', background: 'rgba(227,30,36,0.25)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 6 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <BookOpen size={19} color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>
                Base de connaissances
              </h2>
            </div>
            <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.55)', fontSize: 13.5 }}>
              Consultez et gérez les solutions documentées de votre équipe
            </p>

            {/* Recherche */}
            <div className="tk-search-wrap" style={{ position: 'relative', maxWidth: 520 }}>
              <div className="tk-search-glow" />
              <div style={{
                position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center',
                background: focused ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${focused ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)'}`,
                borderRadius: 14,
                boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.25s',
              }}>
                <Search size={15} style={{ marginLeft: 14, flexShrink: 0 }}
                  color={focused ? '#fff' : 'rgba(255,255,255,0.45)'} />
                <input type="text" placeholder="Rechercher un problème, une solution…"
                  value={query} onChange={e => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  style={{ flex: 1, padding: '13px 12px', background: 'transparent', border: 'none',
                           fontSize: 13.5, outline: 'none', color: '#fff', fontFamily: 'inherit' }} />
                {query && (
                  <button onClick={() => setQuery('')} style={{
                    marginRight: 10, background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.45)', display: 'flex', padding: 2,
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                    <X size={13} />
                  </button>
                )}
              </div>
              {query && !loading && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 10,
                              background: 'rgba(18,18,28,0.97)', border: '1px solid rgba(255,255,255,0.12)',
                              borderRadius: 10, padding: '5px 13px', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, animation: 'glowPulse 1.5s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                    {displayed.length} résultat{displayed.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ Stats ══ */}
        <div className="tk-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 60} />)}
        </div>

        {/* ══ Filtres ══ */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, marginBottom: 20,
          animation: 'fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.2s both',
        }}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
            {['', ...categories].map(c => {
              const active = catFilter === c;
              return (
                <button key={c || 'all'} className="tk-filter-btn" onClick={() => { setCatFilter(c); setVisible(PAGE_SIZE); }}
                  style={{
                    padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
                    border: `1.5px solid ${active ? C.red : C.grey200}`,
                    background: active ? `linear-gradient(135deg,${C.red},${C.redDark})` : '#fff',
                    color: active ? '#fff' : C.grey500,
                    fontSize: 12.5, fontWeight: 600, transition: 'all 0.2s',
                    boxShadow: active ? `0 4px 14px ${C.redGlow}` : 'none', fontFamily: 'inherit',
                  }}>
                  {c || 'Toutes'}
                </button>
              );
            })}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 12, border: `1px solid ${C.grey200}`,
                     fontSize: 12.5, color: C.grey700, background: '#fff', cursor: 'pointer',
                     outline: 'none', fontFamily: 'inherit', fontWeight: 500 }}>
            <option value="recent">⏱ Plus récents</option>
            <option value="views">👁 Plus vus</option>
          </select>
        </div>

        {/* ══ Grille ══ */}
        {loading ? (
          <div className="tk-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : allFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 0', animation: 'fadeSlideUp 0.4s ease both' }}>
            <div style={{ width: 70, height: 70, borderRadius: 20,
                          background: `linear-gradient(135deg,${C.grey100},${C.grey50})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto 16px', border: `1px solid ${C.grey200}` }}>
              <BookOpen size={30} color={C.grey300} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: C.grey700 }}>Aucun résultat</p>
            <p style={{ margin: 0, fontSize: 13.5, color: C.grey500 }}>
              {query ? `Aucun article pour "${query}"` : 'Aucun article disponible'}
            </p>
          </div>
        ) : (
          <>
            <div className="tk-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
              {displayed.map((a, i) => (
                <ArticleCard key={a.id} article={a} delay={i < PAGE_SIZE ? i * 55 : 0}
                  onEdit={art => setEditing(art)} onView={art => setDetail(art)} />
              ))}
            </div>
            {hasMore && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32, gap: 12, animation: 'fadeSlideUp 0.4s ease both' }}>
                <p style={{ margin: 0, fontSize: 12.5, color: C.grey500, fontWeight: 500 }}>
                  Affichage de <strong style={{ color: C.grey700 }}>{displayed.length}</strong> sur <strong style={{ color: C.grey700 }}>{allFiltered.length}</strong> articles
                </p>
                <button onClick={() => setVisible(v => v + PAGE_SIZE)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                           padding: '14px 36px', borderRadius: 16, background: '#fff',
                           border: `1.5px solid ${C.grey200}`, cursor: 'pointer',
                           boxShadow: '0 4px 16px rgba(0,0,0,0.06)', fontFamily: 'inherit',
                           transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.boxShadow = `0 8px 28px ${C.redGlow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.grey200; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = ''; }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.grey900 }}>
                    Afficher {Math.min(PAGE_SIZE, remaining)} articles de plus
                  </span>
                  <ChevronDown size={18} color={C.red} />
                </button>
              </div>
            )}
            {!hasMore && allFiltered.length > PAGE_SIZE && (
              <p style={{ textAlign: 'center', marginTop: 28, fontSize: 12.5, color: C.grey300 }}>
                ✓ Tous les {allFiltered.length} articles affichés
              </p>
            )}
          </>
        )}

        {/* ══ Modal détail ══ */}
        {detail && (
          <div className="tk-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(8,8,14,0.72)',
            backdropFilter: 'blur(6px)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div className="tk-modal-box" style={{
              background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700,
              maxHeight: '92vh', overflowY: 'auto',
              boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
              scrollbarWidth: 'none',
            }}>
              <div style={{ background: HEADER_BG, borderRadius: '24px 24px 0 0', padding: '24px 28px',
                            position: 'relative', overflow: 'hidden' }}>
                <div className="tk-orb-1" style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                  <div style={{ flex: 1 }}>
                    {detail.category && (
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        📁 {detail.category}
                      </span>
                    )}
                    <h2 style={{ margin: '5px 0 0', color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.3 }}>
                      {detail.title}
                    </h2>
                    <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={11} /> {detail.views} vues
                      </span>
                      {detail.createdByName && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Par {detail.createdByName}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => { setEditing(detail); setDetail(null); }} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                      color: '#fff', fontSize: 12, fontWeight: 600, transition: 'background 0.15s', fontFamily: 'inherit',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                      <Edit2 size={12} /> Modifier
                    </button>
                    <button onClick={() => setDetail(null)} style={{
                      width: 34, height: 34, background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
                      cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px 28px 28px' }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.grey500,
                            textTransform: 'uppercase', letterSpacing: '0.9px',
                            display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.red, display: 'inline-block' }}/>
                  Description du problème
                </p>
                <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16, border: '1px solid #fecaca', marginBottom: 22 }}>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: '#7f1d1d' }}>
                    {detail.problem || 'Aucune description disponible'}
                  </p>
                </div>

                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.grey500,
                            textTransform: 'uppercase', letterSpacing: '0.9px',
                            display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={11} color="#16a34a" /> Solution
                </p>
                {detail.solutionComment ? (
                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, border: '1px solid #bbf7d0', marginBottom: 18 }}>
                    <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 700, color: '#16a34a',
                                display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={11} /> SOLUTION OFFICIELLE ÉPINGLÉE
                    </p>
                    <p style={{ margin: '0 0 10px', fontSize: 13.5, lineHeight: 1.7, color: '#166534', whiteSpace: 'pre-wrap' }}>
                      {detail.solutionComment.content}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#86efac' }}>
                      Par {detail.solutionComment.authorName} · {new Date(detail.solutionComment.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ) : (
                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, border: '1px solid #bbf7d0', marginBottom: 18 }}>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: '#166534', whiteSpace: 'pre-wrap' }}>
                      {detail.solution || 'Aucune solution documentée'}
                    </p>
                  </div>
                )}

                {detail.solutionAttachments?.length > 0 && (
                  <div style={{ marginBottom: 22 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: C.grey500,
                                textTransform: 'uppercase', letterSpacing: '0.9px',
                                display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Paperclip size={11} /> Pièces jointes solution
                    </p>
                    {detail.solutionAttachments.map(att => (
                      <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px',
                                                 background: '#f0fdf4', borderRadius: 11, border: '1px solid #bbf7d0', marginBottom: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#dcfce7',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Paperclip size={15} color="#16a34a" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#15803d',
                                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.fileName}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#86efac' }}>
                            Par {att.uploadedBy} · {new Date(att.uploadedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {/* Bouton conditionnel : ticket → par ID, KB manuel → par storedFileName */}
                        {(detail.ticketId || att.storedFileName) && (
                          <button
                            onClick={() => detail.ticketId
                              ? handleDownloadKB(att.id, att.fileName, detail.ticketId)
                              : handleDownloadManual(att.storedFileName, att.fileName, detail.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px',
                              borderRadius: 9, border: '1px solid #86efac', background: '#dcfce7',
                              fontSize: 12, fontWeight: 600, color: '#16a34a', cursor: 'pointer',
                              flexShrink: 0, fontFamily: 'inherit',
                            }}>
                            <Eye size={12} /> Ouvrir
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Vote */}
                <div style={{ background: C.grey50, borderRadius: 12, padding: 16, textAlign: 'center', border: `1px solid ${C.grey200}` }}>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: C.grey500, fontWeight: 500 }}>
                    Cet article vous a-t-il aidé ?
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    {[
                      { type: 'up',   label: `Oui (${detail.helpful    || 0})`, icon: <ThumbsUp   size={14}/>, activeC: '#16a34a', activeBg: '#dcfce7', activeBd: '#22c55e' },
                      { type: 'down', label: `Non (${detail.notHelpful || 0})`, icon: <ThumbsDown size={14}/>, activeC: C.red,     activeBg: '#fef2f2', activeBd: C.red },
                    ].map(btn => (
                      <button key={btn.type} onClick={() => handleVote(btn.type)} disabled={!!voted[detail.id]}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
                          borderRadius: 10, fontSize: 13, fontWeight: 600,
                          background: voted[detail.id] === btn.type ? btn.activeBg : '#fff',
                          color:      voted[detail.id] === btn.type ? btn.activeC  : C.grey500,
                          border:     voted[detail.id] === btn.type ? `1px solid ${btn.activeBd}` : `1px solid ${C.grey200}`,
                          cursor: voted[detail.id] ? 'default' : 'pointer', fontFamily: 'inherit',
                        }}>
                        {btn.icon} {btn.label}
                      </button>
                    ))}
                  </div>
                  {voted[detail.id] && (
                    <p style={{ margin: '10px 0 0', fontSize: 12, color: C.grey500 }}>✓ Merci pour votre retour !</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TechnicienLayout>
  );
}