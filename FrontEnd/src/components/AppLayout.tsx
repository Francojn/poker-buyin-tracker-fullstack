import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div className="shell-brand">
          <span className="brand-mark">P</span>
          <div>
            <p className="eyebrow">Poker Buy-In Tracker</p>
            <h1 className="shell-title">Product dashboard</h1>
          </div>
        </div>

        <nav className="shell-nav">
          <NavLink to="/sessions">Sessions</NavLink>
          <NavLink to="/connections">Connections</NavLink>
          <NavLink to="/invites">Invites</NavLink>
        </nav>

        <div className="shell-user">
          <span>{user?.username ?? "Signed in"}</span>
          <button type="button" className="button button-secondary button-small" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
