import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { ReactComponent as Logo } from "../../assets/logo.svg";
import { useAuth } from "../../auth/auth-context";

export default function Navbar({ items }) {
  const defaultItems = useMemo(
    () => [
      { to: "/menu", label: "Menu" },
      { to: "/omakase", label: "Omakase" },
      { to: "/about", label: "About" },
    ],
    []
  );
  const navItems = Array.isArray(items) && items.length ? items : defaultItems;

  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  useEffect(() => {
    // Close the drawer on route change
    setOpen(false);
  }, [location.pathname]);

  const displayName = user?.name || user?.username || user?.email || "Admin";

  async function handleLogout() {
    try {
      await logout();
    } finally {
      // Ensure we leave protected area
      navigate("/login", { replace: true });
    }
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 shadow-xs shadow-gray-500 bg-background ">
        <div className="flex items-center justify-between h-14 px-3 ">
          <div className="flex items-center gap-2 text-primary">
            <Logo className="h-8 w-auto block fill-current" aria-hidden />
            {location.pathname.includes("dashboard") ? (
              <span className="font-semibold text-nowrap">
                Bisutoro <span className="text-base-fg">Dashboard</span>
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="font-semibold text-nowrap">
                  Bisutoro <span className="text-base-fg">on Magazine</span>
                </span>
                <span className="text-xs">マガジンストリートビストロ</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Menu"
              onClick={() => setOpen(true)}
              className="p-2 rounded hover:bg-secondary/20"
            >
              <span className="i-heroicons-bars-3 w-6 h-6" aria-hidden />
              <svg
                className="w-6 h-6 text-base-fg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar / Drawer */}
      {/* Overlay for mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <aside
        className={`fixed z-50 md:z-30 top-0 left-0 h-full w-64 bg-background border-r border-secondary/40 transform transition-transform duration-200 ease-out
        ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:block `}
        aria-label="Sidebar navigation"
      >
        <div className="h-14 px-3 flex items-center justify-between border-b border-secondary/40 ">
          <div className="flex items-center gap-2 text-primary">
            <Logo className="h-8 w-auto block fill-current" aria-hidden />
            {location.pathname.includes("dashboard") ? (
              <span className="font-semibold text-nowrap">
                Bisutoro <span className="text-base-fg">Dashboard</span>
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="font-semibold text-nowrap">
                  Bisutoro <span className="text-base-fg">on Magazine</span>
                </span>
                <span className="text-xs">マガジンストリートビストロ</span>
              </div>
            )}
          </div>
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="md:hidden p-2 rounded hover:bg-secondary/20"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-3 space-y-2 overflow-y-auto h-[calc(100%-56px-56px)] bg-[url('/light-waves.jpeg')]  bg-background/80 bg-cover bg-center bg-blend-soft-light mask-r-from-90% mask-b-from-60% ">
          {navItems.map((item) => (
            <div
              key={item.to}
              className="border-[2px] transition-colors hover:border-secondary/40 overflow-hidden border-background rounded-2xl bg-background    "
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-1.5 transition-all mask-r-from-0% border border-transparent  ${
                    isActive
                      ? "bg-primary text-contrast tracking-wider font-semibold"
                      : "text-base-fg"
                  }`
                }
                end={item.end}
              >
                {item.label}
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-background border-secondary/40 flex flex-col gap-2">
          {location.pathname.includes("dashboard") && (
            <div className="flex items-center justify-between">
              <div className="min-w-0  ">
                <div className="text-xs text-muted leading-tight">
                  Signed in as
                </div>
                <div
                  className="text-sm font-medium truncate text-base-fg"
                  title={displayName}
                >
                  {displayName}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1 rounded-2xl border border-secondary/40 hover:bg-secondary/20 text-base-fg"
              >
                Logout
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
