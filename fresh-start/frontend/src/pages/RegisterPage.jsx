import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// Must mirror backend rules in app/schemas/auth.py::_validate_password_strength
const PASSWORD_RULES = [
  { test: (v) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v) => /[A-Z]/.test(v), label: 'One uppercase letter (A-Z)' },
  { test: (v) => /[a-z]/.test(v), label: 'One lowercase letter (a-z)' },
  { test: (v) => /\d/.test(v), label: 'One number (0-9)' },
  { test: (v) => /[^A-Za-z0-9]/.test(v), label: 'One special character (e.g. !@#$%)' },
];

function validatePassword(v) {
  return PASSWORD_RULES.every((r) => r.test(v));
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    full_name: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validatePassword(form.password)) {
      setError('Password does not meet the requirements below.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.register(form);
      // Don't auto-login — push the user to email verification first.
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        // pydantic validation error array
        setError(detail.map((d) => d.msg).join(' '));
      } else {
        setError(typeof detail === 'string' ? detail : 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Create your account</h2>
        <p className="subtle">Start using ToppertTalks in seconds.</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">Full name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={onChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={onChange}
              minLength={8}
              required
            />
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '8px 0 0',
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              {PASSWORD_RULES.map((r) => {
                const ok = r.test(form.password);
                return (
                  <li
                    key={r.label}
                    style={{ color: ok ? '#22c55e' : '#94a3b8' }}
                  >
                    {ok ? '✓' : '○'} {r.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 6 }}
            disabled={submitting || !validatePassword(form.password)}
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div style={{ marginTop: 14 }}>
          <GoogleSignInButton label="Sign up with Google" />
        </div>

        <p style={{ marginTop: 18, fontSize: 14, color: '#6b7280' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
