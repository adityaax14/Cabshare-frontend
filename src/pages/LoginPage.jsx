import { useState } from "react";
import { apiLogin, apiSignup, apiForgotPassword } from "../services/api";
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
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div className="field">
      <label>{label}</label>
      <div className="field-wrap">
        <input
          type={isPass && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          className={`${isPass ? "has-toggle" : ""} ${error ? "error" : ""}`}
        />
        {isPass && (
          <button className="toggle-btn" onClick={() => setShow(s => !s)}>
            {show ? "hide" : "show"}
          </button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", disabled }) {
  const cls = {
    primary: "btn-primary",
    orange:  "btn-orange",
    ghost:   "btn-ghost",
  }[variant];
  return (
    <button className={`btn ${cls}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div className="divider">
      <div className="divider-line" />
      <span>or</span>
      <div className="divider-line" />
    </div>
  );
}

// ── Step dots ─────────────────────────────────────────────────────────────────
function Steps({ current, total }) {
  return (
    <div className="steps">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`step-dot ${
            i === current ? "active" : i < current ? "done" : "inactive"
          }`}
        />
      ))}
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="server-error">{message}</div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LoginPage({ onAuthSuccess }) {
  const [mode, setMode]               = useState("login");
  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirm: "",
  });
  const [errors, setErrors] = useState({});

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: "" }));
    setServerError("");
  };

  const clearAll = () => {
    setForm({ name: "", email: "", phone: "", password: "", confirm: "" });
    setErrors({});
    setServerError("");
    setStep(0);
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateLogin = () => {
    const e = {};
    if (!form.email.includes("@"))
      e.email = "Enter a valid email";
    if (!form.password)
      e.password = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep0 = () => {
    const e = {};
    if (!form.name.trim())
      e.name = "Name is required";
    if (!form.email.includes("@"))
      e.email = "Enter a valid email";
    if (!/^\d{10}$/.test(form.phone))
      e.phone = "Enter a valid 10-digit number";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep1 = () => {
    const e = {};
    if (form.password.length < 8)
      e.password = "Minimum 8 characters";
    if (form.password !== form.confirm)
      e.confirm = "Passwords don't match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    try {
      await apiLogin(form);
      onAuthSuccess?.();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep0 = () => {
    if (validateStep0()) setStep(1);
  };

  const handleStep1 = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      await apiSignup(form);
      setServerError("");
      alert("Account created! You're being signed in...");
      onAuthSuccess?.();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email.includes("@")) {
      setErrors(e => ({ ...e, email: "Enter your email first" }));
      return;
    }
    setLoading(true);
    try {
      await apiForgotPassword(form.email);
      alert("Password reset email sent! Check your inbox.");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Login screen ────────────────────────────────────────────────────────────
  if (mode === "login") return (
    <div className="auth-shell">
      <div className="auth-card">

        <div className="brand-row">
          <Logo size={44} />
          <div>
            <p className="brand-name">Cab to <span>Flight</span></p>
            <p className="brand-college">Manipal Institute of Technology</p>
          </div>
        </div>

        <h2 className="auth-heading">Welcome back</h2>
        <p className="auth-sub">Sign in to find your ride pool</p>

        <ErrorBanner message={serverError} />

        <Field
          label="Email" type="email"
          placeholder="your@email.com"
          value={form.email} onChange={v => setField("email", v)}
          error={errors.email}
        />
        <Field
          label="Password" type="password" placeholder="Your password"
          value={form.password} onChange={v => setField("password", v)}
          error={errors.password}
        />

        <div className="forgot-link">
          <span onClick={handleForgotPassword}>Forgot password?</span>
        </div>

        <Btn onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in…" : "Sign In →"}
        </Btn>

        <Divider />

        <Btn variant="ghost" onClick={() => { setMode("signup"); clearAll(); }}>
          Create an account
        </Btn>

        <div className="trust-badge">
          <div className="trust-dot" />
          <p className="creator-tag">Made by Aditya · CSE B · 2nd Year</p>
        </div>

      </div>
    </div>
  );

  // ── Signup screen ───────────────────────────────────────────────────────────
  return (
    <div className="auth-shell">
      <div className="auth-card">

        <div className="brand-row">
          <Logo size={36} />
          <p className="brand-name">Cab to <span>Flight</span></p>
        </div>

        <h2 className="auth-heading">
          {step === 0 ? "Create account" : "Almost there"}
        </h2>
        <p className="auth-sub">
          {step === 0
            ? "Join your college's cab pool network"
            : "Set up your password"}
        </p>

        <Steps current={step} total={2} />

        <ErrorBanner message={serverError} />

        {step === 0 ? (
          <>
            <Field
              label="Full Name" placeholder="As on your ID card"
              value={form.name} onChange={v => setField("name", v)}
              error={errors.name}
            />
            <Field
              label="Email" type="email"
              placeholder="your@email.com"
              value={form.email} onChange={v => setField("email", v)}
              error={errors.email}
            />
            <Field
              label="Phone Number" type="tel" placeholder="10-digit mobile number"
              value={form.phone}
              onChange={v => setField("phone", v.replace(/\D/g, "").slice(0, 10))}
              error={errors.phone}
            />
            <Btn onClick={handleStep0}>Continue →</Btn>
            <Divider />
            <Btn variant="ghost" onClick={() => { setMode("login"); clearAll(); }}>
              Already have an account
            </Btn>
          </>
        ) : (
          <>
            <Field
              label="Create Password" type="password" placeholder="Min. 8 characters"
              value={form.password} onChange={v => setField("password", v)}
              error={errors.password}
            />
            <Field
              label="Confirm Password" type="password" placeholder="Repeat your password"
              value={form.confirm} onChange={v => setField("confirm", v)}
              error={errors.confirm}
            />
            <Btn onClick={handleStep1} variant="orange" disabled={loading}>
              {loading ? "Creating account…" : "Create Account →"}
            </Btn>
            <div className="mt-12">
              <Btn variant="ghost" onClick={() => { setStep(0); setErrors({}); setServerError(""); }}>
                ← Back
              </Btn>
            </div>
          </>
        )}

      </div>
    </div>
  );
}