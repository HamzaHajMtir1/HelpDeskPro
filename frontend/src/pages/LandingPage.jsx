import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import axios from 'axios';
import {
  ArrowRight, Mail, Phone, Building, User, Send,
  AlertCircle, CheckCircle, Loader2, ChevronRight
} from 'lucide-react';
import { useToast } from '../components/Toast';

const API_BASE = 'https://helpdesk.4d-gile.com';
const RED      = '#E31E24';
const RED_DARK = '#b81519';

/* ═══════════════════════════════════════════
   SVG ILLUSTRATIONS — Personnages stylisés
═══════════════════════════════════════════ */

// Personnage client (bleu)
function ClientFigure({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {/* Corps */}
      <circle cx="36" cy="20" r="13" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2"/>
      <circle cx="36" cy="20" r="8" fill="#3b82f6"/>
      {/* Visage */}
      <circle cx="33" cy="19" r="1.5" fill="white"/>
      <circle cx="39" cy="19" r="1.5" fill="white"/>
      <path d="M33 23 Q36 26 39 23" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Corps en bas */}
      <path d="M20 50 Q20 38 36 38 Q52 38 52 50" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2"/>
      {/* Ordinateur portable */}
      <rect x="26" y="53" width="20" height="13" rx="2" fill="#3b82f6"/>
      <rect x="28" y="55" width="16" height="9" rx="1" fill="#eff6ff"/>
      {/* Écran avec ticket */}
      <rect x="30" y="57" width="5" height="1" rx="0.5" fill="#93c5fd"/>
      <rect x="30" y="59" width="8" height="1" rx="0.5" fill="#93c5fd"/>
      <rect x="30" y="61" width="6" height="1" rx="0.5" fill="#93c5fd"/>
    </svg>
  );
}

// Personnage technicien (rouge)
function TechFigure({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {/* Corps */}
      <circle cx="36" cy="20" r="13" fill="#fee2e2" stroke={RED} strokeWidth="2"/>
      <circle cx="36" cy="20" r="8" fill={RED}/>
      {/* Casque */}
      <path d="M26 19 Q26 10 36 10 Q46 10 46 19" stroke={RED} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <rect x="24" y="18" width="4" height="6" rx="2" fill={RED}/>
      <rect x="44" y="18" width="4" height="6" rx="2" fill={RED}/>
      {/* Micro */}
      <path d="M44 22 L47 25" stroke={RED_DARK} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Visage */}
      <circle cx="33" cy="19" r="1.5" fill="white"/>
      <circle cx="39" cy="19" r="1.5" fill="white"/>
      <path d="M33 23 Q36 26 39 23" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Corps bas */}
      <path d="M20 50 Q20 38 36 38 Q52 38 52 50" fill="#fee2e2" stroke={RED} strokeWidth="2"/>
      {/* Badge technicien */}
      <rect x="30" y="40" width="12" height="7" rx="2" fill={RED}/>
      <path d="M33 43 L35 45 L39 41" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Tablette */}
      <rect x="26" y="53" width="20" height="14" rx="2" fill={RED}/>
      <rect x="28" y="55" width="16" height="10" rx="1" fill="#fff1f1"/>
      <circle cx="36" cy="64" r="1" fill={RED}/>
    </svg>
  );
}

// Icône casque support
function HeadsetIcon({ size = 48, color = RED }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={`${color}12`} stroke={`${color}30`} strokeWidth="1.5"/>
      <path d="M12 26 Q12 14 24 14 Q36 14 36 26" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <rect x="10" y="24" width="5" height="9" rx="2.5" fill={color}/>
      <rect x="33" y="24" width="5" height="9" rx="2.5" fill={color}/>
      <path d="M35 31 Q35 35 30 35 L27 35" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <rect x="24" y="33" width="5" height="3" rx="1.5" fill={color}/>
    </svg>
  );
}

// Icône ticket
function TicketIcon({ size = 48, color = '#3b82f6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={`${color}12`} stroke={`${color}30`} strokeWidth="1.5"/>
      <rect x="12" y="16" width="24" height="18" rx="3" fill={`${color}20`} stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="24" r="3" fill="white" stroke={color} strokeWidth="1.5"/>
      <circle cx="36" cy="24" r="3" fill="white" stroke={color} strokeWidth="1.5"/>
      <rect x="17" y="20" width="14" height="2" rx="1" fill={color}/>
      <rect x="17" y="24" width="10" height="2" rx="1" fill={`${color}80`}/>
      <rect x="17" y="28" width="12" height="2" rx="1" fill={`${color}60`}/>
    </svg>
  );
}

// Icône notification / cloche
function BellIcon({ size = 48, color = '#f59e0b', pulse = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={`${color}12`} stroke={`${color}30`} strokeWidth="1.5"/>
      {pulse && <circle cx="24" cy="24" r="22" fill="none" stroke={`${color}30`} strokeWidth="2">
        <animate attributeName="r" values="22;28;22" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>}
      <path d="M24 13 C20 13 17 16 17 20 L17 26 L14 29 L34 29 L31 26 L31 20 C31 16 28 13 24 13Z" fill={`${color}25`} stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M21 29 Q21 32 24 32 Q27 32 27 29" fill={color} stroke="none"/>
      <circle cx="32" cy="15" r="4" fill={RED} stroke="white" strokeWidth="1.5"/>
      <text x="32" y="18" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">3</text>
    </svg>
  );
}

// Icône email
function MailIcon({ size = 48, color = '#8b5cf6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={`${color}12`} stroke={`${color}30`} strokeWidth="1.5"/>
      <rect x="11" y="17" width="26" height="18" rx="3" fill={`${color}18`} stroke={color} strokeWidth="1.8"/>
      <path d="M11 20 L24 28 L37 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Icône vérification / succès
function CheckIcon({ size = 48, color = '#22c55e' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={`${color}12`} stroke={`${color}30`} strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="12" fill={`${color}20`}/>
      <path d="M18 24 L22 28 L30 20" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Icône IA / cerveau
function AiIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#1a1a1a12" stroke="#1a1a1a20" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="10" fill="#1a1a1a" stroke="none"/>
      {/* Neurones */}
      {[[16,16],[32,16],[16,32],[32,32],[24,13],[24,35]].map(([x,y],i) => (
        <g key={i}>
          <line x1="24" y1="24" x2={x} y2={y} stroke={RED} strokeWidth="1.2" strokeDasharray="2,2"/>
          <circle cx={x} cy={y} r="2.5" fill={RED}/>
        </g>
      ))}
      <circle cx="24" cy="24" r="4" fill={RED}/>
      <circle cx="24" cy="24" r="2" fill="white"/>
    </svg>
  );
}

// Icône SLA / chrono
function SlaIcon({ size = 48, color = '#06b6d4' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={`${color}12`} stroke={`${color}30`} strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="12" fill="none" stroke={`${color}30`} strokeWidth="3"/>
      <circle cx="24" cy="24" r="12" fill="none" stroke={color} strokeWidth="3"
              strokeDasharray="56" strokeDashoffset="14" strokeLinecap="round"
              transform="rotate(-90 24 24)"/>
      <line x1="24" y1="24" x2="24" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="24" x2="30" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="24" r="2" fill={color}/>
    </svg>
  );
}

/* ═══════════════════════════════════════════
   ANIMATION WORKFLOW CENTRAL
═══════════════════════════════════════════ */
function WorkflowIllustration() {
  const [step, setStep] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setStep(p => (p + 1) % 4), 2000);
    return () => clearInterval(t);
  }, []);

  // Particules volantes entre les éléments
  useEffect(() => {
    const colors = ['#3b82f6', RED, '#22c55e', '#f59e0b'];
    const newP = Array.from({ length: 6 }, (_, i) => ({
      id: i, color: colors[i % colors.length],
      x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
      tx: 10 + Math.random() * 80, ty: 10 + Math.random() * 80,
    }));
    setParticles(newP);
  }, [step]);

  const steps = [
    { label: 'Client soumet',   color: '#3b82f6' },
    { label: 'Assignation SLA', color: '#f59e0b' },
    { label: 'Tech + IA',       color: RED },
    { label: 'Résolution KB',   color: '#22c55e' },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto" style={{ height: 420 }}>

      {/* SVG fond — connexions */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 420">
        {/* Cercle central */}
        <circle cx="210" cy="210" r="80" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6,6"/>
        {/* Lignes vers les coins */}
        <line x1="210" y1="210" x2="80"  y2="80"  stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4,4"/>
        <line x1="210" y1="210" x2="340" y2="80"  stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4,4"/>
        <line x1="210" y1="210" x2="80"  y2="340" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4,4"/>
        <line x1="210" y1="210" x2="340" y2="340" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4,4"/>

        {/* Ligne active animée */}
        {step === 0 && <line x1="210" y1="210" x2="80"  y2="80"  stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"><animate attributeName="stroke-dashoffset" values="100;0" dur=".5s" fill="freeze"/></line>}
        {step === 1 && <line x1="210" y1="210" x2="340" y2="80"  stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>}
        {step === 2 && <line x1="210" y1="210" x2="340" y2="340" stroke={RED}     strokeWidth="2.5" strokeLinecap="round"/>}
        {step === 3 && <line x1="210" y1="210" x2="80"  y2="340" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>}

        {/* Particules */}
        {particles.map(p => (
          <circle key={p.id} r="3" fill={p.color} opacity="0.6">
            <animateMotion dur={`${1.5 + p.id * .3}s`} repeatCount="indefinite"
              path={`M ${p.x * 4.2} ${p.y * 4.2} Q ${p.tx * 4.2} ${p.ty * 4.2} ${p.x * 4.2} ${p.y * 4.2}`}/>
          </circle>
        ))}
      </svg>

      {/* Centre — icône service */}
      <div className="absolute" style={{ left:'50%', top:'50%', transform:'translate(-50%,-50%)' }}>
        <motion.div
          animate={{ scale:[1,1.08,1] }}
          transition={{ duration:2, repeat:Infinity }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
          style={{ background:`linear-gradient(135deg,#1a1a1a,${RED})` }}>
          {/* Casque SVG inline */}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M8 26 Q8 12 24 12 Q40 12 40 26" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <rect x="5" y="24" width="7" height="12" rx="3.5" fill="white"/>
            <rect x="36" y="24" width="7" height="12" rx="3.5" fill="white"/>
            <path d="M40 32 Q40 38 32 38 L28 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <rect x="24" y="36" width="8" height="4" rx="2" fill="white"/>
          </svg>
        </motion.div>
        {/* Anneaux pulsants */}
        {[1,2,3].map(i => (
          <motion.div key={i} className="absolute inset-0 rounded-3xl border-2"
            style={{ borderColor:`${RED}40` }}
            animate={{ scale:[1, 1+i*0.25], opacity:[0.6,0] }}
            transition={{ duration:2.5, repeat:Infinity, delay:i*0.5 }}/>
        ))}
      </div>

      {/* Coin haut-gauche — CLIENT */}
      <motion.div
        animate={{ scale: step===0 ? 1.12 : 1 }}
        className="absolute" style={{ left:20, top:20 }}>
        <div className={`p-4 rounded-2xl bg-white shadow-lg border-2 transition-all ${step===0 ? 'border-blue-400' : 'border-transparent'}`}>
          <ClientFigure size={64}/>
          <p className="text-center text-[11px] font-bold text-gray-600 mt-1">Client</p>
        </div>
        {step===0 && (
          <motion.div initial={{scale:0}} animate={{scale:1}}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black"
            style={{background:'#3b82f6'}}>1</motion.div>
        )}
      </motion.div>

      {/* Coin haut-droite — TICKET + NOTIF */}
      <motion.div
        animate={{ scale: step===1 ? 1.12 : 1 }}
        className="absolute" style={{ right:20, top:20 }}>
        <div className={`p-4 rounded-2xl bg-white shadow-lg border-2 transition-all ${step===1 ? 'border-amber-400' : 'border-transparent'}`}>
          <SlaIcon size={64}/>
          <p className="text-center text-[11px] font-bold text-gray-600 mt-1">SLA auto</p>
        </div>
        {step===1 && (
          <motion.div initial={{scale:0}} animate={{scale:1}}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black"
            style={{background:'#f59e0b'}}>2</motion.div>
        )}
      </motion.div>

      {/* Coin bas-droite — TECHNICIEN */}
      <motion.div
        animate={{ scale: step===2 ? 1.12 : 1 }}
        className="absolute" style={{ right:20, bottom:20 }}>
        <div className={`p-4 rounded-2xl bg-white shadow-lg border-2 transition-all ${step===2 ? 'border-red-400' : 'border-transparent'}`}>
          <TechFigure size={64}/>
          <p className="text-center text-[11px] font-bold text-gray-600 mt-1">Technicien</p>
        </div>
        {step===2 && (
          <motion.div initial={{scale:0}} animate={{scale:1}}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black"
            style={{background:RED}}>3</motion.div>
        )}
      </motion.div>

      {/* Coin bas-gauche — RÉSOLUTION */}
      <motion.div
        animate={{ scale: step===3 ? 1.12 : 1 }}
        className="absolute" style={{ left:20, bottom:20 }}>
        <div className={`p-4 rounded-2xl bg-white shadow-lg border-2 transition-all ${step===3 ? 'border-green-400' : 'border-transparent'}`}>
          <CheckIcon size={64}/>
          <p className="text-center text-[11px] font-bold text-gray-600 mt-1">Résolu</p>
        </div>
        {step===3 && (
          <motion.div initial={{scale:0}} animate={{scale:1}}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black"
            style={{background:'#22c55e'}}>4</motion.div>
        )}
      </motion.div>

      {/* Étiquette étape active */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
          className="absolute bottom-[-2rem] left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white whitespace-nowrap"
          style={{ background: steps[step].color }}>
          {steps[step].label}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION NOTIFICATIONS LIVE
═══════════════════════════════════════════ */
function LiveNotifications() {
  const notifs = [
    { icon:<BellIcon size={36} color={RED} pulse/>,      title:'Nouveau ticket critique',   sub:'Assigné automatiquement · SLA : 2h',   color:RED,       delay:0 },
    { icon:<MailIcon size={36} color="#8b5cf6"/>,         title:'Email envoyé au client',    sub:'Confirmation de prise en charge',       color:'#8b5cf6', delay:.1 },
    { icon:<SlaIcon size={36} color="#f59e0b"/>,          title:'Alerte SLA à 80%',          sub:'Escalade automatique déclenchée',       color:'#f59e0b', delay:.2 },
    { icon:<CheckIcon size={36} color="#22c55e"/>,        title:'Ticket résolu',             sub:'Article ajouté à la base KB',           color:'#22c55e', delay:.3 },
    { icon:<AiIcon size={36}/>,                           title:'Agent 2 — Réponse IA',      sub:'3 articles KB · Score 92%',             color:'#1a1a1a', delay:.4 },
    { icon:<TicketIcon size={36} color="#06b6d4"/>,       title:'Pipeline mis à jour',       sub:'5 tickets en cours de traitement',      color:'#06b6d4', delay:.5 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {notifs.map((n, i) => (
        <motion.div key={n.title}
          initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ delay: n.delay, duration:.5 }}
          whileHover={{ y:-4, boxShadow:`0 16px 40px ${n.color}20` }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all cursor-default">
          <div className="flex-shrink-0">{n.icon}</div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 leading-snug">{n.title}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{n.sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   STAT COUNTER ANIMÉ
═══════════════════════════════════════════ */
function CountUp({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref           = useRef(null);
  const inView        = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(Math.round(start));
    }, 30);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{val}{suffix}</span>;
}

/* ═══════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════ */
export function LandingPage({ onGetStarted }) {
  const { showToast, ToastContainer } = useToast();
  const [scrollY, setScrollY] = useState(0);
  const [form, setForm]       = useState({ fullName:'', email:'', phone:'', company:'', message:'' });
  const [emailSt, setEmailSt] = useState('idle');
  const [emailErr, setEmailErr] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });

  const onChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (name === 'email') { setEmailSt('idle'); setEmailErr(''); }
  };

  const checkEmail = async email => {
    if (!email?.includes('@')) return;
    setEmailSt('checking'); setEmailErr('');
    try {
      const r = await axios.get(`${API_BASE}/api/account-requests/check-email`, { params:{ email } });
      r.data.available ? setEmailSt('available') : (setEmailSt('taken'), setEmailErr(r.data.message || 'Email déjà utilisé.'));
    } catch(e) {
      if (e.response?.status === 409) { setEmailSt('taken'); setEmailErr(e.response?.data?.message || 'Email déjà utilisé.'); }
      else setEmailSt('idle');
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone) { showToast('warning','Champs requis','Remplissez tous les champs obligatoires.'); return; }
    if (emailSt==='taken')    { showToast('error','Email invalide',emailErr); return; }
    if (emailSt==='checking') { showToast('warning','Patientez','Vérification en cours…'); return; }
    setSending(true);
    try {
      await axios.post(`${API_BASE}/api/account-requests`, form);
      showToast('success','Demande envoyée !','Notre équipe vous contactera sous 24h.');
      setForm({ fullName:'', email:'', phone:'', company:'', message:'' });
      setEmailSt('idle'); setEmailErr('');
    } catch(e) {
      if (e.response?.status === 409) { const m = e.response?.data?.message||'Email déjà utilisé.'; setEmailSt('taken'); setEmailErr(m); showToast('error','Email utilisé',m); }
      else showToast('error',"Erreur",'Veuillez réessayer.');
    } finally { setSending(false); }
  };

  const emailCls = () => {
    const b = 'w-full pl-10 pr-10 h-12 border-2 rounded-xl text-sm focus:outline-none transition-all';
    if (emailSt==='taken')     return `${b} border-red-400 bg-red-50`;
    if (emailSt==='available') return `${b} border-green-400 bg-green-50`;
    return `${b} border-gray-200 focus:border-red-500 bg-gray-50 focus:bg-white`;
  };

  const canSend = !sending && emailSt !== 'checking' && emailSt !== 'taken';

  return (
    <div style={{ fontFamily:"'DM Sans','Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital,wght@0,400;1,400&display=swap');
        .nav-glass { background:rgba(255,255,255,.92); backdrop-filter:blur(16px); }
        .hero-dots {
          background-image: radial-gradient(circle, rgba(227,30,36,.07) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
        }
        .lift { transition: all .25s cubic-bezier(.34,1.56,.64,1); }
        .lift:hover { transform: translateY(-5px) scale(1.01); }
        .glow-red { box-shadow: 0 0 40px rgba(227,30,36,.3); }
        .text-display { font-family:'DM Serif Display',serif; }
        .gradient-fill { background:linear-gradient(135deg,${RED},#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
      `}</style>
      <ToastContainer/>

      {/* ══ NAV ══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrollY>20 ? 'nav-glass shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{background:`linear-gradient(135deg,${RED},${RED_DARK})`}}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 12 Q4 6 10 6 Q16 6 16 12" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <rect x="2.5" y="11" width="3" height="5" rx="1.5" fill="white"/>
                <rect x="14.5" y="11" width="3" height="5" rx="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-black text-gray-900">HelpDesk<span style={{color:RED}}>Pro</span></span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-gray-500">
            <button onClick={()=>scrollTo('fonctionnalites')} className="hover:text-gray-900 transition-colors">Fonctionnalités</button>
            <button onClick={()=>scrollTo('alertes')}         className="hover:text-gray-900 transition-colors">Notifications</button>
            <button onClick={()=>scrollTo('contact')}         className="hover:text-gray-900 transition-colors">Contact</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onGetStarted} className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors px-3 py-2">Connexion</button>
            <button onClick={()=>scrollTo('contact')}
              className="text-sm font-bold text-white px-5 py-2.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 glow-red"
              style={{background:`linear-gradient(135deg,${RED},${RED_DARK})`}}>
              Demander un accès
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-white">
        <div className="absolute inset-0 hero-dots"/>
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full pointer-events-none" style={{background:`radial-gradient(circle at 80% 20%, rgba(227,30,36,.07) 0%, transparent 60%)`}}/>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{background:`radial-gradient(circle at 20% 80%, rgba(59,130,246,.05) 0%, transparent 60%)`}}/>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* TEXTE */}
            <motion.div initial={{opacity:0,x:-32}} animate={{opacity:1,x:0}} transition={{duration:.7}}>
              <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{delay:.1}}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-8 border"
                style={{background:'#fff1f1', borderColor:'#fecaca', color:RED}}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{background:RED}}/>
                Plateforme helpdesk IT · IA intégrée
              </motion.div>

              <h1 className="text-display text-6xl text-gray-900 leading-[1.05] mb-6 tracking-tight">
                Le support IT<br/>
                <span className="gradient-fill">réinventé</span><br/>
                avec l'IA
              </h1>

              <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
                De la soumission du ticket à la résolution — un workflow automatisé,
                des alertes intelligentes et un assistant IA pour vos techniciens.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <button onClick={()=>scrollTo('contact')}
                  className="flex items-center gap-2.5 font-bold text-white px-8 py-4 rounded-2xl transition-all hover:-translate-y-1"
                  style={{background:`linear-gradient(135deg,${RED},${RED_DARK})`, boxShadow:`0 14px 36px rgba(227,30,36,.35)`}}>
                  Créer mon compte <ArrowRight className="w-5 h-5"/>
                </button>
                <button onClick={onGetStarted}
                  className="flex items-center gap-2.5 font-bold text-gray-700 px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-red-200 hover:text-red-600 bg-white transition-all hover:-translate-y-1">
                  Se connecter <ChevronRight className="w-5 h-5"/>
                </button>
              </div>

              {/* Acteurs */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <ClientFigure size={44}/>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Client</p>
                    <p className="text-xs text-gray-400">Soumet & suit</p>
                  </div>
                </div>
                <div className="w-10 h-px bg-gray-200"/>
                <div className="flex items-center gap-3">
                  <HeadsetIcon size={44}/>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Service</p>
                    <p className="text-xs text-gray-400">Coordonne</p>
                  </div>
                </div>
                <div className="w-10 h-px bg-gray-200"/>
                <div className="flex items-center gap-3">
                  <TechFigure size={44}/>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Technicien</p>
                    <p className="text-xs text-gray-400">Résout + IA</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ILLUSTRATION WORKFLOW */}
            <motion.div initial={{opacity:0,x:32}} animate={{opacity:1,x:0}} transition={{duration:.7,delay:.2}}
              className="flex justify-center">
              <WorkflowIllustration/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="py-20 border-y border-gray-100" style={{background:'linear-gradient(180deg,#fafafa,#fff)'}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon:<TicketIcon size={52}/>, val:500, suffix:'+', label:'Tickets / mois',    color:'#3b82f6' },
              { icon:<SlaIcon size={52}/>,    val:98,  suffix:'%', label:'Taux SLA respecté', color:'#f59e0b' },
              { icon:<CheckIcon size={52}/>,  val:97,  suffix:'%', label:'Satisfaction',       color:'#22c55e' },
              { icon:<HeadsetIcon size={52}/>,val:24,  suffix:'/7',label:'Support disponible', color:RED },
            ].map((s,i) => (
              <motion.div key={s.label}
                initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
                viewport={{once:true}} transition={{delay:i*.1}}
                className="text-center">
                <div className="flex justify-center mb-3">{s.icon}</div>
                <p className="text-4xl font-black mb-1" style={{color:s.color}}>
                  <CountUp to={s.val} suffix={s.suffix}/>
                </p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FONCTIONNALITES ══ */}
      <section className="py-28 bg-white" id="fonctionnalites">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5 border"
                 style={{background:'#fff1f1', borderColor:'#fecaca', color:RED}}>
              Une plateforme complète
            </div>
            <h2 className="text-display text-5xl text-gray-900 mb-4">
              Conçu pour chaque rôle
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Client, technicien, administrateur — chacun son espace, ses outils, ses vues.
            </p>
          </div>

          {/* 3 acteurs */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                figure: <ClientFigure size={80}/>,
                title: 'Espace Client',
                color: '#3b82f6',
                items: ['Soumettre un incident en quelques clics','Suivre l\'avancement en temps réel','Échanger avec le technicien','Recevoir des notifications email'],
              },
              {
                figure: <div className="relative"><TechFigure size={80}/><div className="absolute -top-2 -right-2"><AiIcon size={28}/></div></div>,
                title: 'Espace Technicien + IA',
                color: RED,
                highlight: true,
                items: ['Prendre en charge les tickets assignés','Consulter Agent ','Épingler la solution dans la KB','Clôturer et archiver automatiquement'],
              },
              {
                figure: <HeadsetIcon size={80}/>,
                title: 'Espace Admin',
                color: '#8b5cf6',
                items: ['Tableau de bord temps réel','Configurer SLA et priorités','Gérer utilisateurs et équipes','Rapports et statistiques avancés'],
              },
            ].map((card, i) => (
              <motion.div key={card.title}
                initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}}
                viewport={{once:true}} transition={{delay:i*.12}}
                className={`lift p-8 rounded-3xl border-2 bg-white ${card.highlight?'shadow-2xl':'shadow-sm'}`}
                style={{borderColor: card.highlight ? `${card.color}40` : '#f1f5f9',
                        boxShadow: card.highlight ? `0 24px 60px ${card.color}18` : undefined}}>
                {card.highlight && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black mb-4"
                       style={{background:card.color, color:'#fff'}}>
                    ✦ Clé de voûte IA
                  </div>
                )}
                <div className="flex justify-center mb-5">{card.figure}</div>
                <h3 className="text-xl font-black text-gray-900 text-center mb-5">{card.title}</h3>
                <ul className="space-y-3">
                  {card.items.map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{background:`${card.color}15`}}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5 L4 7 L8 3" stroke={card.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Agent 2 démo */}
          <motion.div
            initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="rounded-3xl overflow-hidden border-2 p-8"
            style={{background:'linear-gradient(135deg,#1a1a1a 0%,#2d0000 100%)', borderColor:`${RED}30`}}>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <AiIcon size={52}/>
                  <div>
                    <p className="text-lg font-black text-white">Agent 2 — IA Technicien</p>
                    <p className="text-sm text-gray-400">Mistral 7B · RAG · FAISS · 100% local</p>
                  </div>
                </div>
                <p className="text-gray-400 leading-relaxed mb-6">
                  L'agent analyse le ticket, cherche dans la base de connaissances et
                  génère une réponse structurée avec les sources citées — sans jamais inventer.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Recherche sémantique','Sources citées','Stack Overflow','Microsoft Learn','Rebuild auto KB'].map(t=>(
                    <span key={t} className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                          style={{background:`${RED}30`, border:`1px solid ${RED}50`}}>{t}</span>
                  ))}
                </div>
              </div>
              {/* Mini démo chat */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <AiIcon size={28}/>
                  <span className="text-sm font-bold text-white">Agent 2</span>
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 border border-white/5">
                    💬 Causes possibles pour cet incident ?
                  </div>
                  <div className="rounded-xl px-3 py-3 text-xs leading-relaxed text-gray-200"
                       style={{background:`${RED}18`, border:`1px solid ${RED}30`}}>
                    <span className="font-bold" style={{color:RED}}>Agent 2 ·</span> D'après la KB (92%) :<br/>
                    Cause probable → pilote réseau obsolète<br/>
                    <span className="text-gray-400">① Gestionnaire périphériques  ② Mettre à jour pilote  ③ Réinitialiser TCP/IP</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{background:`${RED}25`, color:RED}}>KB · 92%</span>
                    <span className="text-[10px] px-2 py-1 rounded-lg text-gray-400" style={{background:'rgba(255,255,255,.06)'}}>3 articles</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ NOTIFICATIONS & ALERTES ══ */}
      <section className="py-28" id="alertes"
               style={{background:'linear-gradient(180deg,#fafafa 0%,#fff8f8 50%,#fafafa 100%)'}}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5 border"
                 style={{background:'#fff1f1', borderColor:'#fecaca', color:RED}}>
              Notifications & Alertes en temps réel
            </div>
            <h2 className="text-display text-5xl text-gray-900 mb-4">
              Rien ne passe<br/>
              <span className="gradient-fill">sans alerte</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Chaque événement déclenche la bonne notification au bon moment —
              email, alerte système ou escalade automatique.
            </p>
          </div>
          <LiveNotifications/>

          {/* Pipeline icônes */}
          <div className="mt-20 flex items-center justify-center gap-0 flex-wrap">
            {[
              { icon:<ClientFigure size={56}/>, label:'Client' },
              null,
              { icon:<TicketIcon size={56} color={RED}/>, label:'Ticket' },
              null,
              { icon:<BellIcon size={56} color="#f59e0b" pulse/>, label:'Notification' },
              null,
              { icon:<TechFigure size={56}/>, label:'Technicien' },
              null,
              { icon:<AiIcon size={56}/>, label:'Agent 2 IA' },
              null,
              { icon:<CheckIcon size={56} color="#22c55e"/>, label:'Résolu' },
            ].map((item, i) => (
              item === null ? (
                <div key={i} className="flex items-center px-2">
                  <motion.div
                    animate={{x:[0,6,0]}} transition={{duration:1.2,repeat:Infinity,delay:i*.1}}
                    className="text-gray-300 text-2xl">→</motion.div>
                </div>
              ) : (
                <motion.div key={i}
                  initial={{opacity:0,scale:.8}} whileInView={{opacity:1,scale:1}}
                  viewport={{once:true}} transition={{delay:Math.floor(i/2)*.1}}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  {item.icon}
                  <p className="text-[11px] font-bold text-gray-600">{item.label}</p>
                </motion.div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-24 text-white relative overflow-hidden"
               style={{background:`linear-gradient(135deg,#1a1a1a,#2d0000,#1a1a1a)`}}>
        <div className="absolute inset-0 hero-dots opacity-10"/>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 blur-3xl opacity-40 rounded-full" style={{background:RED}}/>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <div className="flex justify-center mb-8">
              <motion.div animate={{rotate:[0,5,-5,0]}} transition={{duration:3,repeat:Infinity}}>
                <HeadsetIcon size={80} color="#f87171"/>
              </motion.div>
            </div>
            <h2 className="text-display text-5xl mb-4">
              Prêt à offrir un support<br/>
              <span style={{color:'#fca5a5'}}>de qualité ?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10">Demandez votre accès — configuration en 24h.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={()=>scrollTo('contact')}
                className="flex items-center gap-2 font-bold px-8 py-4 rounded-2xl text-white transition-all hover:-translate-y-1 glow-red"
                style={{background:`linear-gradient(135deg,${RED},${RED_DARK})`}}>
                Créer mon compte <ArrowRight className="w-5 h-5"/>
              </button>
              <button onClick={onGetStarted}
                className="flex items-center gap-2 font-bold px-8 py-4 rounded-2xl border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all">
                Déjà un compte
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ CONTACT ══ */}
      <section className="py-28 bg-white" id="contact">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-start">

            <motion.div initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} viewport={{once:true}}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 border"
                   style={{background:'#fff1f1', borderColor:'#fecaca', color:RED}}>
                <Send className="w-4 h-4"/> Nous contacter
              </div>
              <h2 className="text-display text-5xl text-gray-900 mb-4">
                Demandez<br/><span style={{color:RED}}>votre accès</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-10">
                Remplissez le formulaire et notre équipe vous contactera dans les 24h.
              </p>

              {/* Icônes contact */}
              <div className="space-y-4 mb-10">
                {[
                  { icon:<MailIcon size={52} color="#3b82f6"/>, label:'Email',    val:'support@helpdeskpro.com' },
                  { icon:<SlaIcon  size={52} color="#22c55e"/>, label:'Horaires', val:'Lun – Ven · 9h00 – 18h00' },
                  { icon:<BellIcon size={52} color="#f59e0b"/>, label:'Réponse',  val:'Garantie sous 24h' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4">
                    {item.icon}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-gray-800 font-semibold">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust — 3 icônes */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon:<CheckIcon size={44} color="#22c55e"/>,    label:'Compte en 24h' },
                  { icon:<SlaIcon size={44} color="#3b82f6"/>,      label:'SSL sécurisé' },
                  { icon:<HeadsetIcon size={44} color="#8b5cf6"/>,  label:'Support dédié' },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-gray-50 text-center">
                    {b.icon}
                    <p className="text-[11px] font-bold text-gray-500">{b.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Formulaire */}
            <motion.div initial={{opacity:0,x:24}} whileInView={{opacity:1,x:0}} viewport={{once:true}}>
              <form onSubmit={onSubmit} noValidate
                className="p-8 rounded-3xl border border-gray-100 bg-white"
                style={{boxShadow:'0 12px 48px rgba(0,0,0,.07)'}}>
                <h3 className="text-xl font-black text-gray-900 mb-6">Formulaire de demande</h3>
                <div className="space-y-4">

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom complet <span style={{color:RED}}>*</span></label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                      <input type="text" name="fullName" value={form.fullName} onChange={onChange}
                        placeholder="Jean Dupont" required
                        className="w-full pl-10 h-12 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-gray-50 focus:bg-white transition-all"/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email professionnel <span style={{color:RED}}>*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                      <input type="email" name="email" value={form.email} onChange={onChange}
                        onBlur={e=>checkEmail(e.target.value)} placeholder="jean@entreprise.com" required
                        className={emailCls()}/>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        {emailSt==='checking'  && <Loader2      className="w-4 h-4 text-gray-400 animate-spin"/>}
                        {emailSt==='available' && <CheckCircle  className="w-4 h-4 text-green-500"/>}
                        {emailSt==='taken'     && <AlertCircle  className="w-4 h-4 text-red-500"/>}
                      </span>
                    </div>
                    {emailSt==='taken'     && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{emailErr}</p>}
                    {emailSt==='available' && <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Disponible</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone <span style={{color:RED}}>*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                        <input type="tel" name="phone" value={form.phone} onChange={onChange}
                          placeholder="+33 6 …" required
                          className="w-full pl-10 h-12 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-gray-50 focus:bg-white"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Entreprise</label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                        <input type="text" name="company" value={form.company} onChange={onChange}
                          placeholder="Ma Société"
                          className="w-full pl-10 h-12 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-gray-50 focus:bg-white"/>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                    <textarea name="message" value={form.message} onChange={onChange}
                      placeholder="Décrivez vos besoins…" rows={3}
                      className="w-full border-2 border-gray-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-red-500 resize-none bg-gray-50 focus:bg-white transition-all"/>
                  </div>

                  <button type="submit" disabled={!canSend}
                    className={`w-full py-3.5 text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-all ${!canSend?'bg-gray-100 text-gray-400 cursor-not-allowed':'text-white hover:-translate-y-0.5'}`}
                    style={canSend?{background:`linear-gradient(135deg,${RED},${RED_DARK})`,boxShadow:`0 8px 24px rgba(227,30,36,.35)`}:{}}>
                    {sending?<><Loader2 className="w-4 h-4 animate-spin"/>Envoi…</> : <><Send className="w-4 h-4"/>Envoyer la demande</>}
                  </button>
                  <p className="text-center text-xs text-gray-400">Réponse sous 24h · Données sécurisées SSL</p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-gray-950 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`linear-gradient(135deg,${RED},${RED_DARK})`}}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 11 Q3 5 9 5 Q15 5 15 11" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <rect x="1.5" y="10" width="3" height="5" rx="1.5" fill="white"/>
                <rect x="13.5" y="10" width="3" height="5" rx="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-black">HelpDesk<span style={{color:'#f87171'}}>Pro</span></span>
          </div>
          <p className="text-sm text-gray-500">© 2026 HelpDesk Pro · Tous droits réservés · Données sécurisées</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <button onClick={onGetStarted} className="hover:text-gray-300 transition-colors">Connexion</button>
            <button onClick={()=>scrollTo('contact')} className="hover:text-gray-300 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
