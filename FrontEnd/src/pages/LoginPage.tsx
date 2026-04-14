import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/http";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/sessions" replace />;
  }

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/sessions";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({
          username,
          email,
          password,
          paymentLink: paymentLink.trim() || undefined
        });
      }
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="hero-card">
        <header className="hero-nav">
          <h1>Poker Buy-In Tracker</h1>
          <nav>
            <a href="#product">Product</a>
            <a href="#features">Features</a>
            <a href="#login">Log in</a>
          </nav>
        </header>

        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Smooth poker nights</p>
            <h2>Stop losing track of poker buy-ins. Keep every session organised end-to-end.</h2>
            <p>
              Track sessions, players, invites, buy-ins, and cash-outs.
            </p>
          </div>

          <form id="login" className="login-card" onSubmit={handleSubmit}>
            <div>
              <p className="eyebrow">{mode === "login" ? "Login" : "Register"}</p>
              <h3>{mode === "login" ? "Connect to your backend" : "Create your account"}</h3>
            </div>

            <div className="auth-toggle">
              <button
                type="button"
                className={mode === "login" ? "toggle-button active" : "toggle-button"}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === "register" ? "toggle-button active" : "toggle-button"}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </div>

            {mode === "register" ? (
              <label className="form-field">
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Jack"
                  required
                />
              </label>
            ) : null}

            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="form-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>

            {mode === "register" ? (
              <label className="form-field">
                <span>Payment Link</span>
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(event) => setPaymentLink(event.target.value)}
                  placeholder="https://paypal.me/your-link"
                />
              </label>
            ) : null}

            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="button" disabled={loading}>
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Log in"
                  : "Register"}
            </button>

          </form>
        </div>
      </section>
    </div>
  );
}
