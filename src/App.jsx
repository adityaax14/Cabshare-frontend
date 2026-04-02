import { useState, useEffect } from "react";

import LoginPage     from "./pages/LoginPage.jsx";
import FindRidesPage from "./pages/Findridespage.jsx";
import PostRidePage  from "./pages/Postridepage.jsx";
import MyRidesPage   from "./pages/Myridespage.jsx";
import ResetPasswordPage from "./pages/Resetpasswordpage.jsx";
import "./styles/Appshell.css";


// ── Tab icons ─────────────────────────────────────────────────────────────────
function IconFind({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#3b7fff" : "#44445a"} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconPost({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#f0a030" : "#44445a"} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8"  x2="12" y2="16" />
      <line x1="8"  y1="12" x2="16" y2="12" />
    </svg>
  );
}

function IconMyRides({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#34c47c" : "#44445a"} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

const TABS = [
  { key: "find",    label: "Find Ride", Icon: IconFind    },
  { key: "post",    label: "Post Ride", Icon: IconPost    },
  { key: "myrides", label: "My Rides",  Icon: IconMyRides },
];

// ── Splash ────────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{
      minHeight: "100vh", background: "#08080c",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="38" width="38" height="14" rx="5" fill="#f0a030" />
        <rect x="14" y="30" width="26" height="12" rx="4" fill="#f0a030" />
        <rect x="16" y="32" width="10" height="8" rx="2" fill="#08080c" opacity="0.5" />
        <rect x="28" y="32" width="10" height="8" rx="2" fill="#08080c" opacity="0.5" />
        <circle cx="16" cy="52" r="5" fill="#08080c" />
        <circle cx="16" cy="52" r="2.5" fill="#555" />
        <circle cx="36" cy="52" r="5" fill="#08080c" />
        <circle cx="36" cy="52" r="2.5" fill="#555" />
        <g transform="rotate(-30 44 20)">
          <ellipse cx="44" cy="20" rx="14" ry="4" fill="#3b7fff" />
          <polygon points="58,20 62,16 62,24" fill="#3b7fff" />
          <polygon points="36,16 30,10 36,20" fill="#3b7fff" />
          <polygon points="36,24 30,30 36,20" fill="#2d6ee0" />
        </g>
      </svg>
      <div style={{
        width: 20, height: 20,
        border: "2px solid rgba(59,127,255,0.2)",
        borderTopColor: "#3b7fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Check if URL is a Supabase reset link ─────────────────────────────────────
function isResetPasswordURL() {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  return params.get("type") === "recovery" && !!params.get("access_token");
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking]     = useState(true);
  const [activeTab, setActiveTab]   = useState("find");
  const [page, setPage]             = useState("main"); // "main" | "reset"

  useEffect(() => {
    // if the URL contains a Supabase recovery token → show reset page immediately
    if (isResetPasswordURL()) {
      setPage("reset");
      setChecking(false);
      return;
    }

    // otherwise check if user is already logged in via cookies
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/user/me", {
          credentials: "include",
        });
        if (res.ok) setIsLoggedIn(true);
      } catch {
        // not logged in
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking) return <Splash />;

  // ── Reset password page (opened from email link) ───────────────────────────
  if (page === "reset") return (
    <ResetPasswordPage
      onBack={() => {
        setPage("main");
        setIsLoggedIn(false);
      }}
    />
  );

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!isLoggedIn) return (
    <LoginPage
      onAuthSuccess={() => {
        setIsLoggedIn(true);
        setActiveTab("find");
      }}
    />
  );

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <div className="app-content">
        {activeTab === "find" && <FindRidesPage />}
        {activeTab === "post" && (
          <PostRidePage
            onRidePosted={() => setActiveTab("myrides")}
            onBack={() => setActiveTab("find")}
          />
        )}
        {activeTab === "myrides" && (
          <MyRidesPage
            onPostRide={() => setActiveTab("post")}
            onLogout={() => {
              setIsLoggedIn(false);
              setActiveTab("find");
            }}
          />
        )}
      </div>

      <nav className="tab-bar">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon active={activeTab === key} />
            <span className={`tab-label ${activeTab === key ? `color-${key}` : ""}`}>
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}