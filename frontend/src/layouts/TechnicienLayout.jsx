/**
 * TechnicienLayout.jsx — avec avatar dynamique dans le header
 * ✅ Avatar synchronisé via useAvatar hook
 * ✅ Clic sur le cercle/nom → /tech/profile
 * ✅ safeLogout() préserve les avatars après localStorage.clear()
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Ticket,
  BookOpen, User, LogOut, Menu, X, HelpCircle
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { useSettings } from '../context/SettingsContext';
import TechHelpPanel from '../components/Help/TechHelpPanel';
import { useAvatar, safeLogout } from '../hooks/useAvatar';

export default function TechnicienLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpOpen,    setHelpOpen]    = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { settings } = useSettings();
  const { avatarUrl } = useAvatar();

  const firstName = localStorage.getItem('firstName');
  const lastName  = localStorage.getItem('lastName');
  const role      = localStorage.getItem('role');
  const initials  = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

  const RED = settings.primaryColor || '#E31E24';

  const navItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord',       path: '/dashboardTech'    },
    { icon: PlusCircle,      label: 'Créer un ticket',       path: '/tech/tickets/new' },
    { icon: Ticket,          label: 'Mes tickets assignés',  path: '/tech/tickets'     },
    { icon: BookOpen,        label: 'Base de connaissances', path: '/tech/knowledge'   },
    { icon: User,            label: 'Mon profil',            path: '/tech/profile'     },
  ];

  // ✅ FIX : safeLogout préserve les avatars
  const logout = () => {
    safeLogout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 flex flex-col
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `} style={{ backgroundColor: '#1a1a1a' }}>

        <div className="px-6 py-6"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: RED }} />
                <h1 className="text-xl font-bold text-white">
                  {settings.logoText || settings.companyName}
                </h1>
              </div>
              <p className="text-xs mt-1 ml-3" style={{ color: '#6b6b6b' }}>
                Espace Technicien
              </p>
            </div>
            <button className="md:hidden text-white/60 hover:text-white"
                    onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl
                           text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: active ? RED : 'transparent',
                  color: active ? '#ffffff' : '#a0a0a0',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.backgroundColor = '#2a2a2a';
                  if (!active) e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                  if (!active) e.currentTarget.style.color = '#a0a0a0';
                }}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4"
             style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: '#4a4a4a' }}>Version 1.0.0</p>
          <p className="text-xs" style={{ color: '#4a4a4a' }}>© 2026 Sindibad Group</p>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white px-4 md:px-6 py-3 flex items-center gap-4 flex-shrink-0"
                style={{ borderBottom: '1px solid #e5e5e5' }}>
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-500" />
          </button>

          <div className="flex items-center gap-2 ml-auto">

            {/* Bouton Aide */}
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-xl transition-all"
              style={{ color: '#6b7280' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = RED; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
              title="Aide & Documentation"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* Séparateur */}
            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1" />

            {/* ── Profil cliquable ── */}
            <button
              onClick={() => navigate('/tech/profile')}
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Voir mon profil"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {firstName} {lastName}
                </p>
                <p className="text-xs text-gray-400">{role}</p>
              </div>
              <AvatarCircle avatarUrl={avatarUrl} initials={initials} color={RED} />
            </button>

            {/* Déconnexion */}
            <button onClick={logout}
              className="p-2 rounded-xl transition-all"
              style={{ color: '#6b7280' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = RED; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
              title="Déconnexion">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Panel d'aide */}
      <TechHelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

/* ─── Cercle avatar ─── */
function AvatarCircle({ avatarUrl, initials, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', flexShrink: 0,
      border: `2px solid ${color}30`,
      boxShadow: `0 0 0 2px ${color}15`,
      transition: 'box-shadow .2s ease, border-color .2s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}80`; e.currentTarget.style.boxShadow = `0 0 0 3px ${color}25`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.boxShadow = `0 0 0 2px ${color}15`; }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: `linear-gradient(135deg, #1a1a1a, ${color})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.33, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.5px',
        }}>
          {initials}
        </div>
      )}
    </div>
  );
}
