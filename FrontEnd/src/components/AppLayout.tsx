import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { friends, invites } = useNotifications();

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
            <h1 className="shell-title">Poker Buy-In Tracker</h1>
          </div>
        </div>

        <nav className="shell-nav">
          <NavLink to="/sessions">Sessions</NavLink>
          <NavLink to="/connections">
            Friends
            {friends > 0 ? <span className="nav-dot">{friends}</span> : null}
          </NavLink>
          <NavLink to="/invites">
            Invites
            {invites > 0 ? <span className="nav-dot">{invites}</span> : null}
          </NavLink>
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
