// Simple browser logger with levels controlled by VITE_LOG_LEVEL
// Levels: debug < info < warn < error < silent

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 50 };

const envLevel = (import.meta.env.VITE_LOG_LEVEL || "").toLowerCase();
const defaultLevel = import.meta.env.PROD ? "info" : "debug";
const levelName = LEVELS[envLevel] ? envLevel : defaultLevel;
const threshold = LEVELS[levelName];

function ts() {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function makeLog(fn, lvl) {
  const lvlValue = LEVELS[lvl];
  return (...args) => {
    if (lvlValue < threshold) return;
    try {
      // Prefix with timestamp and app tag
      fn(`[${ts()}] [BISUTORO] [${lvl.toUpperCase()}]`, ...args);
    } catch {
      // noop
    }
  };
}

export const logger = {
  level: levelName,
  debug: makeLog(console.debug.bind(console), "debug"),
  info: makeLog(console.info.bind(console), "info"),
  warn: makeLog(console.warn.bind(console), "warn"),
  error: makeLog(console.error.bind(console), "error"),
};

export default logger;
