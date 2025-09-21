import { useEffect, useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa6";

const STORAGE_KEY = "theme-preference";

function getSystemPreference() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "system") {
    const sys = getSystemPreference();
    root.classList.toggle("dark", sys === "dark");
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "system";
    } catch {
      return "system";
    }
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (theme === "system") applyTheme("system");
    };
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [theme]);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {["light", "dark", "system"].map((mode) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          className={`px-2 py-1 rounded text-xs border transition-colors border-secondary/40 ${
            theme === mode
              ? "bg-primary-soft font-semibold text-primary"
              : "hover:bg-secondary/20 text-muted"
          }`}
          aria-pressed={theme === mode}
        >
          {mode === "light" ? (
            <FaSun></FaSun>
          ) : mode === "dark" ? (
            <FaMoon></FaMoon>
          ) : mode === "system" ? (
            "auto"
          ) : (
            ""
          )}
        </button>
      ))}
    </div>
  );
}
