
const BASE = "https://cabshare-backend-qx4c.onrender.com";

// ── Token storage ─────────────────────────────────────────────────────────────
// Cookies don't work cross-origin (Vercel + Render = different domains).
// Store tokens in localStorage, send as Authorization: Bearer header instead.
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

// ── Core request ──────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = tokenStore.get();

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

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