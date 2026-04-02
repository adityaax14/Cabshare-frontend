import { useState, useEffect } from "react";
import "../styles/Resetpasswordpage.css";

// ── How Supabase reset flow works ─────────────────────────────────────────────
// 1. User clicks "Forgot password" → backend calls supabase.auth.resetPasswordForEmail
// 2. Supabase emails a link: http://localhost:5173/reset-password#access_token=xxx&type=recovery
// 3. User clicks it → lands here
// 4. We read the access_token from the URL hash
// 5. We call our backend with that token + new password
// 6. Backend calls supabase.auth.admin.updateUserById to set the new password

const BASE = "https://cabshare-backend-qx4c.onrender.com";

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, type, placeholder, value, onChange, error, children }) {
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
          className={`${isPass ? "has-toggle" : ""} ${error ? "error" : ""}`}
          autoComplete={isPass ? "new-password" : "off"}
        />
        {isPass && (
          <button className="toggle-btn" onClick={() => setShow(s => !s)}>
            {show ? "hide" : "show"}
          </button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ResetPasswordPage({ onBack }) {
  const [accessToken, setAccessToken] = useState(null);
  const [tokenType, setTokenType]     = useState(null);
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [errors, setErrors]           = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);

  // ── Read token from URL hash on mount ───────────────────────────────────────
  useEffect(() => {
    // Supabase puts tokens in hash: #access_token=xxx&type=recovery&...
    const hash = window.location.hash.slice(1); // remove leading #
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    const type  = params.get("type");

    if (token && type === "recovery") {
      setAccessToken(token);
      setTokenType(type);
      // clean the URL so token isn't visible / reusable
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (password.length < 8)
      e.password = "Minimum 8 characters";
    if (password !== confirm)
      e.confirm = "Passwords don't match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`${BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ access_token: accessToken, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setDone(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(password);

  // ── No valid token ──────────────────────────────────────────────────────────
  if (!accessToken) return (
    <div className="reset-shell">
      <div className="reset-card">
        <div className="reset-invalid">
          <div className="reset-invalid-icon">🔗</div>
          <p className="reset-invalid-title">Link expired or invalid</p>
          <p className="reset-invalid-sub">
            Password reset links expire after 1 hour.<br />
            Request a new one from the login page.
          </p>
          <button className="btn btn-primary" onClick={onBack}>
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );

  // ── Success ─────────────────────────────────────────────────────────────────
  if (done) return (
    <div className="reset-shell">
      <div className="reset-card">
        <div className="reset-success">
          <div className="reset-success-icon">✅</div>
          <p className="reset-success-title">Password updated</p>
          <p className="reset-success-sub">
            Your password has been changed successfully.<br />
            Sign in with your new password.
          </p>
          <button className="btn btn-primary" onClick={onBack}>
            Go to login →
          </button>
        </div>
      </div>
    </div>
  );

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="reset-shell">
      <div className="reset-card">
        <div className="reset-header">
          <button className="reset-back" onClick={onBack}>← Back to login</button>
          <p className="reset-title">Set new password</p>
          <p className="reset-sub">Choose a strong password for your account.</p>
        </div>

        {serverError && <div className="server-error">{serverError}</div>}

        <Field
          label="New Password"
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={v => { setPassword(v); setErrors(e => ({ ...e, password: "" })); }}
          error={errors.password}
        >
          {/* strength indicator */}
          {password && (
            <>
              <div className="strength-bar">
                <div className={`strength-seg ${strength === "weak" || strength === "medium" || strength === "strong" ? strength : ""}`} />
                <div className={`strength-seg ${strength === "medium" || strength === "strong" ? strength : ""}`} />
                <div className={`strength-seg ${strength === "strong" ? strength : ""}`} />
              </div>
              <p className={`strength-label ${strength}`}>
                {strength === "weak" && "Weak password"}
                {strength === "medium" && "Could be stronger"}
                {strength === "strong" && "Strong password"}
              </p>
            </>
          )}
        </Field>

        <Field
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={v => { setConfirm(v); setErrors(e => ({ ...e, confirm: "" })); }}
          error={errors.confirm}
        />

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !password || !confirm}
        >
          {loading ? "Updating…" : "Update Password →"}
        </button>
      </div>
    </div>
  );
}