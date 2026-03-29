const BASE = "/api";

// ── core request helper ───────────────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

// ── auth ──────────────────────────────────────────────────────────────────────

export const apiSignup = (form) =>
  request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: form.name,
      email:     form.email,
      phone:     form.phone,
      password:  form.password,
    }),
  });

export const apiLogin = (form) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email:    form.email,
      password: form.password,
    }),
  });

export const apiLogout = () =>
  request("/auth/logout", { method: "POST" });

export const apiForgotPassword = (email) =>
  request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

// ── user ──────────────────────────────────────────────────────────────────────

export const apiGetMe = () =>
  request("/user/me");

export const apiUpdateProfile = (updates) =>
  request("/user/update", {
    method: "PUT",
    body: JSON.stringify(updates),
  });

// ── rides ─────────────────────────────────────────────────────────────────────

export const apiGetRides = (date) =>
  request(`/rides${date ? `?date=${date}` : ""}`);

export const apiGetMyRides = () =>
  request("/rides/mine");

export const apiCreateRide = (ride) =>
  request("/rides", {
    method: "POST",
    body: JSON.stringify(ride),
  });

// update how many seats are filled (when someone contacts you and joins)
export const apiUpdateSeats = (id, filled_seats) =>
  request(`/rides/${id}/seats`, {
    method: "PATCH",
    body: JSON.stringify({ filled_seats }),
  });

export const apiCancelRide = (id) =>
  request(`/rides/${id}`, { method: "DELETE" });