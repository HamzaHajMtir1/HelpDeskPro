// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const ref = useRef(null);
  const [isScrolled,  setIsScrolled]  = useState(false);
  const [isMenuOpen,  setIsMenuOpen]  = useState(false);
  const navigate = useNavigate();

  // Infos utilisateur depuis localStorage
  const firstName = localStorage.getItem('firstName');
  const lastName  = localStorage.getItem('lastName');
  const role      = localStorage.getItem('role');

  // Liens selon le rôle
  const navLinks = role === 'ADMIN'
    ? [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Gestion utilisateurs', path: '/admin' },
      ]
    : role === 'TECHNICIEN'
    ? [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Tickets', path: '/tickets' },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Mes tickets', path: '/tickets' },
      ];

  const roleColors = {
    ADMIN:      'bg-red-100 text-red-700',
    TECHNICIEN: 'bg-purple-100 text-purple-700',
    CLIENT:     'bg-blue-100 text-blue-700',
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full flex items-center justify-between 
                     px-4 md:px-16 transition-all duration-500 z-50 
                     ${isScrolled
                       ? 'bg-white/90 shadow-md backdrop-blur-lg py-3 text-gray-700'
                       : 'bg-blue-600 py-4 text-white'}`}>

      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                         ${isScrolled ? 'bg-blue-600' : 'bg-white/20'}`}>
          <Ticket className={`w-5 h-5 ${isScrolled ? 'text-white' : 'text-white'}`} />
        </div>
        <span className={`font-bold text-lg 
                          ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
          HelpDesk
        </span>
        {/* {role && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium 
                            ${roleColors[role]}`}>
            {role}
          </span>
        )}*/}
      </Link>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-6">
        {navLinks.map((link, i) => (
          <Link key={i} to={link.path}
            className={`group flex flex-col gap-0.5 text-sm font-medium
                        ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
            {link.name}
            <div className={`h-0.5 w-0 group-hover:w-full transition-all duration-300
                             ${isScrolled ? 'bg-gray-700' : 'bg-white'}`} />
          </Link>
        ))}
      </div>

      {/* Desktop Right — Utilisateur + Logout */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                           text-xs font-bold
                           ${isScrolled 
                             ? 'bg-blue-100 text-blue-700' 
                             : 'bg-white/20 text-white'}`}>
            {firstName?.charAt(0)}{lastName?.charAt(0)}
          </div>
          <span className={`text-sm font-medium 
                            ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
            {firstName} {lastName}
          </span>
        </div>
        <button onClick={logout}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm 
                      font-medium transition-all cursor-pointer
                      ${isScrolled
                        ? 'bg-gray-900 text-white hover:bg-gray-700'
                        : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>

      {/* Mobile — Burger */}
      <div className="flex items-center md:hidden">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <svg className={`h-6 w-6 ${isScrolled ? 'text-gray-800' : 'text-white'}`}
               fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`fixed top-0 left-0 w-full h-screen bg-white flex flex-col 
                       md:hidden items-center justify-center gap-6 font-medium 
                       text-gray-800 transition-all duration-500
                       ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Fermer */}
        <button className="absolute top-4 right-4"
                onClick={() => setIsMenuOpen(false)}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor"
               strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Infos user mobile */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center 
                          justify-center text-white font-bold">
            {firstName?.charAt(0)}{lastName?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{firstName} {lastName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[role]}`}>
              {role}
            </span>
          </div>
        </div>

        {navLinks.map((link, i) => (
          <Link key={i} to={link.path} onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 transition-colors">
            {link.name}
          </Link>
        ))}

        <button onClick={logout}
          className="bg-gray-900 text-white px-8 py-2.5 rounded-full 
                     flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
