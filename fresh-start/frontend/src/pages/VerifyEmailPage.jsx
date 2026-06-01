import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const emailFromQuery = params.get('email') || '';
  const tokenFromQuery = params.get('token');

  const [email, setEmail] = useState(emailFromQuery);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [status, setStatus] = useState({ kind: 'idle', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const linkVerifyRan = useRef(false);

  useEffect(() => {
    if (!tokenFromQuery || linkVerifyRan.current) return;
    linkVerifyRan.current = true;
    setStatus({ kind: 'pending', message: 'Verifying...' });
    (async () => {
      try {
        await authApi.verifyEmail(tokenFromQuery);
        setStatus({ kind: 'ok', message: 'Email verified! Redirecting to sign in...' });
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      } catch (err) {
        const detail = err?.response?.data?.detail;
        setStatus({
          kind: 'error',
          message:
            (typeof detail === 'string' && detail) ||
            'Verification link is invalid or expired. Enter the 6-digit code instead.',
        });
      }
    })();
  }, [tokenFromQuery, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!tokenFromQuery) inputRefs.current[0]?.focus();
  }, [tokenFromQuery]);

  const setDigit = (idx, value) => {
    const v = value.replace(/\D/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const otpValue = digits.join('');
  const canSubmit = email && otpValue.length === OTP_LENGTH && !submitting;

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setStatus({ kind: 'pending', message: 'Verifying...' });
    try {
      await authApi.verifyEmailOtp(email, otpValue);
      setStatus({ kind: 'ok', message: 'Email verified! Redirecting to sign in...' });
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setStatus({
        kind: 'error',
        message: (typeof detail === 'string' && detail) || 'Verification failed',
      });
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setStatus({ kind: 'idle', message: '' });
    try {
      await authApi.sendVerificationOtp(email);
      setStatus({ kind: 'info', message: 'A new code has been sent to your email.' });
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 429 && typeof detail === 'string') {
        const m = detail.match(/(\d+)/);
        if (m) setCooldown(parseInt(m[1], 10));
      }
      setStatus({
        kind: 'error',
        message: (typeof detail === 'string' && detail) || 'Could not send code',
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Verify your email</h2>
        <p className="subtle">
          We sent a 6-digit code to <strong>{email || 'your email'}</strong>.
          Enter it below, or click the link in the email.
        </p>

        {status.kind === 'error' && <div className="error">{status.message}</div>}
        {status.kind === 'info' && (
          <div style={{ background: '#0f172a', color: '#93c5fd', padding: 10, borderRadius: 8, marginBottom: 10 }}>
            {status.message}
          </div>
        )}
        {status.kind === 'ok' && (
          <div style={{ background: '#052e16', color: '#86efac', padding: 10, borderRadius: 8, marginBottom: 10 }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleVerify}>
          {!emailFromQuery && (
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
          )}

          <div className="form-group">
            <label>6-digit code</label>
            <div
              style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'space-between' }}
              onPaste={handlePaste}
            >
              {digits.map((d, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    width: 44,
                    height: 52,
                    fontSize: 22,
                    fontWeight: 700,
                    textAlign: 'center',
                    borderRadius: 8,
                    border: '1px solid rgba(99,102,241,0.3)',
                    background: 'rgba(15,23,42,0.6)',
                    color: '#e2e8f0',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 6 }}
            disabled={!canSubmit}
          >
            {submitting ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 14, color: '#6b7280' }}>
          Didn't get the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || !email}
            style={{
              background: 'none',
              border: 'none',
              color: cooldown > 0 ? '#475569' : '#818cf8',
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              padding: 0,
              fontWeight: 600,
            }}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>

        <p style={{ marginTop: 18, fontSize: 14, color: '#6b7280' }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
