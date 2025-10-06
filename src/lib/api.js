import logger from "./logger";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_KEY = "auth_token";
let AUTH_TOKEN = null;
let refreshPromise = null; // single-flight guard for refresh

// Simple auth event bus for session expiration
const authListeners = new Set();
export function onAuthEvent(listener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}
function emitAuthEvent(type) {
  for (const l of authListeners) {
    try {
      l(type);
    } catch {
      // ignore listener errors
    }
  }
}

export function setAuthToken(token, remember = true, persist = true) {
  AUTH_TOKEN = token || null;
  try {
    if (!persist) return; // only set in-memory token
    if (token) {
      // store in chosen storage
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem(TOKEN_KEY);
      }
    } else {
      // clear token
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage unavailability
  }
}

export function getStoredToken() {
  try {
    const local = localStorage.getItem(TOKEN_KEY);
    if (local) return { token: local, remember: true };
  } catch {
    // localStorage unavailable or blocked
  }
  try {
    const session = sessionStorage.getItem(TOKEN_KEY);
    if (session) return { token: session, remember: false };
  } catch {
    // sessionStorage unavailable or blocked
  }
  return { token: null, remember: false };
}

// No need to store refresh token in JS; it's kept as an HttpOnly cookie by the server.

function withTimeout(promise, ms = 10000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), ms)
  );
  return Promise.race([promise, timeout]);
}

function isAuthPath(path) {
  // Normalize path only for decision (no URL join)
  if (!path) return false;
  return (
    path.startsWith("/api/login") ||
    path.startsWith("/api/logout") ||
    path.startsWith("/api/token/refresh")
  );
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const disableAuthRetry = options.disableAuthRetry || isAuthPath(path);
  const doFetch = () =>
    withTimeout(
      fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
        },
        credentials: "include",
        ...options,
      })
    );

  try {
    logger.debug("API request", { path, method: options.method || "GET" });
    let res = await doFetch();
    if (res.status === 401 && AUTH_TOKEN && !disableAuthRetry) {
      // try refresh once
      logger.info("Access token expired; attempting refresh");
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        logger.info("Refresh succeeded; retrying original request");
        res = await doFetch();
      } else {
        // Refresh failed; emit session expired
        logger.warn("Refresh failed; emitting session-expired");
        emitAuthEvent("session-expired");
      }
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      // attach status for callers if needed
      err.status = res.status;
      logger.warn("API non-OK response", { path, status: res.status });
      throw err;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }
    return await res.text();
  } catch (err) {
    logger.error("API error", { message: err?.message, status: err?.status });
    throw err;
  }
}

async function refreshAccessToken() {
  // Single-flight: if a refresh is already in progress, await it
  if (refreshPromise) return refreshPromise;

  // Determine remember based on how access token is stored
  const { remember } = getStoredToken();

  refreshPromise = (async () => {
    try {
      logger.debug("Refreshing token");
      const res = await withTimeout(
        fetch(`${BASE_URL}/api/token/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ remember }),
        })
      );
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      if (!data?.token) return false;
      setAuthToken(data.token, remember);
      logger.info("Token refresh complete");
      return true;
    } catch {
      logger.warn("Token refresh error");
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getMenu({ withReviews = true } = {}) {
  const q = withReviews ? "?withReviews=1" : "";
  const items = await request(`/api/menu${q}`);
  // Normalize into UI-friendly categories
  return normalizeMenu(items);
}

export { request };

// ---- Shapes & Normalizers ----

// Documented server item shape (example):
// {
//   id: number,
//   name: string,
//   description: string,
//   price: number,
//   category: string, // e.g. "appetizers"
//   is_available: boolean,
//   created_at: string,
//   updated_at: string
// }
export const ServerMenuItemShape = {
  id: "number",
  name: "string",
  description: "string",
  price: "number",
  base_price: "number|undefined",
  category: "string",
  is_available: "boolean",
  ingredients: "array|string|undefined",
  vegan: "boolean|number|undefined",
  gluten_free: "boolean|number|undefined",
  pieces_per_order: "number|undefined",
  base_pieces_per_order: "number|undefined",
  active_override: "object|boolean|undefined",
  created_at: "string",
  updated_at: "string",
};

// UI expects categories: [{ name, items: [{ name, desc, price }] }]
export function normalizeMenu(items) {
  if (!Array.isArray(items)) return [];
  // Filter out unavailable items and invalid entries
  const available = items.filter(
    (it) => it && (it.is_available === undefined || it.is_available === true)
  );
  const grouped = new Map();
  for (const it of available) {
    const cat = (it.category || "uncategorized").trim() || "uncategorized";
    const entry = {
      id: it.id,
      name: it.name ?? "Untitled",
      description: it.description ?? "",
      price: typeof it.price === "number" ? it.price : Number(it.price) || 0,
      base_price:
        it.base_price != null
          ? typeof it.base_price === "number"
            ? it.base_price
            : Number(it.base_price) || undefined
          : undefined,
      ingredients: normalizeIngredients(it.ingredients),
      // pass through dietary flags if present on server
      vegan: it.vegan === true || it.vegan === 1,
      gluten_free: it.gluten_free === true || it.gluten_free === 1,
      pieces_per_order: toPositiveInt(it.pieces_per_order),
      base_pieces_per_order: toPositiveInt(it.base_pieces_per_order),
      active_override: it.active_override || null,
      reviews: it.reviews || null,
    };
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat).push(entry);
  }
  // Sort items by name within each category for stable UI
  const categories = Array.from(grouped.entries()).map(([name, items]) => ({
    name: titleCase(name),
    items: items.sort((a, b) => a.name.localeCompare(b.name)),
  }));
  // Sort categories alphabetically
  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}

function titleCase(s) {
  return String(s)
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function normalizeIngredients(ing) {
  if (!ing) return [];
  if (Array.isArray(ing)) {
    return ing.map((x) => String(x).trim()).filter(Boolean);
  }
  // If server sends comma-separated string
  return String(ing)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function toPositiveInt(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return undefined;
  const i = Math.trunc(n);
  return i > 0 ? i : undefined;
}

// ---- Public tracking ----
export async function trackPhoneAction({ phone, action }) {
  const payload = { phone, action };
  // Try to use sendBeacon for fire-and-forget reliability
  try {
    const url = `${BASE_URL}/api/track/phone`;
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return { ok: true };
    }
  } catch {
    // ignore and fall back
  }
  // Fallback to fetch via our request helper
  try {
    await request(`/api/track/phone`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    // non-critical
  }
  return { ok: true };
}

export async function trackEmailAction({ email, action }) {
  const payload = { email, action };
  // Use sendBeacon when possible to avoid being canceled by navigation
  try {
    const url = `${BASE_URL}/api/track/email`;
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return { ok: true };
    }
  } catch {
    // ignore and use fetch fallback
  }
  try {
    await request(`/api/track/email`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    // non-critical failure
  }
  return { ok: true };
}

// ---- Auth endpoints ----
export async function login({ email, password }, remember = true) {
  const res = await request("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password, remember }),
    disableAuthRetry: true,
  });
  // Expect { token, user }
  if (res?.token) setAuthToken(res.token, remember);
  return res;
}

export async function logout() {
  try {
    await request("/api/logout", { method: "POST", disableAuthRetry: true });
  } catch {
    // ignore and proceed to clear tokens
  } finally {
    setAuthToken(null);
  }
}

export async function me() {
  const res = await request("/api/me");
  return res?.user || res;
}

// ---- Menu CRUD ----
export async function listMenuItems() {
  return await request("/api/menu");
}

export async function createMenuItem(payload) {
  return await request("/api/menu", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMenuItem(id, payload) {
  return await request(`/api/menu/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteMenuItem(id) {
  return await request(`/api/menu/${id}`, { method: "DELETE" });
}

// ---- Item details & reviews ----
export async function getMenuItem(id, { withReviews = true } = {}) {
  const q = withReviews ? "?withReviews=1" : "";
  return await request(`/api/menu/${id}${q}`);
}

export async function listItemReviews(id, { limit = 20, offset = 0 } = {}) {
  const p = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return await request(`/api/menu/${id}/reviews?${p.toString()}`);
}

export async function createItemReview(id, payload) {
  return await request(`/api/menu/${id}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listLatestReviews({ limit = 10, offset = 0 } = {}) {
  const p = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return await request(`/api/reviews/latest?${p.toString()}`);
}

// ---- Category CRUD ----
export async function listCategories() {
  // public active categories
  return await request("/api/categories");
}

export async function listAllCategories() {
  // admin: all categories
  return await request("/api/categories/all");
}

export async function createCategory(payload) {
  return await request("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(id, payload) {
  return await request(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function setCategoryActive(id, is_active) {
  return await request(`/api/categories/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: !!is_active }),
  });
}

export async function deleteCategory(id) {
  return await request(`/api/categories/${id}`, { method: "DELETE" });
}

// ---- Daily menu ----
// day: 0 (Sunday) .. 6 (Saturday)
export async function getDailyMenu(day) {
  return await request(`/api/daily-menu/${day}`);
}

// items: array of menu item ids in desired order
export async function setDailyMenu(day, items) {
  return await request(`/api/daily-menu/${day}`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}

// ---- App settings (admin) ----
export async function getAppSettings() {
  return await request(`/api/admin/settings`);
}

export async function updateAppSettings(patch) {
  return await request(`/api/admin/settings`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

// ---- Public app settings (end-user) ----
export async function getPublicAppSettings() {
  // server returns { app_settings: { ... } }
  const res = await request(`/api/settings`);
  return res?.app_settings || res;
}

// ---- Drinks (public) ----
export async function getDrinksMenu() {
  const res = await request(`/api/drinks`);
  // Server returns { sections: [...] }
  return Array.isArray(res?.sections) ? res.sections : [];
}

// ---- Drinks (admin) ----
export async function createDrinksSection(payload) {
  return await request(`/api/drinks/sections`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDrinksSection(id, payload) {
  return await request(`/api/drinks/sections/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteDrinksSection(id) {
  return await request(`/api/drinks/sections/${id}`, { method: "DELETE" });
}

export async function reorderDrinksSections(orderIds) {
  return await request(`/api/drinks/sections/reorder`, {
    method: "POST",
    body: JSON.stringify({ order: orderIds }),
  });
}

export async function createDrinksGroup(payload) {
  return await request(`/api/drinks/groups`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDrinksGroup(id, payload) {
  return await request(`/api/drinks/groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteDrinksGroup(id) {
  return await request(`/api/drinks/groups/${id}`, { method: "DELETE" });
}

export async function reorderDrinksGroups(sectionId, orderIds) {
  return await request(`/api/drinks/sections/${sectionId}/groups/reorder`, {
    method: "POST",
    body: JSON.stringify({ order: orderIds }),
  });
}

export async function createDrinksItem(payload) {
  return await request(`/api/drinks/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDrinksItem(id, payload) {
  return await request(`/api/drinks/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteDrinksItem(id) {
  return await request(`/api/drinks/items/${id}`, { method: "DELETE" });
}

// ---- Admin stats ----
export async function getVisitorTotals() {
  const res = await request(`/api/admin/metrics/visitors/totals`);
  return res?.data || res;
}

export async function getVisitorDaily({ from, to } = {}) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const res = await request(
    `/api/admin/metrics/visitors/daily${p.toString() ? `?${p.toString()}` : ""}`
  );
  return res?.data || res;
}

// ---- Clicks analytics (admin) ----
export async function getClicksDaily({ from, to, itemId } = {}) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  if (itemId) p.set("itemId", String(itemId));
  const res = await request(
    `/api/admin/metrics/clicks/daily${p.toString() ? `?${p.toString()}` : ""}`
  );
  return res?.data || res;
}

export async function getTopClicked({ from, to, limit = 10 } = {}) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  if (limit) p.set("limit", String(limit));
  const res = await request(
    `/api/admin/metrics/clicks/top${p.toString() ? `?${p.toString()}` : ""}`
  );
  return res?.data || res;
}

export async function getExternalClicksDaily({ from, to } = {}) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const res = await request(
    `/api/admin/metrics/external/daily${p.toString() ? `?${p.toString()}` : ""}`
  );
  return res?.data || res;
}

export async function getExternalTopClicked({ from, to, limit = 10 } = {}) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  if (limit) p.set("limit", String(limit));
  const res = await request(
    `/api/admin/metrics/external/top${p.toString() ? `?${p.toString()}` : ""}`
  );
  return res?.data || res;
}

// ---- Events (public) ----
export async function getActiveEvents() {
  // Returns array of currently active events (time window + is_active)
  return await request(`/api/events`);
}

export async function getAllEventsPublic() {
  // Returns array of all events without admin auth
  return await request(`/api/events/all-public`);
}

export async function getEventPublic(id) {
  return await request(`/api/events/${id}`);
}

// ---- Events (admin) ----
export async function listAllEvents() {
  return await request(`/api/events/all`);
}

export async function createEvent(payload) {
  // Expect shape: { title, description, starts_at, ends_at, image_url?, priority?, is_active? }
  return await request(`/api/events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(id, payload) {
  return await request(`/api/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(id) {
  return await request(`/api/events/${id}`, { method: "DELETE" });
}

// ---- Event overrides (admin) ----
export async function listEventOverrides(eventId) {
  return await request(`/api/events/${eventId}/overrides`);
}

export async function upsertEventOverride(eventId, itemId, payload) {
  return await request(`/api/events/${eventId}/overrides/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteEventOverride(eventId, itemId) {
  return await request(`/api/events/${eventId}/overrides/${itemId}`, {
    method: "DELETE",
  });
}
