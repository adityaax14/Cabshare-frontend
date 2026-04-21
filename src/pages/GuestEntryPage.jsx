import { useState } from "react";
import { apiGuestLogin } from "../services/api";
import "../styles/LoginPage.css";

// ── SVG Logo ──────────────────────────────────────────────────────────────────
function Logo({ size = 48 }) {
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
      <path d="M 10 50 Q 32 10 54 14" stroke="#1a6bbf" strokeWidth="1.5"
        fill="none" strokeDasharray="3 3" opacity="0.4" />
    </svg>
  );
}

// ── Reusable Field ────────────────────────────────────────────────────────────
function Field({ label, type = "text", placeholder, value, onChange, hint, error }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="field-wrap">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          className={error ? "error" : ""}
        />
      </div>
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="server-error">{message}</div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GuestEntryPage({ onGuestReady }) {
  const [name, setName]                 = useState("");
  const [phone, setPhone]               = useState("");
  const [errors, setErrors]             = useState({});
  const [serverError, setServerError]   = useState("");
  const [loading, setLoading]           = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!/^\d{10}$/.test(phone)) e.phone = "Enter a valid 10-digit number";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      await apiGuestLogin({ name: name.trim(), phone });
      onGuestReady?.();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleContinue();
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">

        <div className="brand-row">
          <Logo size={44} />
          <div>
            <p className="brand-name">Cab to <span>Flight</span></p>
            <p className="brand-college">Manipal Institute of Technology</p>
          </div>
        </div>

        <h2 className="auth-heading">Welcome!</h2>
        <p className="auth-sub">
          Enter your name and phone to find or post cab pools to IXE airport.
        </p>

        <ErrorBanner message={serverError} />

        <Field
          label="Your Name"
          placeholder="As on your ID card"
          value={name}
          onChange={v => { setName(v); setErrors(e => ({ ...e, name: "" })); setServerError(""); }}
        />
        <Field
          label="Phone Number"
          type="tel"
          placeholder="10-digit mobile number"
          value={phone}
          onChange={v => {
            setPhone(v.replace(/\D/g, "").slice(0, 10));
            setErrors(e => ({ ...e, phone: "" }));
            setServerError("");
          }}
          hint="Others will see this so they can reach you"
          error={errors.phone}
        />

        <div onKeyDown={handleKeyDown}>
          <button
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Setting up…" : "Let's Go →"}
          </button>
        </div>

        <div className="trust-badge">
          <div className="trust-dot" />
          <p className="creator-tag">Made by Aditya · CSE B · 2nd Year</p>
        </div>

      </div>
    </div>
  );
}
