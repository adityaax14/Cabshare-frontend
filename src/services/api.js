
const BASE = "https://cabshare-backend-qx4c.onrender.com";

// ── Token storage ─────────────────────────────────────────────────────────────
const TOKEN_KEY   = "ctf_token";
const REFRESH_KEY = "ctf_refresh";

export const tokenStore = {
  get:        ()  => localStorage.getItem(TOKEN_KEY),
  set:        (t) => localStorage.setItem(TOKEN_KEY, t),
  getRefresh: ()  => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t) => localStorage.setItem(REFRESH_KEY, t),
  clear:      ()  => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ── Global auth-expired handler ───────────────────────────────────────────────
// App.jsx sets this so we can kick the user to login immediately
let _onAuthExpired = null;
export function setOnAuthExpired(fn) { _onAuthExpired = fn; }

// ── JWT helpers ───────────────────────────────────────────────────────────────
// Decode a JWT payload without any library (works in all browsers)
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Check if the access token is expired (or will expire in the next 60 seconds)
function isTokenExpired(token) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  // Add 60-second buffer — treat as expired if it expires within a minute
  return Date.now() >= (payload.exp * 1000) - 60_000;
}

// ── Silent token refresh ──────────────────────────────────────────────────────
let _refreshPromise = null; // prevent multiple simultaneous refreshes

async function silentRefresh() {
  // If a refresh is already in progress, wait for it
  if (_refreshPromise) return _refreshPromise;

  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;

  _refreshPromise = (async () => {
    try {
      // Use a 10-second timeout — don't wait for Render's cold start
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (!res.ok) return false;

      const data = await res.json();
      if (data.access_token) {
        tokenStore.set(data.access_token);
        if (data.refresh_token) tokenStore.setRefresh(data.refresh_token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ── Ensure we have a valid token before making any API call ───────────────────
// This is the KEY fix: instead of sending an expired token to a cold-starting
// Render server (which takes 1-4 minutes just to tell us "token expired"),
// we check expiry client-side FIRST and refresh proactively.
async function ensureValidToken() {
  const token = tokenStore.get();
  if (!token) return false;

  if (!isTokenExpired(token)) return true; // still valid, proceed

  // Token is expired — try silent refresh
  const refreshed = await silentRefresh();
  if (refreshed) return true;

  // Refresh failed — session is truly dead
  tokenStore.clear();
  _onAuthExpired?.();
  return false;
}

// ── Core request (with auto-retry on 401) ─────────────────────────────────────
async function request(path, options = {}) {
  // Step 1: proactively refresh if token looks expired
  const hasAuth = await ensureValidToken();

  // If this is an authenticated endpoint and we have no valid token, bail fast
  const isPublicPath = path === "/auth/login" || path === "/auth/signup" || path === "/auth/forgot-password";
  if (!hasAuth && !isPublicPath) {
    throw new Error("Session expired. Please log in again.");
  }

  const token = tokenStore.get();

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  // Step 2: if we still get a 401 (edge case: token expired between check and request),
  // try one more refresh + retry
  if (res.status === 401 && !isPublicPath) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      const newToken = tokenStore.get();
      const retryRes = await fetch(`${BASE}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        },
        ...options,
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok) throw new Error(retryData.error || "Something went wrong");
      return retryData;
    }

    // Refresh failed — force re-login
    tokenStore.clear();
    _onAuthExpired?.();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");

  return data;
}

// ── Save tokens after login / signup ──────────────────────────────────────────
function saveTokens(data) {
  if (data.access_token)  tokenStore.set(data.access_token);
  if (data.refresh_token) tokenStore.setRefresh(data.refresh_token);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const apiSignup = async (form) => {
  const data = await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: form.name,
      email:     form.email,
      phone:     form.phone,
      password:  form.password,
    }),
  });
  saveTokens(data);
  return data;
};

export const apiLogin = async (form) => {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email:    form.email,
      password: form.password,
    }),
  });
  saveTokens(data);
  return data;
};

export const apiLogout = async () => {
  try { await request("/auth/logout", { method: "POST" }); } catch { /* ignore */ }
  tokenStore.clear();
};

export const apiForgotPassword = (email) =>
  request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

// ── User ──────────────────────────────────────────────────────────────────────

export const apiGetMe = () => request("/user/me");

export const apiUpdateProfile = (updates) =>
  request("/user/update", {
    method: "PUT",
    body: JSON.stringify(updates),
  });

// ── Rides ─────────────────────────────────────────────────────────────────────

export const apiGetRides = (date) =>
  request(`/rides${date ? `?date=${date}` : ""}`);

export const apiGetMyRides = () =>
  request("/rides/mine");

export const apiCreateRide = (ride) =>
  request("/rides", {
    method: "POST",
    body: JSON.stringify(ride),
  });

export const apiUpdateSeats = (id, filled_seats) =>
  request(`/rides/${id}/seats`, {
    method: "PATCH",
    body: JSON.stringify({ filled_seats }),
  });

export const apiCancelRide = (id) =>
  request(`/rides/${id}`, { method: "DELETE" });