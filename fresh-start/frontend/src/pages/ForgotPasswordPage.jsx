import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const { data } = await authApi.forgotPassword(email);
      setMessage(data.message || 'If that email exists, a reset link was sent.');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Forgot password</h2>
        <p className="subtle">
          Enter your account email and we'll send you a reset link.
        </p>

        {error && <div className="error">{error}</div>}
        {message && (
          <div className="error" style={{ background: '#e6f7ee', color: '#0a7f3f' }}>
            {message}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p style={{ marginTop: 18, fontSize: 14, color: '#6b7280' }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
