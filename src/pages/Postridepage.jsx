import { useState } from "react";
import { apiCreateRide } from "../services/api";
import "../styles/Postridepage.css";

// ── Custom Time Picker ────────────────────────────────────────────────────────
function TimePicker({ value, onChange, placeholder = "Select time", error }) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState("--");
  const [minute, setMinute] = useState("--");
  const [period, setPeriod] = useState("AM");

  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  const handleSet = () => {
    if (hour === "--" || minute === "--") { onChange(""); setOpen(false); return; }
    let h24 = parseInt(hour);
    if (period === "AM" && h24 === 12) h24 = 0;
    if (period === "PM" && h24 !== 12) h24 += 12;
    onChange(`${String(h24).padStart(2, "0")}:${minute}`);
    setOpen(false);
  };

  const handleClear = () => {
    setHour("--"); setMinute("--"); setPeriod("AM");
    onChange(""); setOpen(false);
  };

  const display = value
    ? (() => {
        const [h, m] = value.split(":").map(Number);
        const ap = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
      })()
    : null;

  return (
    <div className="tp-wrap">
      <button
        type="button"
        className={`tp-trigger ${value ? "active" : ""} ${error ? "tp-error" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="tp-clock">🕐</span>
        <span style={{ color: display ? "#f0ede8" : "#4a5568" }}>{display || placeholder}</span>
        {value && (
          <span className="tp-clear-x" onClick={e => { e.stopPropagation(); handleClear(); }}>×</span>
        )}
      </button>

      {open && (
        <div className="tp-dropdown">
          <p className="tp-label">Select time</p>
          <div className="tp-cols">
            <div className="tp-col">
              <p className="tp-col-label">Hour</p>
              <div className="tp-scroll">
                {hours.map(h => (
                  <button type="button" key={h}
                    className={`tp-item ${hour === h ? "sel" : ""}`}
                    onClick={() => setHour(h)}>{h}</button>
                ))}
              </div>
            </div>
            <div className="tp-col">
              <p className="tp-col-label">Min</p>
              <div className="tp-scroll">
                {minutes.map(m => (
                  <button type="button" key={m}
                    className={`tp-item ${minute === m ? "sel" : ""}`}
                    onClick={() => setMinute(m)}>{m}</button>
                ))}
              </div>
            </div>
            <div className="tp-col">
              <p className="tp-col-label">Period</p>
              <div className="tp-scroll">
                {["AM", "PM"].map(p => (
                  <button type="button" key={p}
                    className={`tp-item ${period === p ? "sel" : ""}`}
                    onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="tp-actions">
            <button type="button" className="tp-cancel" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="tp-set" onClick={handleSet}>Set Time</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="38" width="38" height="14" rx="5" fill="#f07020" />
      <rect x="14" y="30" width="26" height="12" rx="4" fill="#f07020" />
      <rect x="16" y="32" width="10" height="8" rx="2" fill="#0d1b2a" opacity="0.5" />
      <rect x="28" y="32" width="10" height="8" rx="2" fill="#0d1b2a" opacity="0.5" />
      <circle cx="16" cy="52" r="5" fill="#0d1b2a" />
      <circle cx="16" cy="52" r="2.5" fill="#888" />
      <circle cx="36" cy="52" r="5" fill="#0d1b2a" />
      <circle cx="36" cy="52" r="2.5" fill="#888" />
      <g transform="rotate(-30 44 20)">
        <ellipse cx="44" cy="20" rx="14" ry="4" fill="#1a6bbf" />
        <polygon points="58,20 62,16 62,24" fill="#1a6bbf" />
        <polygon points="36,16 30,10 36,20" fill="#1a6bbf" />
        <polygon points="36,24 30,30 36,20" fill="#1464ad" />
      </g>
    </svg>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, error, children }) {
  return (
    <div className="post-field">
      {label && <label>{label}</label>}
      {children}
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  );
}

// ── Pool size stepper ─────────────────────────────────────────────────────────
function PoolStepper({ value, onChange }) {
  return (
    <div className="pool-size-wrap">
      <button
        className="pool-size-btn"
        onClick={() => { if (value > 2) onChange(value - 1); }}
        type="button"
      >−</button>
      <input
        className="pool-size-input"
        type="number"
        min={2}
        max={10}
        value={value}
        onChange={e => {
          const v = parseInt(e.target.value);
          if (!isNaN(v) && v >= 2 && v <= 10) onChange(v);
        }}
      />
      <button
        className="pool-size-btn"
        onClick={() => { if (value < 10) onChange(value + 1); }}
        type="button"
      >+</button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt24to12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PostRidePage({ onRidePosted, onBack }) {
  const [form, setForm] = useState({
    flight_number:   "",
    departure_date:  "",
    departure_time:  "",
    leave_campus_at: "",
    pool_size:       4,
    note:            "",
  });

  const [errors, setErrors]           = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [postedRide, setPostedRide]   = useState(null);

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
    setServerError("");
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.departure_date)
      e.departure_date = "Select your departure date";
    if (!form.departure_time)
      e.departure_time = "Enter your flight time";
    if (!form.leave_campus_at)
      e.leave_campus_at = "When are you leaving campus?";
    if (!form.pool_size || form.pool_size < 2)
      e.pool_size = "Minimum pool size is 2";
    setErrors(e);
    return !Object.keys(e).length;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const payload = {
        flight_number:   form.flight_number.trim().toUpperCase() || null,
        departure_date:  form.departure_date,
        departure_time:  form.departure_time,
        leave_campus_at: form.leave_campus_at,
        pool_size:       form.pool_size,
        note:            form.note || null,
      };
      const res = await apiCreateRide(payload);
      setPostedRide(res.ride);
      setSubmitted(true);
      onRidePosted?.();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ flight_number: "", departure_date: "", departure_time: "", leave_campus_at: "", pool_size: 4, note: "" });
    setErrors({});
    setServerError("");
    setSubmitted(false);
    setPostedRide(null);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted && postedRide) return (
    <div className="success-shell">
      <div className="success-card">
        <div className="success-icon">✈</div>
        <p className="success-title">Ride posted!</p>
        <p className="success-sub">
          Your request is live. Other students can now find and contact you to pool the cab.
        </p>
        <div className="success-detail">
          {postedRide.flight_number && (
            <div className="success-detail-row">
              <span>Flight</span>
              <span>{postedRide.flight_number}</span>
            </div>
          )}
          <div className="success-detail-row">
            <span>Date</span>
            <span>{fmtDate(postedRide.departure_date)}</span>
          </div>
          <div className="success-detail-row">
            <span>Flight time</span>
            <span>{fmt24to12(postedRide.departure_time)}</span>
          </div>
          <div className="success-detail-row">
            <span>Leaving campus</span>
            <span>{fmt24to12(postedRide.leave_campus_at)}</span>
          </div>
          <div className="success-detail-row">
            <span>Pool size</span>
            <span>{postedRide.pool_size} people</span>
          </div>
          <div className="success-detail-row">
            <span>Airport</span>
            <span>Mangalore (IXE)</span>
          </div>
        </div>
        <button className="btn-outline" onClick={resetForm}>Post another ride</button>
        <button className="btn-outline" onClick={onBack}>← View all rides</button>
      </div>
    </div>
  );

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="post-shell">

      <div className="post-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={30} />
          <span className="post-nav-title">Post a <span>Ride</span></span>
        </div>
        <div className="post-nav-airport">
          <div className="airport-dot" />
          Mangalore · IXE
        </div>
      </div>

      <div className="post-card">

        {/* ── Section 1: Flight info ── */}
        <div className="post-section">
          <p className="post-section-label">Flight Details</p>

          <Field label="Flight Number" hint="Optional — e.g. AI302, 6E201">
            <input
              type="text"
              placeholder="e.g. AI302"
              value={form.flight_number}
              onChange={e => setField("flight_number", e.target.value.toUpperCase())}
              style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}
            />
          </Field>

          <div className="post-grid">
            <Field label="Departure Date" error={errors.departure_date}>
              <input
                type="date"
                value={form.departure_date}
                onChange={e => setField("departure_date", e.target.value)}
                className={errors.departure_date ? "error" : ""}
                min={new Date().toISOString().split("T")[0]}
              />
            </Field>

            <Field label="Flight Time" error={errors.departure_time} hint="From your ticket">
              <TimePicker
                value={form.departure_time}
                onChange={v => setField("departure_time", v)}
                placeholder="Flight time"
                error={errors.departure_time}
              />
            </Field>
          </div>
        </div>

        {/* ── Section 2: Campus details ── */}
        <div className="post-section">
          <p className="post-section-label">Campus Pickup</p>

          <Field
            label="Leave Campus At"
            error={errors.leave_campus_at}
            hint="When should the cab leave MIT Manipal?"
          >
            <TimePicker
              value={form.leave_campus_at}
              onChange={v => setField("leave_campus_at", v)}
              placeholder="Departure time"
              error={errors.leave_campus_at}
            />
          </Field>
        </div>

        {/* ── Section 3: Pool size ── */}
        <div className="post-section">
          <p className="post-section-label">Pool Size</p>
          <Field hint="Total number of people including you" error={errors.pool_size}>
            <PoolStepper value={form.pool_size} onChange={v => setField("pool_size", v)} />
          </Field>
        </div>

        {/* ── Section 4: Note ── */}
        <div className="post-section">
          <p className="post-section-label">Note (optional)</p>
          <Field hint='e.g. "Girls only" or "Have heavy luggage"'>
            <textarea
              rows={3}
              placeholder="Any details for your pool mates..."
              value={form.note}
              onChange={e => setField("note", e.target.value)}
            />
          </Field>
        </div>

        {serverError && <div className="server-error">{serverError}</div>}

      </div>

      <div className="post-submit">
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="spinner" />Posting…</> : "Post Ride Request →"}
        </button>
      </div>

    </div>
  );
}