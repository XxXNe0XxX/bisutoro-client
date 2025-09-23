import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password }, { remember });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-3 max-w-[480px] mx-auto">
      <h1 className="text-2xl font-bold text-primary">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4 ">
        <div className="space-y-1">
          <label className="text-sm text-muted">Email</label>
          <input
            type="email"
            className="w-full rounded-2xl p-3 border border-secondary/40 bg-background text-base-fg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-2xl p-3 pr-12 border border-secondary/40 bg-background text-base-fg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 text-sm text-muted hover:text-base-fg focus:outline-none"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <label htmlFor="remember" className="select-none text-muted">
            Remember me
          </label>
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-primary text-contrast disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
