import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const code  = searchParams.get('code')  || '';

  const strength =
    password.length === 0 ? 0 :
    password.length < 6   ? 1 :
    password.length < 10  ? 2 : 3;

  const strengthLabel = ['', 'Faible',        'Moyen',           'Fort'         ];
  const strengthColor = ['', 'bg-red-400',    'bg-yellow-400',   'bg-green-500' ];
  const strengthText  = ['', 'text-red-500',  'text-yellow-500', 'text-green-600'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Minimum 6 caractères requis');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center
                    justify-center p-4">
      <div className="rounded-2xl border border-gray-200 bg-white
                      py-10 px-8 w-full max-w-md shadow-sm">

        {/* Icône — rouge au lieu de bleu */}
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center
                         justify-center rounded-full
                         ${success ? 'bg-green-100' : 'bg-red-50'}`}>
          {success
            ? <CheckCircle className="h-8 w-8 text-green-500" />
            : <Lock className="h-8 w-8" style={{ color: '#E31E24' }} />}
        </div>

        {success ? (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Mot de passe réinitialisé !
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Votre nouveau mot de passe a été enregistré.
              Redirection vers la connexion...
            </p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full w-full
                              transition-all duration-[2000ms]" />
            </div>
          </div>

        ) : (
          <>
            <h3 className="mb-1 text-center text-2xl font-bold text-gray-800">
              Nouveau mot de passe
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500">
              Définissez votre nouveau mot de passe permanent
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </label>
                <input type="password" placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300
                             px-3 py-2.5 text-sm outline-none transition"
                  style={{}}
                  onFocus={e => {
                    e.target.style.borderColor = '#E31E24';
                    e.target.style.boxShadow = '0 0 0 2px rgba(227,30,36,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map(i => (
                        <div key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all
                            ${i <= strength ? strengthColor[strength] : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strengthText[strength]}`}>
                      Force : {strengthLabel[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <input type="password" placeholder="Répétez le mot de passe"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm
                              outline-none transition
                              ${confirm && confirm !== password
                                ? 'border-red-300'
                                : confirm && confirm === password
                                ? 'border-green-300'
                                : 'border-gray-300'}`}
                />
                {confirm && (
                  <p className={`text-xs mt-1
                    ${confirm === password ? 'text-green-600' : 'text-red-500'}`}>
                    {confirm === password
                      ? '✓ Les mots de passe correspondent'
                      : '✗ Les mots de passe ne correspondent pas'}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200
                                px-3 py-2.5 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Bouton rouge au lieu de bleu */}
              <button type="submit" disabled={loading}
                className="w-full rounded-xl px-4 py-2.5 font-medium text-white
                           transition flex items-center justify-center gap-2
                           active:scale-[0.98]"
                style={{ backgroundColor: loading ? '#f4a0a3' : '#E31E24' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#b81519'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#E31E24'; }}>
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white
                                     border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Enregistrer le nouveau mot de passe
                  </>
                )}
              </button>
            </form>

            {/* Lien rouge au lieu de bleu */}
            <Link to="/login"
              className="mt-5 flex items-center justify-center gap-2
                         text-sm text-gray-500 transition"
              onMouseEnter={e => e.currentTarget.style.color = '#E31E24'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
