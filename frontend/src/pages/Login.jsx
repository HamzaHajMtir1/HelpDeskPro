import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

export default function Login() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token',     data.token);
      localStorage.setItem('role',      data.role);
      localStorage.setItem('firstName', data.firstName);
      localStorage.setItem('lastName',  data.lastName);
      localStorage.setItem('email',     form.email);
      localStorage.setItem('userId', data.id);

      if (data.mustChangePassword) {
        navigate('/change-password?mode=first');
        return;
      }
      if      (data.role === 'ADMIN')      navigate('/admin');
      else if (data.role === 'TECHNICIEN') navigate('/dashboardTech');
      else                                 navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center
                    justify-center p-4">
      <div className="rounded-2xl border border-gray-200 bg-white
                      py-10 px-8 w-full max-w-md shadow-sm">

        {/* Icône rouge */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center
                        justify-center rounded-full bg-red-50">
          <svg className="h-8 w-8" fill="none" stroke="#E31E24"
               viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 
                 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h3 className="mb-1 text-center text-2xl font-bold text-gray-800">
          HelpDesk IT
        </h3>
        <p className="mb-7 text-center text-sm text-gray-500">
          Connectez-vous à votre espace
        </p>

        <form onSubmit={handleSubmit}>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <input type="email" placeholder="vous@exemple.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5
                         text-sm outline-none transition"
              onFocus={e => {
                e.target.style.borderColor = '#E31E24';
                e.target.style.boxShadow = '0 0 0 2px rgba(227,30,36,0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5
                           pr-10 text-sm outline-none transition"
                onFocus={e => {
                  e.target.style.borderColor = '#E31E24';
                  e.target.style.boxShadow = '0 0 0 2px rgba(227,30,36,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-gray-600">
                {showPwd ? <Eye className="w-4 h-4" />
                         : <EyeOff    className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Lien rouge */}
          <div className="mb-5 text-right">
            <Link to="/forgot-password"
              className="text-sm hover:underline transition"
              style={{ color: '#E31E24' }}>
              Mot de passe oublié ?
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200
                            px-3 py-2.5 text-sm text-red-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Bouton rouge */}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl px-4 py-2.5 font-medium text-white
                       transition duration-200 flex items-center justify-center gap-2
                       active:scale-[0.98]"
            style={{ backgroundColor: loading ? '#f4a0a3' : '#E31E24' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#b81519'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#E31E24'; }}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white
                                 border-t-transparent rounded-full animate-spin" />
                Connexion...
              </>
            ) : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
