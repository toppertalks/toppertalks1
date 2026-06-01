import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function LoginModal({ reason = 'use this feature', onClose, returnTo = '/' }) {
  const navigate = useNavigate();
  const go = (path) => {
    onClose?.();
    navigate(`${path}?next=${encodeURIComponent(returnTo)}`);
  };
  return (
    <div className="login-modal-backdrop" onClick={onClose}>
      <div className="login-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-handle" />
        <div className="login-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="login-modal-logo">🎓</div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>
                Sign in to continue
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>To {reason}</p>
            </div>
          </div>
          <button className="login-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="login-modal-divider" />
        <button className="login-modal-email-btn" onClick={() => go('/login')} style={{ marginBottom: 10 }}>
          Sign in with email
        </button>
        <button
          className="login-modal-email-btn"
          onClick={() => go('/register')}
          style={{ background: 'transparent', border: '1px solid rgba(99,102,241,0.4)' }}
        >
          Create new account
        </button>
        <p style={{ margin: '14px 0 0', fontSize: 11, textAlign: 'center', color: '#64748b' }}>
          By continuing you agree to our Terms &amp; Privacy
        </p>
      </div>
    </div>
  );
}
