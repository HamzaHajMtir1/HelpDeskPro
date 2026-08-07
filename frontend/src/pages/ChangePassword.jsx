import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [secConfig,   setSecConfig]   = useState({
    minLength:        6,
    requireUppercase: false,
    requireNumbers:   false,
    requireSpecial:   false,
  });

  // ── Empêcher le double submit (React StrictMode) ──
  const submitted = useRef(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode         = searchParams.get('mode') || 'first';
  const isFirstLogin = mode === 'first';

  // ── Charger la config sécurité ──
  useEffect(() => {
    api.get('/admin/settings/public')
      .then(({ data }) => {
        setSecConfig({
          minLength:        parseInt(data.passwordMinLength) || 6,
          requireUppercase: data.requireUppercase  === 'true',
          requireNumbers:   data.requireNumbers    === 'true',
          requireSpecial:   data.requireSpecialChar === 'true',
        });
      })
      .catch(() => {});
  }, []);

  // ── Validation dynamique ──
  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < secConfig.minLength)
      errors.push(`Au moins ${secConfig.minLength} caractères`);
    if (secConfig.requireUppercase && !/[A-Z]/.test(pwd))
      errors.push('Au moins une majuscule');
    if (secConfig.requireNumbers && !/[0-9]/.test(pwd))
      errors.push('Au moins un chiffre');
    if (secConfig.requireSpecial && !/[^A-Za-z0-9]/.test(pwd))
      errors.push('Au moins un caractère spécial');
    return errors;
  };

  const pwdErrors = password ? validatePassword(password) : [];

  const strength =
    password.length === 0   ? 0 :
    pwdErrors.length > 1    ? 1 :
    pwdErrors.length === 1  ? 2 : 3;

  const strengthLabel = ['', 'Faible',       'Moyen',          'Fort'        ];
  const strengthColor = ['', 'bg-red-400',   'bg-yellow-400',  'bg-green-500'];
  const strengthText  = ['', 'text-red-500', 'text-yellow-500','text-green-600'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Guard contre double submit ──
    if (submitted.current) return;

    setError('');

    const validationErrors = validatePassword(password);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' · '));
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (!isFirstLogin && !oldPassword) {
      setError('Veuillez saisir votre ancien mot de passe');
      return;
    }

    submitted.current = true;
    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        oldPassword: isFirstLogin ? '' : oldPassword,
        newPassword: password,
      });

      // ── Succès : afficher le message puis rediriger ──
      setSuccess(true);

      setTimeout(() => {
        if (isFirstLogin) {
          const role = localStorage.getItem('role');
          if      (role === 'ADMIN')      navigate('/admin');
          else if (role === 'TECHNICIEN') navigate('/dashboardTech');
          else                            navigate('/dashboard');
        } else {
          localStorage.clear();
          navigate('/login');
        }
      }, 2000);

    } catch (err) {
      submitted.current = false; // reset pour permettre un nouvel essai
      setError(
        err.response?.data?.message ||
        err.response?.data ||
        'Une erreur est survenue'
      );
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = { borderColor: '#E31E24', boxShadow: '0 0 0 2px rgba(227,30,36,0.1)' };
  const blurStyle  = { borderColor: '#d1d5db', boxShadow: 'none' };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="rounded-2xl border border-gray-200 bg-white py-10 px-8 w-full max-w-md shadow-sm">

        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full
                         ${success ? 'bg-green-100' : 'bg-red-50'}`}>
          {success
            ? <CheckCircle className="h-8 w-8 text-green-500" />
            : <Lock className="h-8 w-8" style={{ color: '#E31E24' }} />}
        </div>

        <h3 className="mb-1 text-center text-2xl font-bold text-gray-800">
          {isFirstLogin ? 'Première connexion' : 'Changer le mot de passe'}
        </h3>
        <p className="mb-5 text-center text-sm text-gray-500">
          {isFirstLogin
            ? 'Définissez votre mot de passe personnel'
            : 'Saisissez votre ancien et nouveau mot de passe'}
        </p>

        {!success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl p-4 bg-red-50 border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#E31E24' }} />
            <div className="text-sm text-gray-600">
              <p className="mb-1">
                {isFirstLogin
                  ? 'Votre compte a été créé par un administrateur. Remplacez le mot de passe temporaire.'
                  : 'Pour sécuriser votre compte, saisissez votre mot de passe actuel avant de le modifier.'}
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5 mt-2">
                <li>• Minimum {secConfig.minLength} caractères</li>
                {secConfig.requireUppercase && <li>• Au moins une majuscule</li>}
                {secConfig.requireNumbers   && <li>• Au moins un chiffre</li>}
                {secConfig.requireSpecial   && <li>• Au moins un caractère spécial</li>}
              </ul>
            </div>
          </div>
        )}

        {success ? (
          <div className="text-center py-2">
            <p className="text-green-700 font-semibold text-lg mb-1">
              Mot de passe mis à jour !
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {isFirstLogin
                ? 'Redirection vers votre tableau de bord...'
                : 'Redirection vers la connexion...'}
            </p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full w-full transition-all duration-[2000ms]" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {!isFirstLogin && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ancien mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Votre mot de passe actuel"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition"
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e  => Object.assign(e.target.style, blurStyle)}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                placeholder={`Minimum ${secConfig.minLength} caractères`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition"
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e  => Object.assign(e.target.style, blurStyle)}
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all
                        ${i <= strength ? strengthColor[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthText[strength]}`}>
                    Force : {strengthLabel[strength]}
                  </p>
                  {pwdErrors.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {pwdErrors.map((e, i) => (
                        <li key={i} className="text-xs text-red-500">✗ {e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                placeholder="Répétez le mot de passe"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition
                  ${confirm && confirm !== password ? 'border-red-300'
                  : confirm && confirm === password ? 'border-green-300'
                  : 'border-gray-300'}`}
              />
              {confirm && (
                <p className={`text-xs mt-1 ${confirm === password ? 'text-green-600' : 'text-red-500'}`}>
                  {confirm === password
                    ? '✓ Les mots de passe correspondent'
                    : '✗ Les mots de passe ne correspondent pas'}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-2.5 font-medium text-white transition duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              style={{ backgroundColor: loading ? '#f4a0a3' : '#E31E24' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#b81519'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#E31E24'; }}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Valider le nouveau mot de passe
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
