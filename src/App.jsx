import { useState, useEffect } from "react";
import LoginPage         from "./pages/LoginPage.jsx";
import FindRidesPage     from "./pages/Findridespage.jsx";
import PostRidePage      from "./pages/Postridepage.jsx";
import MyRidesPage       from "./pages/Myridespage.jsx";
import ResetPasswordPage from "./pages/Resetpasswordpage.jsx";
import { tokenStore }    from "./services/api.js";
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

// ── Check if URL is a Supabase reset link ─────────────────────────────────────
function isResetPasswordURL() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get("type") === "recovery" && !!params.get("access_token");
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("find");
  const [page, setPage]           = useState("main");

  // ── Auth state — read from localStorage instantly, no network call ───────────
  // This is the key fix: instead of calling /user/me on every load (which hits
  // Render's cold start = 15 sec wait), we just check if a token exists in
  // localStorage. Token is saved on login/signup, cleared on logout.
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!tokenStore.get());

  useEffect(() => {
    // handle password reset link from email
    if (isResetPasswordURL()) {
      setPage("reset");
    }
  }, []);

  // ── Reset page ─────────────────────────────────────────────────────────────
  if (page === "reset") return (
    <ResetPasswordPage
      onBack={() => {
        setPage("main");
        setIsLoggedIn(false);
      }}
    />
  );

  // ── Login ──────────────────────────────────────────────────────────────────
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
            onLogout={async () => {
              await apiLogout();
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