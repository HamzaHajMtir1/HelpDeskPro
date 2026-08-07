import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      navigate(`/verify-code?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data || 'Aucun compte trouvé avec cet email');
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
          <Mail className="h-8 w-8" style={{ color: '#E31E24' }} />
        </div>

        <h3 className="mb-1 text-center text-2xl font-bold text-gray-800">
          Mot de passe oublié
        </h3>
        <p className="mb-7 text-center text-sm text-gray-500">
          Entrez votre email — un code de vérification vous sera envoyé
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <input type="email" placeholder="vous@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300
                         px-3 py-2.5 text-sm outline-none transition"
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

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200
                            px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Bouton rouge */}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl px-4 py-2.5 font-medium text-white
                       transition flex items-center justify-center gap-2"
            style={{ backgroundColor: loading ? '#f4a0a3' : '#E31E24' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#b81519'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#E31E24'; }}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white
                                 border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : 'Envoyer le code de vérification'}
          </button>
        </form>

        {/* Lien retour rouge */}
        <Link to="/login"
          className="mt-5 flex items-center justify-center gap-2
                     text-sm text-gray-500 transition"
          onMouseEnter={e => e.currentTarget.style.color = '#E31E24'}
          onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
