import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <h1>ToppertTalks</h1>
      <div className="right">
        {user ? (
          <>
            <nav>
              <Link to="/">Dashboard</Link>
            </nav>
            <span style={{ color: '#6b7280', fontSize: 14 }}>{user.email}</span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <nav>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
