import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // prevent double-fire under React StrictMode
    ran.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const errParam = params.get('error');

    if (errParam) {
      setError(errParam);
      return;
    }
    if (!code) {
      setError('Missing authorization code');
      return;
    }
    (async () => {
      try {
        const { data } = await authApi.googleCallback(code, state);
        await loginWithTokens(data);
        navigate('/', { replace: true });
      } catch (err) {
        const detail = err?.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Google sign-in failed');
      }
    })();
  }, [params, navigate, loginWithTokens]);

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Signing in with Google…</h2>
        {error ? (
          <>
            <div className="error">{error}</div>
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>
              Back to sign in
            </button>
          </>
        ) : (
          <p className="subtle">Please wait while we complete sign-in.</p>
        )}
      </div>
    </div>
  );
}
