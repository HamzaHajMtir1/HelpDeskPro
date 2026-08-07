import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

export default function VerifyCode() {
  const [digits,  setDigits]  = useState(['', '', '', '', '', '']);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = [...digits];
    pasted.split('').forEach((d, i) => { newDigits[i] = d; });
    setDigits(newDigits);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) { setError('Entrez le code complet à 6 chiffres'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-reset-code', { email, code });
      navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${code}`);
    } catch (err) {
      setError(err.response?.data || 'Code incorrect ou expiré');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
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
          <ShieldCheck className="h-8 w-8" style={{ color: '#E31E24' }} />
        </div>

        <h3 className="mb-1 text-center text-2xl font-bold text-gray-800">
          Vérification
        </h3>
        <p className="mb-2 text-center text-sm text-gray-500">
          Entrez le code à 6 chiffres envoyé à
        </p>
        <p className="mb-7 text-center text-sm font-semibold text-gray-800">
          {email}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Cases OTP — rouge quand remplie */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold
                           rounded-xl border-2 outline-none transition"
                style={{
                  borderColor:      digit ? '#E31E24' : '#e5e7eb',
                  backgroundColor:  digit ? '#fff1f1' : '#f9fafb',
                  color:            digit ? '#E31E24' : '#1a1a1a',
                }}
                onFocus={e => e.target.style.borderColor = '#E31E24'}
                onBlur={e  => {
                  if (!e.target.value) e.target.style.borderColor = '#e5e7eb';
                }}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200
                            px-3 py-2.5 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          {/* Bouton rouge */}
          <button type="submit"
            disabled={loading || digits.join('').length < 6}
            className="w-full rounded-xl px-4 py-2.5 font-medium text-white
                       transition flex items-center justify-center gap-2"
            style={{
              backgroundColor: (loading || digits.join('').length < 6)
                ? '#f4a0a3' : '#E31E24'
            }}
            onMouseEnter={e => {
              if (!loading && digits.join('').length === 6)
                e.currentTarget.style.backgroundColor = '#b81519';
            }}
            onMouseLeave={e => {
              if (!loading && digits.join('').length === 6)
                e.currentTarget.style.backgroundColor = '#E31E24';
            }}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white
                                 border-t-transparent rounded-full animate-spin" />
                Vérification...
              </>
            ) : 'Vérifier le code'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Vous n'avez pas reçu le code ?{' '}
          <button onClick={() => navigate('/forgot-password')}
            className="font-medium transition"
            style={{ color: '#E31E24' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            Renvoyer
          </button>
        </p>

        <Link to="/login"
          className="mt-3 flex items-center justify-center gap-2
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
