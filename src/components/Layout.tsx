import { Link, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/api';

export function Layout() {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    navigate('/login');
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          Order CRM
        </Link>
        <nav>
          <Link to="/">Orders</Link>
          <Link to="/orders/new" className="button">
            New order
          </Link>
          <button type="button" className="link-button" onClick={logout}>
            Log out
          </button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
