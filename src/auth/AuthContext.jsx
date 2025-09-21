import { useEffect, useMemo, useState } from "react";
import {
  getStoredToken,
  setAuthToken,
  me,
  login as apiLogin,
  logout as apiLogout,
} from "../lib/api";
import { AuthCtx } from "./auth-context";
import { onAuthEvent } from "../lib/api";
import { useNavigate } from "react-router-dom";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { token, remember } = getStoredToken();
    if (token) setAuthToken(token, remember);
    (async () => {
      try {
        if (token) {
          const u = await me();
          setUser(u || null);
        }
      } catch {
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // Listen for session-expired events from API layer
    const off = onAuthEvent(async (type) => {
      if (type === "session-expired") {
        try {
          await apiLogout();
        } finally {
          setUser(null);
          // Redirect to login preserving destination
          navigate("/login", { replace: true });
        }
      }
    });
    return off;
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(creds, { remember = true } = {}) {
        const res = await apiLogin(creds, remember);
        if (res?.user) setUser(res.user);
        return res;
      },
      async logout() {
        await apiLogout();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
