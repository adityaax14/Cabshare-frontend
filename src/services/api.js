
const BASE = "https://cabshare-backend-qx4c.onrender.com";

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
  const guest = guestStore.get();
  const guestId = guest?.guest_id;

  const headers = {
    "Content-Type": "application/json",
    ...(guestId ? { "x-guest-id": guestId } : {}),
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