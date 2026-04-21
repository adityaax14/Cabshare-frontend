import { useState } from "react";
import LoginPage     from "./pages/LoginPage.jsx";
import FindRidesPage from "./pages/Findridespage.jsx";
import PostRidePage  from "./pages/Postridepage.jsx";
import MyRidesPage   from "./pages/Myridespage.jsx";
import { tokenStore, guestStore, apiLogout, apiGuestLogout } from "./services/api.js";
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("find");

  // Auth state: "none" | "user" | "guest"
  const [authMode, setAuthMode] = useState(() => {
    if (tokenStore.get()) return "user";
    if (guestStore.get()) return "guest";
    return "none";
  });

  // ── Not logged in — show Login page ─────────────────────────────────────────
  if (authMode === "none") return (
    <LoginPage
      onAuthSuccess={() => {
        setAuthMode("user");
        setActiveTab("find");
      }}
      onGuestReady={() => {
        setAuthMode("guest");
        setActiveTab("find");
      }}
    />
  );

  // ── Determine which tabs to show ────────────────────────────────────────────
  const isGuest = authMode === "guest";

  const TABS = [
    { key: "find",    label: "Find Ride", Icon: IconFind },
    { key: "post",    label: "Post Ride", Icon: IconPost },
    // My Rides only for logged-in users
    ...(!isGuest ? [{ key: "myrides", label: "My Rides",  Icon: IconMyRides }] : []),
  ];

  const handleLogout = () => {
    if (isGuest) {
      apiGuestLogout();
    } else {
      apiLogout();
    }
    setAuthMode("none");
    setActiveTab("find");
  };

  // ── Main app ────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <div className="app-content">
        {activeTab === "find" && <FindRidesPage onLogout={handleLogout} />}
        {activeTab === "post" && (
          <PostRidePage
            onRidePosted={() => !isGuest && setActiveTab("myrides")}
            onBack={() => setActiveTab("find")}
            onLogout={handleLogout}
          />
        )}
        {activeTab === "myrides" && !isGuest && (
          <MyRidesPage
            onPostRide={() => setActiveTab("post")}
            onLogout={handleLogout}
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