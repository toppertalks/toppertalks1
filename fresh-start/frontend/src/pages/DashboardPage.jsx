import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="content">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Welcome, {user.full_name || user.email}</h2>
        <p className="subtle" style={{ marginBottom: 24 }}>
          You are signed in. Below is a snapshot of your account.
        </p>

        <div className="kv">
          <div className="k">User ID</div>
          <div>{user.id}</div>

          <div className="k">Email</div>
          <div>{user.email}</div>

          <div className="k">Active</div>
          <div>{String(user.is_active)}</div>

          <div className="k">Verified</div>
          <div>{String(user.is_verified)}</div>

          <div className="k">Superuser</div>
          <div>{String(user.is_superuser)}</div>

          <div className="k">MFA enabled</div>
          <div>{String(user.mfa_enabled)}</div>

          <div className="k">Last login</div>
          <div>{user.last_login_at || '—'}</div>

          <div className="k">Roles</div>
          <div>
            {user.role_names?.length
              ? user.role_names.map((r) => <span key={r} className="chip">{r}</span>)
              : '—'}
          </div>

          <div className="k">Permissions</div>
          <div>
            {user.permission_codes?.length
              ? user.permission_codes.map((p) => <span key={p} className="chip">{p}</span>)
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
