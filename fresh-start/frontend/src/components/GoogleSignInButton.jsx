import { useState } from 'react';
import { authApi } from '../lib/api';

export default function GoogleSignInButton({ label = 'Continue with Google' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onClick = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.googleUrl();
      window.location.href = data.authorize_url;
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Google sign-in unavailable');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onClick}
        disabled={loading}
        style={{ width: '100%', marginTop: 10 }}
      >
        {loading ? 'Redirecting…' : label}
      </button>
      {error && (
        <div className="error" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
}
