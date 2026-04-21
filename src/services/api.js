
const BASE = "https://cabshare-backend-qx4c.onrender.com";

// ── Token storage (JWT auth) ──────────────────────────────────────────────────
const TOKEN_KEY = "ctf_tokens";

export const tokenStore = {
  get: () => {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: (tokens) => localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens)),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// ── Guest storage ─────────────────────────────────────────────────────────────
const GUEST_KEY = "ctf_guest";

export const guestStore = {
  get: () => {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: (guest) => localStorage.setItem(GUEST_KEY, JSON.stringify(guest)),
  clear: () => localStorage.removeItem(GUEST_KEY),
};

// ── Core request ──────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const tokens = tokenStore.get();
  const guest = guestStore.get();
  const guestId = guest?.guest_id;

  const headers = {
    "Content-Type": "application/json",
    ...(tokens?.access_token
      ? { Authorization: `Bearer ${tokens.access_token}` }
      : {}),
    ...(guestId ? { "x-guest-id": guestId } : {}),
    "x-bot-check": "cabshare-manipal-2024",
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");

  return data;
}

// ── JWT auth ──────────────────────────────────────────────────────────────────

export const apiLogin = async ({ email, password }) => {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  tokenStore.set({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  return data;
};

export const apiSignup = async ({ name, email, phone, password }) => {
  const data = await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: name.trim(),
      email,
      phone,
      password,
    }),
  });

  tokenStore.set({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  return data;
};

export const apiLogout = async () => {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  tokenStore.clear();
};

export const apiForgotPassword = async (email) => {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

// ── Guest auth ────────────────────────────────────────────────────────────────

export const apiGuestLogin = async ({ name, phone }) => {
  const data = await request("/guest", {
    method: "POST",
    body: JSON.stringify({ name: name.trim(), phone }),
  });

  // Save guest session
  guestStore.set({
    guest_id: data.guest_id,
    full_name: data.full_name,
    phone: data.phone,
  });

  return data;
};

export const apiGuestLogout = () => {
  guestStore.clear();
};

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