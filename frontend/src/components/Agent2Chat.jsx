// Agent2Chat.jsx — v19
// CORRECTIONS v19 :
// ✅ Liens externes : pas de scroll horizontal, ExtCard adapte sa largeur
// ✅ Image analysée : message réduit à "Image analysée · <nom>"
// ✅ Tous les fixes v18 conservés

import { useState, useRef, useEffect, useCallback } from "react";

const FLASK_URL  = "/ai";
const RED        = "#E31E24";
const RED_DARK   = "#b81519";
const RED_LIGHT  = "#fff1f1";
const SPRING_URL = "";

function ts()  { return new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}); }
function uid() { return Date.now() + Math.random(); }

const CLOSED_STATUSES = ["CLÔTURÉ","CLOTURE","CLOTURÉ","CLOSED","RÉSOLU","RESOLU","FERMÉ","FERME"];
const isClosed = (s) => CLOSED_STATUSES.includes((s||"").toUpperCase().trim());

const SIMPLE_PATTERNS = [
  { re: /\b(bonjour|bonsoir|salut|hello|hi|coucou|hey)\b/i,         reply: "Bonjour ! Comment puis-je vous aider sur ce ticket ?" },
  { re: /\b(merci|thank(s| you)|bravo|nickel|super|parfait)\b/i,    reply: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions." },
  { re: /\b(ok|d'accord|compris|reçu|entendu)\b/i,                  reply: "Parfait. Faites-moi signe si vous avez besoin d'autre chose." },
  { re: /\b(au revoir|bonne journée|bonne soirée|bye|ciao)\b/i,     reply: "Bonne continuation ! Je reste disponible." },
  { re: /^\?+$/,                                                      reply: "Vous avez une question ? Décrivez le problème, je vous aide." },
];

function detectSimpleMessage(text) {
  const t = (text||"").trim();
  if (t.split(/\s+/).length > 6) return null;
  for (const { re, reply } of SIMPLE_PATTERNS) {
    if (re.test(t)) return reply;
  }
  return null;
}

const STATUS_LABELS = {
  thinking:      "Analyse de la question…",
  searching:     "Recherche dans la KB interne…",
  searching_web: "Recherche sur sources externes…",
  generating:    "Rédaction de la réponse…",
  reading_image: "Lecture de l'image…",
};

/* CSS */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@keyframes a2spin  { to{transform:rotate(360deg)} }
@keyframes a2up    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes a2in    { from{opacity:0} to{opacity:1} }
@keyframes a2slide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes a2blink { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes a2dot   { 0%,80%,100%{transform:translateY(0);opacity:.3} 40%{transform:translateY(-5px);opacity:1} }
@keyframes a2bob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }
@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
@keyframes a2imgpulse { 0%,100%{opacity:1} 50%{opacity:.55} }

.a2w *        { box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; }
.a2w          { font-family:'Inter',system-ui,sans-serif; }
.a2-msg       { animation:a2up .2s ease forwards; }
.a2-dot       { display:inline-block;width:7px;height:7px;border-radius:50%;background:${RED};animation:a2dot 1.2s infinite ease-in-out; }
.a2-dot:nth-child(2){ animation-delay:.15s; }
.a2-dot:nth-child(3){ animation-delay:.3s; }
.a2-cursor    { display:inline-block;width:2px;height:14px;background:${RED};margin-left:2px;vertical-align:middle;animation:a2blink .7s step-end infinite;border-radius:1px; }
.a2-scroll::-webkit-scrollbar      { width:5px; }
.a2-scroll::-webkit-scrollbar-track{ background:transparent; }
.a2-scroll::-webkit-scrollbar-thumb{ background:#c8d3e0;border-radius:4px; }
.a2-scroll::-webkit-scrollbar-thumb:hover{ background:#94a3b8; }
.a2-kbcard:hover { background:${RED_LIGHT}!important;border-color:${RED}!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(227,30,36,.12)!important; }
.a2-extcard:hover{ box-shadow:0 4px 12px rgba(0,0,0,.08)!important; }
.a2-qbtn:hover   { background:${RED_LIGHT}!important;border-color:${RED}!important;color:${RED}!important; }
.a2-rst:hover    { background:rgba(255,255,255,.22)!important;border-color:rgba(255,255,255,.5)!important; }
.a2-extbtn:hover { background:#fffbeb!important;border-color:#f59e0b!important; }
.a2-inp:focus    { border-color:${RED}!important;box-shadow:0 0 0 3px rgba(227,30,36,.08)!important;outline:none; }
.a2-send:hover:not(:disabled){ background:${RED_DARK}!important;transform:scale(1.05);box-shadow:0 4px 16px rgba(227,30,36,.4)!important; }
.a2-send        { transition:all .15s ease; }
.a2-stop:hover  { background:#fef2f2!important;border-color:#fca5a5!important; }
.a2-mclose:hover{ background:rgba(255,255,255,.2)!important; }
.a2-scrollbtn   { animation:a2bob 1.5s infinite ease-in-out; }
.a2-scrollbtn:hover{ animation:none;transform:scale(1.1)!important; }
.a2-lightbox{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;animation:a2in .18s ease;cursor:zoom-out;backdrop-filter:blur(6px);}
.a2-lightbox img{max-width:min(90vw,900px);max-height:88vh;border-radius:10px;box-shadow:0 24px 64px rgba(0,0,0,.5);object-fit:contain;cursor:default;animation:a2slide .22s ease;}
.a2-lightbox-close{position:fixed;top:18px;right:22px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;transition:background .15s;}
.a2-lightbox-close:hover{background:rgba(255,255,255,.28);}
.a2-plus-btn    { transition:all .15s ease; }
.a2-plus-btn:hover:not(:disabled) { background:${RED_LIGHT}!important;border-color:${RED}!important;color:${RED}!important;transform:scale(1.08); }
.a2-plus-menu   { animation:a2up .15s ease forwards; }
.a2-plus-item:hover { background:#f1f5f9!important; }
.a2-preview-chip { animation:a2up .15s ease forwards; }
.a2-img-reading { animation:a2imgpulse 1.4s ease-in-out infinite; }

/* FIX v19: ExtCard — pas de débordement horizontal */
.a2-extcard { overflow:hidden; word-break:break-word; }
.a2-extcard a { word-break:break-all; }

@media (max-width: 640px) {
  .a2-kbcard { padding: 8px 10px !important; }
  .a2w { border-radius: 0 !important; }
}
`;

/* ICÔNES */
const Ic = {
  Bot:    (p={})=><svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="11" width="18" height="11" rx="3"/><path d="M12 2v4" strokeLinecap="round"/><path d="M8 11V8a4 4 0 018 0v3"/><circle cx="9" cy="16" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="16" r="1.2" fill="currentColor" stroke="none"/></svg>,
  Send:   (p={})=><svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
  Stop:   (p={})=><svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>,
  Spin:   (p={})=><svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" style={{animation:"a2spin 1s linear infinite"}}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} style={{opacity:.2}}/><path fill="currentColor" style={{opacity:.8}} d="M4 12a8 8 0 018-8v8H4z"/></svg>,
  Reset:  (p={})=><svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 109-9H3" strokeLinecap="round"/><path d="M3 3v6h6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Globe:  (p={})=><svg width={p.s||12} height={p.s||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" strokeLinecap="round"/></svg>,
  Book:   (p={})=><svg width={p.s||12} height={p.s||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  Link:   (p={})=><svg width={p.s||11} height={p.s||11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round"/><polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round"/><line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round"/></svg>,
  Copy:   (p={})=><svg width={p.s||11} height={p.s||11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  X:      (p={})=><svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:  (p={})=><svg width={p.s||11} height={p.s||11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Warn:   (p={})=><svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/></svg>,
  Hist:   (p={})=><svg width={p.s||10} height={p.s||10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Lock:   (p={})=><svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/></svg>,
  Eye:    (p={})=><svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  User:   (p={})=><svg width={p.s||12} height={p.s||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Ticket: (p={})=><svg width={p.s||12} height={p.s||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M2 9a3 3 0 010-6h20a3 3 0 010 6"/><path d="M2 15a3 3 0 000 6h20a3 3 0 000-6"/><path d="M6 9v6"/><path d="M18 9v6"/></svg>,
  SO:     ()=><svg viewBox="0 0 24 24" fill="#f48024" width={13} height={13}><path d="M17.36 20.2v-5.38h1.79V22H3v-7.18h1.8v5.38zM6.77 14.32l.37-1.76 8.79 1.85-.37 1.76zm1.16-4.21l.76-1.61 8.14 3.78-.76 1.62zm2.26-3.99l1.15-1.38 6.9 5.76-1.15 1.37zM15.17 3l1.34-1 5.12 6.8-1.34 1.01zM6.6 18.51v-1.8h8.98v1.8z"/></svg>,
  MS:     ()=><svg viewBox="0 0 24 24" width={13} height={13}><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="13" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="13" width="10" height="10" fill="#00a4ef"/><rect x="13" y="13" width="10" height="10" fill="#ffb900"/></svg>,
  SU:     ()=><svg viewBox="0 0 24 24" fill="#bcbbbb" width={13} height={13}><path d="M15 2H9v2h6V2zm-6 4v2h6V6H9zm-2 4v10h10V10H7zm8 8H9v-6h6v6z"/></svg>,
  Paperclip: (p={})=><svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  File:   (p={})=><svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Img:    (p={})=><svg width={p.s||13} height={p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Camera: (p={})=><svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4"/></svg>,
  Plus:   (p={})=><svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/></svg>,
};

const ALLOWED_TYPES = [
  "image/png","image/jpeg","image/gif","image/webp",
  "application/pdf","text/plain","text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json","text/xml","application/xml",
];
const ALLOWED_IMAGE_TYPES = ["image/png","image/jpeg","image/gif","image/webp"];
const MAX_SIZE_MB = 10;

const SRC_CFG = {
  kb_interne:     {label:"KB Interne",    icon:<Ic.Book/>, color:RED,       bg:RED_LIGHT,  border:"#fecaca"},
  stack_overflow: {label:"Stack Overflow",icon:<Ic.SO/>,   color:"#f48024", bg:"#fff7ed",  border:"#fed7aa"},
  superuser:      {label:"Super User",    icon:<Ic.SU/>,   color:"#6b7280", bg:"#f9fafb",  border:"#e5e7eb"},
  microsoft_docs: {label:"Microsoft Docs",icon:<Ic.MS/>,   color:"#0078d4", bg:"#eff6ff",  border:"#bfdbfe"},
  tavily_web:     {label:"Web (Tavily)",  icon:<Ic.Globe/>,color:"#0ea5e9", bg:"#f0f9ff",  border:"#bae6fd"},
  serverfault:    {label:"Server Fault",  icon:<Ic.Globe/>,color:"#ef8236", bg:"#fff7ed",  border:"#fed7aa"},
  spiceworks:     {label:"Spiceworks",    icon:<Ic.Globe/>,color:"#6366f1", bg:"#eef2ff",  border:"#c7d2fe"},
};
const srcCfg = t => SRC_CFG[t]||{label:t||"Web",icon:<Ic.Globe/>,color:"#6b7280",bg:"#f9fafb",border:"#e5e7eb"};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} Ko`;
  return `${(bytes/1024/1024).toFixed(1)} Mo`;
}

/* Lightbox */
function Lightbox({ src, name, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key==="Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="a2-lightbox" onClick={onClose}>
      <img src={src} alt={name} onClick={e=>e.stopPropagation()}/>
      <button className="a2-lightbox-close" onClick={onClose}><Ic.X s={16}/></button>
      {name&&<div style={{position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",fontSize:12,color:"rgba(255,255,255,.55)",background:"rgba(0,0,0,.4)",padding:"5px 14px",borderRadius:20,pointerEvents:"none"}}>{name}</div>}
    </div>
  );
}

/* PlusButton */
function PlusButton({ onImagePick, onFilePick, disabled }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const imgRef  = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pickImage = () => { setOpen(false); imgRef.current?.click(); };
  const pickFile  = () => { setOpen(false); fileRef.current?.click(); };
  const handleImg  = (e) => { if(e.target.files?.length) { onImagePick([...e.target.files]); e.target.value=""; } };
  const handleFile = (e) => { if(e.target.files?.length) { onFilePick([...e.target.files]);  e.target.value=""; } };

  return (
    <div ref={menuRef} style={{position:"relative",flexShrink:0}}>
      <input ref={imgRef}  type="file" multiple accept={ALLOWED_IMAGE_TYPES.join(",")} style={{display:"none"}} onChange={handleImg}/>
      <input ref={fileRef} type="file" multiple accept={ALLOWED_TYPES.join(",")}       style={{display:"none"}} onChange={handleFile}/>
      <button className="a2-plus-btn" disabled={disabled} onClick={()=>!disabled&&setOpen(o=>!o)} style={{width:38,height:38,borderRadius:11,flexShrink:0,border:"1.5px solid #e2e8f0",background:open?RED_LIGHT:"#f8fafc",color:open?RED:"#64748b",cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 3px rgba(0,0,0,.06)",opacity:disabled?.45:1}}>
        <Ic.Plus s={16}/>
      </button>
      {open&&(
        <div className="a2-plus-menu" style={{position:"absolute",bottom:"calc(100% + 8px)",left:0,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,boxShadow:"0 8px 28px rgba(0,0,0,.12)",overflow:"hidden",minWidth:190,zIndex:50}}>
          <button className="a2-plus-item" onClick={pickImage} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#374151",fontWeight:500,textAlign:"left"}}>
            <span style={{width:28,height:28,borderRadius:8,background:RED_LIGHT,border:`1.5px solid #fecaca`,display:"flex",alignItems:"center",justifyContent:"center",color:RED,flexShrink:0}}><Ic.Camera s={13}/></span>
            <div><p style={{margin:0,fontSize:12.5,fontWeight:600,color:"#1e293b"}}>Joindre une image</p><p style={{margin:0,fontSize:10,color:"#94a3b8"}}>PNG, JPG, GIF, WebP</p></div>
          </button>
          <div style={{height:1,background:"#f1f5f9",margin:"0 10px"}}/>
          <button className="a2-plus-item" onClick={pickFile} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#374151",fontWeight:500,textAlign:"left"}}>
            <span style={{width:28,height:28,borderRadius:8,background:"#f0f9ff",border:"1.5px solid #bae6fd",display:"flex",alignItems:"center",justifyContent:"center",color:"#0ea5e9",flexShrink:0}}><Ic.Paperclip s={13}/></span>
            <div><p style={{margin:0,fontSize:12.5,fontWeight:600,color:"#1e293b"}}>Joindre un fichier</p><p style={{margin:0,fontSize:10,color:"#94a3b8"}}>PDF, DOCX, CSV, JSON…</p></div>
          </button>
        </div>
      )}
    </div>
  );
}

/* PendingAttachments */
function PendingAttachments({ items, onRemove, onImageClick }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"8px 12px",background:"#f8fafc",borderRadius:10,border:"1.5px solid #e2e8f0",marginBottom:6,animation:"a2up .15s ease forwards"}}>
      {items.map(item => {
        const isImg = item.file.type.startsWith("image/");
        const objectUrl = isImg ? URL.createObjectURL(item.file) : null;
        return (
          <div key={item.id} style={{position:"relative",display:"flex",alignItems:"center",gap:6,padding:isImg?"3px 8px 3px 3px":"5px 8px",borderRadius:8,background:"#fff",border:`1.5px solid ${isImg?"#fecaca":"#e2e8f0"}`,maxWidth:180}}>
            {isImg&&objectUrl?(
              <img src={objectUrl} alt={item.file.name} onClick={()=>onImageClick?.(objectUrl,item.file.name)} style={{width:32,height:32,objectFit:"cover",borderRadius:5,border:"1px solid #e2e8f0",flexShrink:0,cursor:"zoom-in"}}/>
            ):(
              <span style={{width:28,height:28,borderRadius:6,background:"#f0f9ff",border:"1.5px solid #bae6fd",display:"flex",alignItems:"center",justifyContent:"center",color:"#0ea5e9",flexShrink:0}}><Ic.File s={13}/></span>
            )}
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:11,fontWeight:600,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>{item.file.name}</p>
              <p style={{margin:0,fontSize:9.5,color:"#94a3b8"}}>{formatSize(item.file.size)}</p>
            </div>
            <button onClick={()=>onRemove(item.id)} style={{position:"absolute",top:-5,right:-5,width:16,height:16,borderRadius:"50%",background:"#ef4444",border:"1.5px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",padding:0}}><Ic.X s={8}/></button>
          </div>
        );
      })}
      <div style={{alignSelf:"center",fontSize:10,color:"#94a3b8",fontStyle:"italic",paddingLeft:2}}>{items.length} fichier{items.length>1?"s":""} · Cliquez Envoyer pour joindre</div>
    </div>
  );
}

/* KbModal */
function KbModal({ article, onClose }) {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    if (article.kb_id) {
      const token = localStorage.getItem("token")||localStorage.getItem("accessToken")||"";
      const tryFetch = (url) => fetch(url,{headers:{Authorization:`Bearer ${token}`}});
      tryFetch(`${SPRING_URL}/api/knowledge/${article.kb_id}`)
        .then(r=>r.ok?r.json():tryFetch(`${SPRING_URL}/api/admin/knowledge-articles/${article.kb_id}`))
        .then(r=>r&&r.ok!==false?(r.json?r.json():r):null)
        .then(data=>{if(data&&typeof data==="object")setDetail(data);setLoading(false);})
        .catch(()=>setLoading(false));
    } else setLoading(false);
    return () => { document.body.style.overflow = ""; };
  }, [article.kb_id]);

  const pct = article.score ? Math.round(article.score*100) : 0;
  const d = detail||{};

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(15,23,42,.5)",backdropFilter:"blur(5px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"a2in .18s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:580,borderRadius:22,background:"#fff",border:"1px solid #e5e7eb",boxShadow:"0 32px 64px rgba(0,0,0,.16)",overflow:"hidden",animation:"a2slide .22s ease",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
        <div style={{background:"linear-gradient(135deg,#1a1a1a 0%,#E31E24 100%)",borderRadius:"22px 22px 0 0",padding:"22px 26px",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:0}}>
              {pct>0&&<span style={{fontSize:10,color:"rgba(255,255,255,.4)",background:"rgba(255,255,255,.1)",padding:"2px 8px",borderRadius:20}}>{pct}% pertinent</span>}
              <h2 style={{margin:"6px 0 0",color:"#fff",fontSize:18,fontWeight:700,lineHeight:1.3}}>{d.title||article.title||"Article KB"}</h2>
            </div>
            <button className="a2-mclose" onClick={onClose} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.22)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,.7)",flexShrink:0,marginLeft:12}}><Ic.X s={14}/></button>
          </div>
        </div>
        <div className="a2-scroll" style={{overflowY:"auto",padding:"22px 26px",flex:1}}>
          {loading?(
            <div style={{display:"flex",justifyContent:"center",padding:"30px 0"}}><div style={{width:28,height:28,border:`3px solid ${RED_LIGHT}`,borderTopColor:RED,borderRadius:"50%",animation:"a2spin .8s linear infinite"}}/></div>
          ):(
            <>
              {(d.problem||article.preview?.includes("Problème"))&&(
                <div style={{marginBottom:16}}>
                  <p style={{margin:"0 0 8px",fontSize:10,fontWeight:700,color:"#dc2626",textTransform:"uppercase",letterSpacing:".07em"}}>🔴 Problème</p>
                  <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"13px 16px"}}>
                    <p style={{margin:0,fontSize:13,color:"#7f1d1d",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{d.problem||article.preview?.split("✅ Solution")[0].replace("🔴 Problème :\n","").trim()}</p>
                  </div>
                </div>
              )}
              {(d.solution||article.preview?.includes("Solution"))&&(
                <div>
                  <p style={{margin:"0 0 8px",fontSize:10,fontWeight:700,color:"#16a34a",textTransform:"uppercase",letterSpacing:".07em"}}>✅ Solution</p>
                  <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"13px 16px"}}>
                    <p style={{margin:0,fontSize:13,color:"#166534",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{d.solution||article.preview?.split("✅ Solution :\n")[1]?.trim()}</p>
                  </div>
                </div>
              )}
              {!d.problem&&!d.solution&&article.preview&&(
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"13px 16px"}}>
                  <p style={{margin:0,fontSize:13,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{article.preview}</p>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{padding:"14px 26px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end",background:"#fafafa",flexShrink:0}}>
          <button onClick={onClose} style={{padding:"8px 18px",borderRadius:10,border:"1px solid #e5e7eb",background:"#fff",fontSize:13,fontWeight:500,color:"#6b7280",cursor:"pointer"}}>Fermer</button>
          <a href={`/tech/knowledge?articleId=${article.kb_id}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:10,background:"linear-gradient(135deg,#1a1a1a,#E31E24)",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}><Ic.Link s={11}/>Ouvrir dans la KB</a>
        </div>
      </div>
    </div>
  );
}

/* Markdown */
function parseBlocks(text) {
  if (!text) return [];
  const blocks=[]; let inCode=false,codeLines=[],codeLang="";
  text.split("\n").forEach((ln,i) => {
    if (ln.startsWith("```")) {
      if (inCode) { blocks.push({t:"code",content:codeLines.join("\n"),lang:codeLang,k:i}); codeLines=[]; codeLang=""; inCode=false; }
      else { codeLang=ln.slice(3).trim(); inCode=true; } return;
    }
    if (inCode) { codeLines.push(ln); return; }
    if (/^#{1,3} /.test(ln))     blocks.push({t:"h",content:ln.replace(/^#{1,3} /,""),k:i});
    else if (/^\d+\. /.test(ln)) blocks.push({t:"step",content:ln.replace(/^\d+\. /,""),num:ln.match(/^(\d+)/)[1],k:i});
    else if (/^[-•*] /.test(ln)) blocks.push({t:"li",content:ln.replace(/^[-•*] /,""),k:i});
    else if (ln.trim()==="")     blocks.push({t:"br",k:i});
    else                         blocks.push({t:"p",content:ln,k:i});
  });
  return blocks;
}

function Inline({t=""}) {
  const clean = t.replace(/\[([^\]]+)\]\([^)]+\)/g,"$1");
  return <>{clean.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p,i) => {
    if (p.startsWith("**")&&p.endsWith("**")) return <strong key={i} style={{color:"#111827",fontWeight:700}}>{p.slice(2,-2)}</strong>;
    if (p.startsWith("`")&&p.endsWith("`"))   return <code key={i} style={{background:"#f1f5f9",color:RED,padding:"1px 6px",borderRadius:5,fontSize:11.5,fontFamily:"JetBrains Mono,monospace",border:"1px solid #e2e8f0"}}>{p.slice(1,-1)}</code>;
    return <span key={i}>{p}</span>;
  })}</>;
}

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={()=>{navigator.clipboard.writeText(text);setOk(true);setTimeout(()=>setOk(false),2000);}} style={{background:"none",border:"none",color:ok?"#16a34a":"#94a3b8",cursor:"pointer",display:"flex",alignItems:"center",gap:3,fontSize:11,padding:"2px 6px",borderRadius:5}}>
      {ok?<Ic.Check s={11}/>:<Ic.Copy s={11}/>}{ok?"Copié":"Copier"}
    </button>
  );
}

function Blocks({ text, streaming=false }) {
  const blocks = parseBlocks(text);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {blocks.map((b,bi) => {
        const last=bi===blocks.length-1, cur=last&&streaming?<span className="a2-cursor"/>:null;
        switch(b.t) {
          case"code": return (
            <div key={b.k} style={{margin:"6px 0",borderRadius:10,overflow:"hidden",border:"1px solid #e2e8f0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 12px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                <span style={{fontSize:11,color:"#64748b",fontFamily:"JetBrains Mono,monospace"}}>{b.lang||"code"}</span>
                <CopyBtn text={b.content}/>
              </div>
              <pre style={{background:"#1e293b",padding:"12px 14px",margin:0,fontSize:12,color:"#7ee787",overflowX:"auto",fontFamily:"JetBrains Mono,monospace",lineHeight:1.65}}><code>{b.content}</code></pre>
            </div>
          );
          case"h":    return <p key={b.k} style={{margin:"10px 0 3px",fontSize:14,fontWeight:700,color:"#111827"}}><Inline t={b.content}/>{cur}</p>;
          case"step": return (
            <div key={b.k} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"3px 0"}}>
              <span style={{flexShrink:0,width:22,height:22,borderRadius:7,background:RED_LIGHT,border:`1.5px solid #fecaca`,color:RED,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>{b.num}</span>
              <span style={{lineHeight:1.7,fontSize:13,paddingTop:2,color:"#374151"}}><Inline t={b.content}/>{cur}</span>
            </div>
          );
          case"li":   return (
            <div key={b.k} style={{display:"flex",gap:9,alignItems:"flex-start",padding:"2px 0"}}>
              <span style={{flexShrink:0,width:6,height:6,borderRadius:"50%",background:RED,marginTop:9,opacity:.55}}/>
              <span style={{fontSize:13,lineHeight:1.7,color:"#374151"}}><Inline t={b.content}/>{cur}</span>
            </div>
          );
          case"br":   return <div key={b.k} style={{height:4}}/>;
          default:    return <p key={b.k} style={{margin:0,lineHeight:1.7,fontSize:13,color:"#374151"}}><Inline t={b.content}/>{cur}</p>;
        }
      })}
      {streaming&&blocks.length===0&&<span className="a2-cursor"/>}
    </div>
  );
}

/* KbCard */
function KbCard({ src, onOpen }) {
  const pct = src.score ? Math.round(src.score*100) : 0;
  return (
    <div className="a2-kbcard" onClick={()=>onOpen(src)} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 13px",borderRadius:12,background:"#fff",border:"1.5px solid #f1f5f9",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.05)",transition:"all .18s ease"}}>
      <div style={{width:34,height:34,borderRadius:10,background:RED_LIGHT,border:`1.5px solid #fecaca`,display:"flex",alignItems:"center",justifyContent:"center",color:RED,flexShrink:0}}><Ic.Book s={15}/></div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
          <span style={{fontSize:9.5,fontWeight:700,color:RED,textTransform:"uppercase",letterSpacing:".06em",background:RED_LIGHT,padding:"2px 8px",borderRadius:20,border:`1px solid #fecaca`}}>KB Interne</span>
          {pct>0&&<span style={{fontSize:10,fontWeight:600,color:pct>75?"#16a34a":pct>50?RED:"#d97706"}}>{pct}%</span>}
        </div>
        <p style={{margin:0,fontSize:13,fontWeight:600,color:"#111827",lineHeight:1.4}}>{src.title||"Article KB"}</p>
        {src.preview&&<p style={{margin:"4px 0 0",fontSize:11.5,color:"#94a3b8",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{src.preview}</p>}
      </div>
      <div style={{color:"#cbd5e1",flexShrink:0,marginTop:8,display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:10,color:"#94a3b8"}}>Voir</span><Ic.Link s={10}/></div>
    </div>
  );
}

/* FIX v19 : ExtCard */
function ExtCard({ src }) {
  const cfg = srcCfg(src.type || src.source);
  const [exp, setExp] = useState(false);
  const hasContent = src.content && src.content.length > 15;
  const validUrl   = src.url && src.url.startsWith("http");

  const displayUrl = (() => {
    if (!validUrl) return "";
    try {
      const u = new URL(src.url);
      const path = (u.pathname + u.search).substring(0, 35);
      return u.hostname + (path.length > 1 ? path : "") + (src.url.length > 50 ? "…" : "");
    } catch { return src.url.substring(0, 45) + (src.url.length > 45 ? "…" : ""); }
  })();

  return (
    <div className="a2-extcard" style={{borderRadius:12,border:`1.5px solid ${cfg.border}`,background:cfg.bg,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)",transition:"all .18s ease",minWidth:0,width:"100%"}}>
      <div style={{padding:"10px 12px",display:"flex",alignItems:"flex-start",gap:9,minWidth:0}}>
        <div style={{width:30,height:30,borderRadius:8,background:"#fff",border:`1.5px solid ${cfg.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{cfg.icon}</div>
        <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
            <span style={{fontSize:9,fontWeight:700,color:cfg.color,textTransform:"uppercase",letterSpacing:".06em",background:"rgba(255,255,255,.8)",padding:"1px 7px",borderRadius:20,border:`1px solid ${cfg.border}`,whiteSpace:"nowrap"}}>{cfg.label}</span>
          </div>
          <p style={{margin:0,fontSize:12.5,fontWeight:600,color:"#111827",lineHeight:1.4,wordBreak:"break-word"}}>{src.title || "Source externe"}</p>
          {src.tags&&src.tags.length>0&&<div style={{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}}>{src.tags.slice(0,3).map((t,i)=><span key={i} style={{fontSize:9.5,padding:"1px 6px",borderRadius:20,background:"rgba(255,255,255,.8)",color:"#64748b",border:`1px solid ${cfg.border}`}}>{t}</span>)}</div>}
          {hasContent&&(
            <div style={{marginTop:6}}>
              <p style={{margin:0,fontSize:11.5,color:"#64748b",lineHeight:1.55,overflow:exp?"visible":"hidden",display:exp?"block":"-webkit-box",WebkitLineClamp:exp?undefined:2,WebkitBoxOrient:"vertical",wordBreak:"break-word"}}>{src.content}</p>
              {src.content.length>100&&<button onClick={()=>setExp(!exp)} style={{background:"none",border:"none",fontSize:11,color:cfg.color,cursor:"pointer",padding:"2px 0",fontWeight:600}}>{exp?"↑ Réduire":"↓ Voir plus"}</button>}
            </div>
          )}
        </div>
      </div>
      {validUrl&&(
        <div style={{borderTop:`1px solid ${cfg.border}`,padding:"7px 12px",display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.6)",minWidth:0,overflow:"hidden"}}>
          <span style={{fontSize:10,color:"#94a3b8",fontFamily:"JetBrains Mono,monospace",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>
            {displayUrl}
          </span>
          <a href={src.url} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,fontSize:11.5,fontWeight:600,background:cfg.color,color:"#fff",textDecoration:"none",flexShrink:0,whiteSpace:"nowrap"}}>
            <Ic.Link s={10}/>Consulter
          </a>
        </div>
      )}
    </div>
  );
}

function KbSection({ sources, onOpenKb }) {
  const kb = (sources||[]).filter(s=>s.type==="kb_interne");
  if (!kb.length) return null;
  return (
    <div style={{marginTop:10,minWidth:0,width:"100%"}}>
      <p style={{margin:"0 0 7px",fontSize:10,fontWeight:700,color:RED,textTransform:"uppercase",letterSpacing:".06em",display:"flex",alignItems:"center",gap:5}}><Ic.Book s={10}/>{kb.length} article{kb.length>1?"s":""} KB — cliquez pour le détail</p>
      <div style={{display:"flex",flexDirection:"column",gap:6,minWidth:0}}>{kb.map((s,i)=><KbCard key={i} src={s} onOpen={onOpenKb}/>)}</div>
    </div>
  );
}

function ExtSection({ sources }) {
  const ext = (sources||[]).filter(s => s.type !== "kb_interne" && s.url?.startsWith("http"));
  if (!ext.length) return null;
  return (
    <div style={{marginTop:10,minWidth:0,width:"100%"}}>
      <p style={{margin:"0 0 7px",fontSize:10,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:".06em",display:"flex",alignItems:"center",gap:5}}>
        <Ic.Globe s={10}/>{ext.length} source{ext.length>1?"s":""} externe{ext.length>1?"s":""}
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:6,minWidth:0,width:"100%"}}>{ext.map((s,i)=><ExtCard key={i} src={s}/>)}</div>
    </div>
  );
}

/* Typing */
function Typing({ label }) {
  return (
    <div className="a2-msg" style={{display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#1a1a1a,#E31E24)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0,boxShadow:"0 2px 8px rgba(227,30,36,.25)"}}><Ic.Bot s={16}/></div>
      <div style={{borderRadius:"4px 14px 14px 14px",padding:"12px 16px",background:"#fff",border:"1.5px solid #f1f5f9",boxShadow:"0 2px 8px rgba(0,0,0,.06)",display:"flex",alignItems:"center",gap:10,minWidth:180}}>
        <span className="a2-dot"/><span className="a2-dot"/><span className="a2-dot"/>
        <span style={{fontSize:11.5,color:"#94a3b8",marginLeft:4}}>{label||"Typing..."}</span>
      </div>
    </div>
  );
}

/* CopyFullBtn */
function CopyFullBtn({ text }) {
  const [ok, setOk] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch { const el=document.createElement("textarea"); el.value=text; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setOk(true); setTimeout(()=>setOk(false),2500);
  };
  return (
    <button onClick={handleCopy} style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:ok?"#f0fdf4":"#f8fafc",border:`1.5px solid ${ok?"#bbf7d0":"#e2e8f0"}`,color:ok?"#16a34a":"#94a3b8",fontSize:11,fontWeight:500,cursor:"pointer",transition:"all .2s ease"}}>
      {ok?<Ic.Check s={10}/>:<Ic.Copy s={10}/>}{ok?"Copié !":"Copier la réponse"}
    </button>
  );
}

/* BUBBLE */
function Bubble({ msg, showKb=true, onExternal, extLoading, onOpenKb, onOpenImage, onRetry, isMobile=false }) {
  const isAgent  = msg.role==="agent";
  const kbSrcs   = (msg.sources||[]).filter(s=>s.type==="kb_interne");
  const extSrcs  = (msg.sources||[]).filter(s=>s.type!=="kb_interne"&&s.url?.startsWith("http"));
  const isHorsIT = msg.phase==="hors_it";
  const kbEmpty  = msg.phase==="kb"&&kbSrcs.length===0&&!msg.streaming&&!isHorsIT;

  if (msg.role==="system" && msg.type==="reading_image") {
    return (
      <div className="a2-msg" style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#1a1a1a,#E31E24)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}><Ic.Bot s={16}/></div>
        <div style={{borderRadius:"4px 14px 14px 14px",padding:"9px 14px",background:"#fff",border:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:8}}>
          <span className="a2-dot"/><span className="a2-dot"/><span className="a2-dot"/>
          <span style={{fontSize:11.5,color:"#94a3b8"}}>Lecture image…</span>
        </div>
      </div>
    );
  }

  if (msg.role==="system" && msg.type==="image_confirm") {
    return (
      <div className="a2-msg" style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#1a1a1a,#E31E24)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}><Ic.Bot s={16}/></div>
        <div style={{borderRadius:"4px 14px 14px 14px",padding:"7px 13px",background:"#f0fdf4",border:"1.5px solid #bbf7d0",display:"flex",alignItems:"center",gap:8,maxWidth:320}}>
          {msg.previewUrl&&(
            <img src={msg.previewUrl} alt={msg.filename} onClick={()=>onOpenImage?.(msg.previewUrl,msg.filename)}
              style={{width:28,height:28,objectFit:"cover",borderRadius:6,border:"1px solid #bbf7d0",flexShrink:0,cursor:"zoom-in"}}/>
          )}
          <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0}}>
            <Ic.Check s={11}/>
            <span style={{fontSize:12,fontWeight:600,color:"#16a34a",whiteSpace:"nowrap"}}>Image analysée</span>
            {msg.filename&&<span style={{fontSize:11,color:"#4ade80",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>· {msg.filename}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (msg.role==="system") {
    return (
      <div className="a2-msg" style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#1a1a1a,#E31E24)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}><Ic.Bot s={16}/></div>
        <div style={{borderRadius:"4px 14px 14px 14px",padding:"10px 14px",background:"#f0fdf4",border:"1.5px solid #bbf7d0",display:"flex",alignItems:"flex-start",gap:9,maxWidth:"100%"}}>
          <Ic.Paperclip s={13}/>
          <span style={{fontSize:12.5,lineHeight:1.65,color:"#166534",whiteSpace:"pre-wrap"}}>{msg.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="a2-msg" style={{display:"flex",gap:10,alignItems:"flex-start",flexDirection:isAgent?"row":"row-reverse",minWidth:0}}>
      <div style={{width:34,height:34,borderRadius:10,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:isAgent?"linear-gradient(135deg,#1a1a1a,#E31E24)":"linear-gradient(135deg,#e2e8f0,#cbd5e1)",color:isAgent?"#fff":"#64748b",fontSize:11,fontWeight:700,marginTop:2,boxShadow:isAgent?"0 2px 8px rgba(227,30,36,.2)":"0 1px 4px rgba(0,0,0,.08)"}}>
        {isAgent?<Ic.Bot s={16}/>:"T"}
      </div>

      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",alignItems:isAgent?"flex-start":"flex-end"}}>
        <div style={{borderRadius:isAgent?"4px 14px 14px 14px":"14px 4px 14px 14px",padding:"12px 15px",background:isAgent?"#fff":`linear-gradient(135deg,${RED},${RED_DARK})`,border:isAgent?"1.5px solid #f1f5f9":"none",color:isAgent?"#374151":"#fff",boxShadow:isAgent?"0 2px 8px rgba(0,0,0,.06)":`0 4px 16px rgba(227,30,36,.22)`,maxWidth:isMobile?"95%":"84%",wordBreak:"break-word"}}>
          {isAgent
            ?<Blocks text={msg.content} streaming={msg.streaming}/>
            :<span style={{fontSize:13,lineHeight:1.65}}>{msg.content}</span>
          }
        </div>

        {isAgent&&msg.interrupted&&!msg.streaming&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:5,padding:"3px 10px",borderRadius:20,background:"#fef2f2",border:"1px solid #fecaca",fontSize:11,color:"#dc2626",fontWeight:600}}>
            <Ic.Stop s={10}/> Réponse interrompue
          </div>
        )}

        {msg.role==="technician"&&msg.attachments&&msg.attachments.length>0&&(
          <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:5,justifyContent:"flex-end"}}>
            {msg.attachments.map((att,i) => (
              att.isImage ? (
                <div key={i} onClick={()=>onOpenImage?.(att.objectUrl,att.name)} style={{borderRadius:10,overflow:"hidden",border:"2px solid rgba(227,30,36,.25)",cursor:"zoom-in"}}>
                  <img src={att.objectUrl} alt={att.name} style={{display:"block",maxWidth:180,maxHeight:140,objectFit:"cover"}}/>
                </div>
              ) : (
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)"}}>
                  <Ic.File s={11}/><span style={{fontSize:11,color:"#fff",fontWeight:500}}>{att.name}</span>
                </div>
              )
            ))}
          </div>
        )}

        {isAgent&&!msg.streaming&&showKb&&kbSrcs.length>0&&!isHorsIT&&<KbSection sources={msg.sources} onOpenKb={onOpenKb}/>}

        {isAgent&&!msg.streaming&&extSrcs.length>0&&(
          <div style={{width:"100%",minWidth:0,overflow:"hidden"}}>
            <ExtSection sources={msg.sources}/>
          </div>
        )}

        {isAgent&&msg.autoExt&&!msg.streaming&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,marginBottom:4,padding:"4px 10px",borderRadius:20,background:"#fffbeb",border:"1.5px solid #fed7aa",fontSize:11,color:"#92400e",fontWeight:600}}>
            <Ic.Globe s={10}/>KB insuffisante — sources externes consultées automatiquement
          </div>
        )}

        {isAgent&&kbEmpty&&onExternal&&(
          <div style={{marginTop:10,padding:"12px 14px",borderRadius:12,background:"#fffbeb",border:"1.5px solid #fed7aa",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><Ic.Warn s={14}/><span style={{fontSize:12,fontWeight:700,color:"#92400e"}}>Aucun article KB pertinent</span></div>
            <span style={{fontSize:11.5,color:"#b45309"}}>Lancer une recherche sur Stack Overflow, Microsoft Docs…?</span>
            <button className="a2-extbtn" disabled={extLoading} onClick={()=>onExternal(msg.questionAsked)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:9,fontSize:12,fontWeight:600,background:"#fff",border:"1.5px solid #fed7aa",color:"#92400e",cursor:"pointer",width:"fit-content",opacity:extLoading?.6:1,transition:"all .15s"}}>
              {extLoading?<Ic.Spin s={12}/>:<Ic.Globe s={12}/>}{extLoading?"Recherche…":"Chercher en externe"}
            </button>
          </div>
        )}

        {isAgent&&!kbEmpty&&!isHorsIT&&msg.canExt&&!msg.streaming&&!msg.extDone&&onExternal&&(
          <button className="a2-extbtn" disabled={extLoading} onClick={()=>onExternal(msg.questionAsked)} style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:9,fontSize:12,fontWeight:600,background:"#fff",border:"1.5px solid #fed7aa",color:"#92400e",cursor:"pointer",opacity:extLoading?.6:1,transition:"all .15s"}}>
            {extLoading?<Ic.Spin s={12}/>:<Ic.Globe s={12}/>}{extLoading?"Recherche…":"Insatisfait ? Chercher en externe"}
          </button>
        )}

        {isAgent&&!msg.streaming&&msg.content&&msg.content.length>10&&(
          <CopyFullBtn text={msg.content}/>
        )}

        {isAgent&&msg.isError&&onRetry&&(
          <button onClick={()=>onRetry()} style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:9,background:"#fff",border:"1.5px solid #fecaca",color:"#dc2626",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            <Ic.Reset s={12}/> Réessayer
          </button>
        )}

        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:5}}>
          <span style={{fontSize:10,color:"#cbd5e1"}}>{msg.time}</span>
          {isAgent&&msg.responseMs&&(
            <span style={{fontSize:9.5,color:"#94a3b8",display:"flex",alignItems:"center",gap:3,background:"#f1f5f9",padding:"1px 7px",borderRadius:20,border:"1px solid #e2e8f0"}}>
              ⚡ {msg.responseMs<1000?`${msg.responseMs}ms`:`${(msg.responseMs/1000).toFixed(1)}s`}
            </span>
          )}
          {isAgent&&msg.stats&&!msg.streaming&&!isHorsIT&&(
            <span style={{fontSize:10,color:"#94a3b8",display:"flex",gap:8}}>
              {msg.stats.kb_hits>0&&<span style={{display:"flex",alignItems:"center",gap:3}}><Ic.Book s={9}/>{msg.stats.kb_hits} art. KB</span>}
              {msg.stats.ext_hits>0&&<span style={{color:"#f59e0b",display:"flex",alignItems:"center",gap:3}}><Ic.Globe s={9}/>{msg.stats.ext_hits} ext.</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL — Agent2Chat v19
═══════════════════════════════════════════════════════════ */
export default function Agent2Chat({ incident, readOnly = false }) {
  const incidentId   = incident?.id;
  const ticketClosed = isClosed(incident?.status||incident?.statut||incident?.state||"");

  const makeWelcome = () => ({
    id:uid(), role:"agent", time:ts(), sources:[],
    content: ticketClosed
      ? `Bonjour ! Je suis **Agent 2**.\n\nIncident **"${incident?.title||"en cours"}"** — ticket clôturé.\n\nL'historique est consultable ci-dessous.`
      : readOnly
        ? `Bonjour ! Je suis **Agent 2**.\n\nVous consultez **"${incident?.title||"en cours"}"** en mode **lecture seule**.`
        : `Bonjour ! Je suis **Agent 2**, votre assistant IT expert.\n\nIncident : **"${incident?.title||"en cours"}"**\n\n1. Je cherche d'abord dans la **KB interne** (top 3 articles)\n2. Si KB insuffisant → **recherche externe** sur demande`,
  });

  const [msgs,         setMsgs]        = useState([makeWelcome()]);
  const [input,        setInput]        = useState("");
  const [status,       setStatus]       = useState("idle");
  const [streaming,    setStreaming]     = useState(false);
  const [extLoading,   setExtLoading]   = useState(false);
  const [showTyping,   setShowTyping]   = useState(false);
  const [typingLabel,  setTypingLabel]  = useState("Typing...");
  const [error,        setError]        = useState(null);
  const [lastAid,      setLastAid]      = useState(null);
  const [kbModal,      setKbModal]      = useState(null);
  const [histLoading,  setHistLoading]  = useState(true);
  const [showScrollBtn,setShowScrollBtn]= useState(false);
  const [lightbox,     setLightbox]     = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [retryQuestion,setRetryQuestion]= useState(null);
  const [showQuick,    setShowQuick]    = useState(true);
  const [globalDragging,setGlobalDragging]=useState(false);
  const [isMobile,     setIsMobile]     = useState(false);
  const [resetModal,   setResetModal]   = useState(false);

  const scrollRef      = useRef(null);
  const inputRef       = useRef(null);
  const userScrolled   = useRef(false);
  const abortRef       = useRef(null);
  const streamStartRef = useRef(null);
  const histLoadedRef  = useRef(false);

  const isInputDisabled = readOnly || ticketClosed;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handlePlusFiles = useCallback((rawFiles) => {
    if (readOnly) return;
    const newItems = [];
    for (const f of rawFiles) {
      const err = !ALLOWED_TYPES.includes(f.type)
        ? `Type non supporté : ${f.type||f.name}`
        : f.size > MAX_SIZE_MB*1024*1024 ? `Trop volumineux (max ${MAX_SIZE_MB} Mo)` : null;
      if (err) { setError(err); continue; }
      newItems.push({ id:uid(), file:f, name:f.name, isImage:f.type.startsWith("image/"), objectUrl:f.type.startsWith("image/")?URL.createObjectURL(f):null });
    }
    if (newItems.length > 0) setPendingFiles(prev => [...prev,...newItems]);
  }, [readOnly]);

  const removePendingFile = useCallback((id) => {
    setPendingFiles(prev => {
      const item = prev.find(x=>x.id===id);
      if (item?.objectUrl) URL.revokeObjectURL(item.objectUrl);
      return prev.filter(x=>x.id!==id);
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const {scrollTop,scrollHeight,clientHeight} = scrollRef.current;
    const dist = scrollHeight-scrollTop-clientHeight;
    userScrolled.current = dist>100;
    setShowScrollBtn(dist>200);
  }, []);

  const scrollToBottom = useCallback((force=false) => {
    if (!scrollRef.current) return;
    if (force||!userScrolled.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(true); }, [msgs, showTyping, histLoading]);
  useEffect(() => {
    if (status==="idle") { userScrolled.current=false; return; }
    const iv = setInterval(() => scrollToBottom(false), 100);
    return () => clearInterval(iv);
  }, [status, scrollToBottom]);
  useEffect(() => { if (!isInputDisabled) inputRef.current?.focus(); }, [isInputDisabled]);

  useEffect(() => {
    if (!incidentId || histLoadedRef.current) { setHistLoading(false); return; }
    histLoadedRef.current = true;

    fetch(`${FLASK_URL}/agent2/history/${incidentId}`)
      .then(r=>r.ok?r.json():null)
      .then(data => {
        const turns = data?.turns||[];
        if (!turns.length) { setHistLoading(false); return; }
        const rebuilt = [makeWelcome()];
        rebuilt.push({id:uid(),role:"agent",time:"",sources:[],isSeparator:true,content:"Conversation précédente"});
        for (const turn of turns) {
          const sources = (()=>{try{return JSON.parse(turn.kb_sources||"[]")||[];}catch{return [];}})();
          const kbS=sources.filter(s=>s.type==="kb_interne");
          const extS=sources.filter(s=>s.type!=="kb_interne"&&s.url?.startsWith("http"));
          const phase=extS.length>0?"ext":kbS.length>0?"kb":null;
          rebuilt.push({id:uid(),role:turn.role==="technician"?"technician":"agent",content:turn.content||"",time:turn.created_at?new Date(turn.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):ts(),sources,phase,stats:phase?{kb_hits:kbS.length,ext_hits:extS.length,phase}:null,canExt:false,extDone:true});
        }
        setMsgs(rebuilt); setHistLoading(false);
      })
      .catch(() => setHistLoading(false));
  // eslint-disable-next-line
  }, [incidentId]);

  const stopAgent = useCallback(async () => {
    abortRef.current?.abort();
    if (incidentId) {
      try { await fetch(`${FLASK_URL}/agent2/interrupt/${incidentId}`,{method:"POST"}); } catch(_) {}
    }
    setStreaming(false); setExtLoading(false); setShowTyping(false); setStatus("idle");
    setMsgs(prev => {
      const last = [...prev].reverse().find(m=>m.role==="agent"&&m.streaming);
      if (!last) return prev;
      return prev.map(m=>m.id===last.id ? {...m,streaming:false,interrupted:true} : m);
    });
  }, [incidentId]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key==="Escape"&&(streaming||extLoading)) { stopAgent(); return; }
      if ((e.ctrlKey||e.metaKey)&&e.key==="k") { e.preventDefault(); if(!isInputDisabled) inputRef.current?.focus(); }
      if ((e.ctrlKey||e.metaKey)&&e.key==="/") { e.preventDefault(); setShowQuick(p=>!p); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [streaming, extLoading, isInputDisabled, stopAgent]);

  const callFlask = useCallback(async (question, isExt) => {
    if (readOnly) return;
    const agentId = uid();
    setTypingLabel("Typing..."); setStatus("searching"); setShowTyping(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let sources=[], stats=null, phase="kb", canExt=false, firstToken=false;
    streamStartRef.current = null;

    try {
      const resp = await fetch(`${FLASK_URL}/agent2/chat/stream`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        signal: ctrl.signal,
        body: JSON.stringify({
          incident_id:     incidentId,
          question,
          category:        incident?.category||"",
          search_external: isExt,
          incident: {title:incident?.title||"",description:incident?.description||"",category:incident?.category||""},
        }),
      });
      if (!resp.ok) throw new Error(`Flask HTTP ${resp.status}`);

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        buf += decoder.decode(value,{stream:true});
        const lines = buf.split("\n"); buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim(); if (!raw) continue;
          let ev; try { ev=JSON.parse(raw); } catch { continue; }

          if (ev.type==="status") {
            const label = STATUS_LABELS[ev.status] || ev.message || "En cours…";
            setTypingLabel(label);
            const nextStatus = ev.status==="searching"||ev.status==="thinking" ? "searching"
              : ev.status==="searching_web" ? "ext_searching" : "generating";
            setStatus(nextStatus);
          }

          if (ev.type==="meta") {
            phase = ev.phase||"kb";
            if (isExt||phase==="ext") {
              const prevKb = msgs.find(m=>m.id===lastAid)?.sources?.filter(s=>s.type==="kb_interne")||[];
              sources=[...prevKb,...(ev.ext_sources||[]).map(s=>({...s,type:s.source||s.type||"external"}))];
              canExt=false; setStatus("ext_searching");
            } else {
              sources=(ev.kb_sources||[]).map(s=>({...s,type:"kb_interne"}));
              canExt=!!ev.can_search_external; setStatus("generating");
            }
            stats=ev.stats;
          }

          if (ev.type==="token"&&ev.content) {
            if (!firstToken) {
              firstToken=true;
              streamStartRef.current = Date.now();
              setShowTyping(false);
              const newMsg={id:agentId,role:"agent",content:"",streaming:true,time:ts(),sources,stats,phase,canExt:isExt?false:canExt,extDone:isExt,questionAsked:question,interrupted:false,autoExt:stats?.auto_ext===true};
              setMsgs(prev=>isExt?[...prev,newMsg]:[...prev.map(m=>({...m,canExt:false})),newMsg]);
            }
            setMsgs(prev=>prev.map(m=>m.id===agentId?{...m,content:m.content+ev.content}:m));
          }

          if (ev.type==="done"||ev.type==="interrupted") {
            const wasInterrupted = ev.type==="interrupted";
            const responseMs = streamStartRef.current ? Date.now()-streamStartRef.current : null;
            setMsgs(prev=>prev.map(m=>m.id===agentId
              ?{...m,content:ev.answer||m.content,streaming:false,sources,stats,phase,canExt:!isExt&&canExt,extDone:isExt,questionAsked:question,interrupted:wasInterrupted,responseMs,autoExt:stats?.auto_ext===true}
              :m));
            setShowTyping(false); setStatus("idle");
            if (!isExt) setLastAid(agentId);
          }

          if (ev.type==="error") throw new Error(ev.message);
        }
      }
      if (!firstToken) throw new Error("Aucune réponse — Ollama démarré ?");
    } catch(e) {
      if (e.name==="AbortError") return;
      setShowTyping(false); setStatus("idle");
      setRetryQuestion(question);
      setMsgs(prev=>[...prev,{id:agentId,role:"agent",content:`⚠️ **Erreur de connexion**\n\n${e.message}\n\nVérifiez :\n1. Flask port 5002 démarré ?\n2. \`ollama serve\` lancé ?`,streaming:false,time:ts(),sources:[],isError:true}]);
      setError(e.message);
    }
  }, [incident, incidentId, lastAid, msgs, readOnly]);

  const send = useCallback(async (qOverride=null, isExt=false) => {
    if (readOnly || ticketClosed) return;
    const q = (qOverride||input).trim();
    if ((!q&&pendingFiles.length===0)||streaming||extLoading||histLoading) return;
    setError(null);

    if (!isExt) {
      setInput("");
      const filesToSend = [...pendingFiles];
      setPendingFiles([]);

      const simpleReply = !filesToSend.length ? detectSimpleMessage(q) : null;
      if (simpleReply) {
        const userMsg = {id:uid(),role:"technician",content:q,attachments:[],time:ts(),sources:[]};
        setMsgs(prev=>[...prev.map(m=>({...m,canExt:false})),userMsg]);
        await new Promise(r=>setTimeout(r,30));
        setMsgs(prev=>[...prev,{id:uid(),role:"agent",content:simpleReply,streaming:false,time:ts(),sources:[],stats:null,phase:"direct",canExt:false,extDone:false,questionAsked:q}]);
        return;
      }

      const userMsg = {id:uid(),role:"technician",content:q,attachments:filesToSend,time:ts(),sources:[]};
      setMsgs(prev=>[...prev.map(m=>({...m,canExt:false})),userMsg]);
      setStreaming(true);

      if (filesToSend.length > 0) {
        for (const att of filesToSend) {
          const isImg = att.isImage;
          const readingId = uid();
          if (isImg) {
            setMsgs(prev=>[...prev,{id:readingId,role:"system",type:"reading_image",filename:att.name,previewUrl:att.objectUrl,time:ts(),sources:[]}]);
          }
          try {
            const fd = new FormData();
            fd.append("file", att.file);
            fd.append("incident_id", incidentId||"");
            const resp = await fetch(`${FLASK_URL}/agent2/upload-attachment`,{method:"POST",body:fd});
            if (resp.ok) {
              const data = await resp.json();
              if (isImg) {
                setMsgs(prev=>prev.map(m=>m.id===readingId
                  ?{...m,type:"image_confirm",previewUrl:att.objectUrl}
                  :m));
              } else if (data.preview) {
                setMsgs(prev=>prev.map(m=>m.id===readingId?{...m,type:undefined,content:`📎 Fichier analysé : ${data.filename||att.name}\n${data.preview}`}:m));
              }
            }
          } catch(_) {
            if (isImg) setMsgs(prev=>prev.map(m=>m.id===readingId?{...m,type:undefined,content:`⚠️ Impossible d'analyser ${att.name}`}:m));
          }
        }
      }
    } else {
      setExtLoading(true);
    }

    const effectiveQ = q || (pendingFiles.length>0?`[Fichier joint : ${pendingFiles.map(f=>f.name).join(", ")}]`:"");
    await callFlask(effectiveQ||q, isExt);
    setStreaming(false); setExtLoading(false);
    abortRef.current = null;
    inputRef.current?.focus();
  }, [input, pendingFiles, streaming, extLoading, histLoading, callFlask, ticketClosed, incidentId, readOnly]);

  const reset = useCallback(() => {
    if (ticketClosed || readOnly) return;
    setResetModal(true);
  }, [ticketClosed, readOnly]);

  const confirmReset = useCallback(async () => {
    setResetModal(false);
    try { await fetch(`${FLASK_URL}/agent2/reset/${incidentId}`,{method:"DELETE"}); } catch(_) {}
    histLoadedRef.current = false;
    setMsgs([makeWelcome()]); setError(null); setLastAid(null);
    setStreaming(false); setExtLoading(false); setShowTyping(false); setKbModal(null);
    setPendingFiles([]); setStatus("idle"); setRetryQuestion(null);
  }, [incidentId, ticketClosed, readOnly]);

  const busy    = streaming||extLoading;
  const canSend = !readOnly && !busy && !histLoading && (input.trim().length > 0 || pendingFiles.length > 0);
  const QUICK   = ["Causes possibles ?","Diagnostic étape par étape","Commandes de diagnostic","Solution rapide ?"];

  const msgsWithKbFlag = msgs.map((m,idx) => {
    if (m.role!=="agent"||m.isSeparator) return {...m,showKb:false};
    const kbSrcs = (m.sources||[]).filter(s=>s.type==="kb_interne");
    if (!kbSrcs.length) return {...m,showKb:false};
    const prevWithKb = msgs.slice(0,idx).reverse().find(p=>p.role==="agent"&&(p.sources||[]).filter(s=>s.type==="kb_interne").length>0);
    if (!prevWithKb) return {...m,showKb:true};
    const prevIds = (prevWithKb.sources||[]).filter(s=>s.type==="kb_interne").map(s=>s.kb_id).sort().join(",");
    const currIds = kbSrcs.map(s=>s.kb_id).sort().join(",");
    return {...m,showKb:currIds!==prevIds};
  });

  return (
    <>
      <style>{CSS}</style>
      {kbModal&&<KbModal article={kbModal} onClose={()=>setKbModal(null)}/>}
      {lightbox&&<Lightbox src={lightbox.src} name={lightbox.name} onClose={()=>setLightbox(null)}/>}
      {resetModal && (
        <div onClick={() => setResetModal(false)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(15,23,42,.5)",backdropFilter:"blur(5px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"a2in .18s ease"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:380,borderRadius:22,background:"#fff",border:"1px solid #e5e7eb",boxShadow:"0 32px 64px rgba(0,0,0,.16)",overflow:"hidden",animation:"a2slide .22s ease"}}>
            <div style={{padding:"22px 26px 0"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}>
                <div style={{width:46,height:46,borderRadius:14,background:"#fff1f1",border:"1.5px solid #fecaca",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Ic.Reset s={20}/>
                </div>
                <div>
                  <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:700,color:"#111827"}}>Réinitialiser la conversation ?</h3>
                  <p style={{margin:0,fontSize:11,color:"#9ca3af"}}>Cette action est irréversible</p>
                </div>
              </div>
              <p style={{margin:"0 0 20px",fontSize:13,color:"#4b5563",lineHeight:1.6}}>
                L'historique sera <strong style={{color:"#111827"}}>définitivement supprimé</strong>. Vous ne pourrez pas récupérer les échanges précédents.
              </p>
            </div>
            <div style={{padding:"14px 26px 20px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,background:"#fafafa"}}>
              <button onClick={()=>setResetModal(false)} style={{flex:1,padding:"9px 0",borderRadius:11,border:"1.5px solid #e5e7eb",background:"#fff",fontSize:13,fontWeight:600,color:"#6b7280",cursor:"pointer"}}>
                Annuler
              </button>
              <button onClick={confirmReset} style={{flex:1,padding:"9px 0",borderRadius:11,border:"none",background:"linear-gradient(135deg,#1a1a1a,#E31E24)",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <Ic.Reset s={12}/> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="a2w"
        style={{display:"flex",flexDirection:"column",height:"100%",background:"#f0f4f8",borderRadius:18,overflow:"hidden",border:"1.5px solid #dde3ed",boxShadow:"0 4px 24px rgba(0,0,0,.08)",position:"relative"}}
        onDragOver={e=>{if(readOnly||ticketClosed)return;e.preventDefault();setGlobalDragging(true);}}
        onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setGlobalDragging(false);}}
        onDrop={e=>{e.preventDefault();setGlobalDragging(false);if(readOnly||ticketClosed)return;const files=[...e.dataTransfer.files];if(files.length>0)handlePlusFiles(files);}}
      >

        {globalDragging&&!readOnly&&!ticketClosed&&(
          <div style={{position:"absolute",inset:0,zIndex:100,background:"rgba(227,30,36,.08)",border:`3px dashed ${RED}`,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,backdropFilter:"blur(2px)",pointerEvents:"none",animation:"a2in .15s ease"}}>
            <div style={{width:64,height:64,borderRadius:18,background:RED_LIGHT,border:`2px solid ${RED}`,display:"flex",alignItems:"center",justifyContent:"center",color:RED}}><Ic.Paperclip s={28}/></div>
            <p style={{margin:0,fontSize:16,fontWeight:700,color:RED}}>Déposer ici pour analyser</p>
            <p style={{margin:0,fontSize:12,color:"#94a3b8"}}>Images, PDF, DOCX, logs…</p>
          </div>
        )}

        {/* HEADER */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 17px",background:"linear-gradient(135deg,#1a1a1a 0%,#E31E24 100%)",flexShrink:0,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,right:0,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,.07)",transform:"translate(30%,-30%)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:11,position:"relative"}}>
            <div style={{width:38,height:38,borderRadius:11,background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>
              {(ticketClosed||readOnly)?<Ic.Lock s={16}/>:<Ic.Bot s={18}/>}
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,fontWeight:700,color:"#fff",letterSpacing:"-0.2px"}}>Agent 2 — Expert IT</span>
                {readOnly&&!ticketClosed&&(
                  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,backgroundColor:"rgba(255,255,255,.15)",color:"#fef3c7",border:"1px solid rgba(255,255,255,.25)"}}>
                    <Ic.Lock s={9}/> Lecture seule
                  </span>
                )}
              </div>
              {ticketClosed
                ?<div style={{fontSize:10.5,color:"rgba(255,255,255,.6)",marginTop:1,display:"flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,borderRadius:"50%",background:"#94a3b8",display:"inline-block"}}/>Lecture seule</div>
                :histLoading
                  ?<div style={{fontSize:10.5,color:"rgba(255,255,255,.6)",marginTop:1}}>Chargement…</div>
                  :readOnly
                    ?<div style={{fontSize:10.5,color:"rgba(255,255,255,.6)",marginTop:1}}>Ticket traité par un autre technicien</div>
                    :null
              }
            </div>
          </div>
          {!ticketClosed&&!readOnly&&(
            <button className="a2-rst" onClick={reset} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid rgba(255,255,255,.25)",background:"rgba(255,255,255,.12)",color:"rgba(255,255,255,.8)",fontSize:11.5,fontWeight:500,cursor:"pointer",transition:"all .15s"}}>
              <Ic.Reset s={12}/>Reset
            </button>
          )}
        </div>

        {readOnly&&!ticketClosed&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 17px",backgroundColor:"#fff7ed",borderBottom:"1px solid #fed7aa",fontSize:12,color:"#92400e",fontWeight:500,flexShrink:0}}>
            <Ic.Eye s={14}/><span>Ce ticket est traité par un autre technicien. Consultation en <strong>lecture seule</strong>.</span>
          </div>
        )}

        {ticketClosed&&(
          <div style={{padding:"9px 17px",background:"#fff7ed",borderBottom:"1px solid #fed7aa",display:"flex",alignItems:"center",gap:8,fontSize:11.5,color:"#92400e",flexShrink:0}}>
            <Ic.Lock s={13}/><span><strong>Ticket clôturé</strong> — conversation archivée en lecture seule.</span>
          </div>
        )}

        {/* MESSAGES */}
        <div ref={scrollRef} onScroll={handleScroll} className="a2-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"18px 15px",display:"flex",flexDirection:"column",gap:14,background:"linear-gradient(180deg,#f0f4f8 0%,#f8fafc 100%)"}}>
          {histLoading?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",flex:1,gap:10,color:"#94a3b8",fontSize:13}}><Ic.Spin s={16}/>Chargement de la conversation…</div>
          ):(
            msgsWithKbFlag.map(m=>(
              m.isSeparator?(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"4px 0"}}>
                  <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
                  <span style={{fontSize:10,color:"#94a3b8",display:"flex",alignItems:"center",gap:4,flexShrink:0}}><Ic.Hist s={10}/>{m.content}</span>
                  <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
                </div>
              ):(
                <Bubble key={m.id} msg={m}
                  showKb={m.showKb}
                  onExternal={!readOnly&&!ticketClosed&&!m.streaming?(q)=>send(q,true):null}
                  extLoading={extLoading}
                  onOpenKb={setKbModal}
                  onOpenImage={(src,name)=>setLightbox({src,name})}
                  onRetry={m.isError&&retryQuestion?()=>{setRetryQuestion(null);send(retryQuestion,false);}:null}
                  isMobile={isMobile}
                />
              )
            ))
          )}
          {showTyping&&<Typing label={typingLabel}/>}
          <div style={{height:1}}/>
        </div>

        {showScrollBtn&&(
          <div style={{position:"absolute",bottom:isInputDisabled?90:busy?170:125,right:18,zIndex:10}}>
            <button className="a2-scrollbtn" onClick={()=>{userScrolled.current=false;scrollToBottom(true);setShowScrollBtn(false);}} style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,#1a1a1a,${RED})`,border:"2px solid rgba(255,255,255,.3)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px rgba(227,30,36,.35)`}}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}

        {/* Suggestions rapides */}
        {!readOnly&&!ticketClosed&&!histLoading&&(
          <div style={{padding:showQuick&&msgs.length>1?"8px 15px 10px":"4px 15px",background:"#eef2f7",borderTop:"1px solid #dde3ed",flexShrink:0}}>
            {msgs.length>1&&(
              <button onClick={()=>setShowQuick(p=>!p)} style={{background:"none",border:"none",fontSize:10.5,color:showQuick?RED:"#94a3b8",cursor:"pointer",padding:"2px 0",marginBottom:showQuick?6:0,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
                {showQuick?"▲ Masquer les suggestions":"▼ Suggestions rapides"}
              </button>
            )}
            {(showQuick||msgs.length<=1)&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {QUICK.map(q=>(
                  <button key={q} className="a2-qbtn" onClick={()=>{setInput(q);inputRef.current?.focus();}} style={{fontSize:12,padding:"6px 13px",borderRadius:20,background:"#fff",border:"1.5px solid #dde3ed",color:"#475569",cursor:"pointer",transition:"all .15s",fontWeight:500,boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ZONE SAISIE */}
        <div style={{padding:"10px 14px 12px",background:"#fff",borderTop:"1.5px solid #dde3ed",flexShrink:0}}>
          {readOnly&&!ticketClosed?(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:"#f3f4f6",border:"1.5px solid #e5e7eb"}}>
              <Ic.Lock s={14}/><span style={{fontSize:13,color:"#9ca3af",fontStyle:"italic"}}>Messagerie désactivée — ce ticket n'est pas assigné à vous</span>
            </div>
          ):ticketClosed?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 14px",borderRadius:10,background:"#f8fafc",border:"1px solid #e2e8f0"}}>
              <Ic.Lock s={13}/><span style={{fontSize:12,color:"#94a3b8",fontStyle:"italic"}}>Ticket clôturé — l'assistant ne peut plus être sollicité</span>
            </div>
          ):(
            <>
              {error&&(
                <div style={{marginBottom:8,padding:"8px 12px",borderRadius:9,background:"#fef2f2",border:"1px solid #fecaca",fontSize:11.5,color:"#dc2626",display:"flex",alignItems:"center",gap:8}}>
                  <span>⚠ {error}</span>
                  <button onClick={()=>setError(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",padding:0,marginLeft:"auto",display:"flex"}}><Ic.X s={12}/></button>
                </div>
              )}

              <PendingAttachments items={pendingFiles} onRemove={removePendingFile} onImageClick={(src,name)=>setLightbox({src,name})}/>

              <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                <PlusButton disabled={busy||histLoading} onImagePick={handlePlusFiles} onFilePick={handlePlusFiles}/>

                <div style={{flex:1,position:"relative",minWidth:0}}>
                  <textarea
                    ref={inputRef}
                    rows={isMobile?3:2}
                    value={input}
                    onChange={e=>{if(e.target.value.length<=500)setInput(e.target.value);}}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                    className="a2-inp"
                    placeholder={histLoading?"Chargement…":pendingFiles.length>0?`${pendingFiles.length} fichier(s) joint(s) · Ajoutez un message ou envoyez…`:"Posez votre question technique… (Entrée pour envoyer)"}
                    disabled={busy||histLoading}
                    style={{width:"100%",borderRadius:11,padding:"9px 13px",background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#374151",fontSize:13,resize:"none",outline:"none",fontFamily:"'Inter',sans-serif",lineHeight:1.55,transition:"border-color .15s,box-shadow .15s",opacity:busy||histLoading?.6:1}}
                  />
                  {input.length>200&&(
                    <div style={{position:"absolute",bottom:5,right:8,fontSize:9.5,color:input.length>450?"#dc2626":input.length>300?"#f59e0b":"#cbd5e1",pointerEvents:"none"}}>
                      {input.length}/500
                    </div>
                  )}
                </div>

                {busy?(
                  <button className="a2-stop" onClick={stopAgent} title="Interrompre" style={{height:40,padding:"0 14px",borderRadius:11,flexShrink:0,display:"flex",alignItems:"center",gap:6,border:`1.5px solid #fecaca`,background:"#fef2f2",color:"#dc2626",cursor:"pointer",fontSize:12,fontWeight:600}}>
                    <Ic.Stop s={12}/> Stop
                  </button>
                ):(
                  <button className="a2-send" onClick={()=>send()} disabled={!canSend} style={{width:40,height:40,borderRadius:11,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",border:"none",background:!canSend?"#e2e8f0":`linear-gradient(135deg,#1a1a1a,${RED})`,color:!canSend?"#94a3b8":"#fff",cursor:!canSend?"not-allowed":"pointer",boxShadow:!canSend?"none":`0 3px 12px rgba(227,30,36,.3)`,position:"relative"}}>
                    <Ic.Send s={14}/>
                    {pendingFiles.length>0&&<span style={{position:"absolute",top:-5,right:-5,width:16,height:16,borderRadius:"50%",background:RED,border:"2px solid #fff",fontSize:9,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{pendingFiles.length}</span>}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}