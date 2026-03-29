import { useState, useEffect } from "react";
import { apiGetMyRides, apiCancelRide, apiUpdateSeats, apiLogout } from "../services/api";
import "../styles/MyRidesPage.css";

function Logo({ size = 28 }) {
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

function fmt24to12(time) {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// ── My Ride Card ──────────────────────────────────────────────────────────────
function MyRideCard({ ride, onCancel, onSeatsUpdated }) {
  const [cancelling, setCancelling]   = useState(false);
  const [updating, setUpdating]       = useState(false);
  const [localFilled, setLocalFilled] = useState(ride.filled_seats);
  const [seatError, setSeatError]     = useState("");

  const isCancelled = ride.status === "cancelled";
  const isFull      = localFilled >= ride.pool_size;
  const statusLabel = isCancelled ? "Cancelled" : isFull ? "Full" : "Open";
  const statusCls   = isCancelled ? "cancelled" : isFull ? "full" : "open";

  const handleCancel = async () => {
    if (!confirm("Cancel this ride request?")) return;
    setCancelling(true);
    try {
      await apiCancelRide(ride.id);
      onCancel(ride.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleSeatsChange = (delta) => {
    const next = localFilled + delta;
    if (next < 1 || next > ride.pool_size) return;
    setLocalFilled(next);
    setSeatError("");
  };

  const handleSeatsSave = async () => {
    if (localFilled === ride.filled_seats) return;
    setUpdating(true);
    setSeatError("");
    try {
      const res = await apiUpdateSeats(ride.id, localFilled);
      onSeatsUpdated(ride.id, res.ride.filled_seats, res.ride.status);
    } catch (err) {
      setSeatError(err.message);
      setLocalFilled(ride.filled_seats); // revert on error
    } finally {
      setUpdating(false);
    }
  };

  const seatsChanged = localFilled !== ride.filled_seats;

  return (
    <div className="my-card">

      {/* top */}
      <div className="my-card-top">
        {ride.flight_number
          ? <span className="my-card-flight">{ride.flight_number}</span>
          : <span className="my-card-flight no-flight">No flight number</span>
        }
        <span className={`my-status-badge ${statusCls}`}>{statusLabel}</span>
      </div>

      {/* meta */}
      <div className="my-card-meta">
        <div className="my-meta-item">
          <span>📅</span>
          <span>{fmtDate(ride.departure_date)}</span>
        </div>
        {ride.departure_time && (
          <div className="my-meta-item">
            <span>✈</span>
            <span>Flies {fmt24to12(ride.departure_time)}</span>
          </div>
        )}
        <div className="my-meta-item">
          <span>🕐</span>
          <span>Leave {fmt24to12(ride.leave_campus_at)}</span>
        </div>
        <div className="my-meta-item">
          <span>📍</span>
          <span>IXE</span>
        </div>
      </div>

      {/* seat dots */}
      <div className="my-seats-row">
        {Array.from({ length: ride.pool_size }).map((_, i) => (
          <div key={i} className={`my-seat-dot ${i < localFilled ? "filled" : "empty"}`} />
        ))}
        <span className="my-seats-label">{localFilled}/{ride.pool_size} joined</span>
      </div>

      {ride.note && (
        <>
          <div className="my-card-div" />
          <div className="my-card-note">"{ride.note}"</div>
        </>
      )}

      {/* seats updater — only for non-cancelled rides */}
      {!isCancelled && (
        <>
          <div className="my-card-div" />
          <p className="seats-update-label">
            Someone joined? Update your seat count:
          </p>
          <div className="seats-update-row">
            <div className="seats-stepper">
              <button
                className="seats-btn"
                onClick={() => handleSeatsChange(-1)}
                disabled={localFilled <= 1}
              >−</button>
              <span className="seats-val">{localFilled}</span>
              <button
                className="seats-btn"
                onClick={() => handleSeatsChange(1)}
                disabled={localFilled >= ride.pool_size}
              >+</button>
            </div>
            {seatsChanged && (
              <button
                className="seats-save-btn"
                onClick={handleSeatsSave}
                disabled={updating}
              >
                {updating ? "Saving…" : "Save"}
              </button>
            )}
          </div>
          {seatError && <p className="seats-error">{seatError}</p>}
        </>
      )}

      {/* cancel */}
      {!isCancelled && (
        <>
          <div className="my-card-div" />
          <button className="cancel-btn" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling…" : "Cancel Ride"}
          </button>
        </>
      )}

    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyRidesPage({ onPostRide, onLogout }) {
  const [rides, setRides]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchMyRides = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetMyRides();
      setRides(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyRides(); }, []);

  const handleCancel = (id) => {
    setRides(prev =>
      prev.map(r => r.id === id ? { ...r, status: "cancelled" } : r)
    );
  };

  const handleSeatsUpdated = (id, newFilled, newStatus) => {
    setRides(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, filled_seats: newFilled, status: newStatus }
          : r
      )
    );
  };

  const handleLogout = async () => {
    try { await apiLogout(); } catch { /* continue anyway */ }
    onLogout?.();
  };

  return (
    <div className="my-shell">

      <div className="my-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={28} />
          <span className="my-nav-title">My <span>Rides</span></span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Sign out</button>
      </div>

      {loading ? (
        <div className="my-loading">
          <div className="my-spinner" />
          <p>Loading your rides…</p>
        </div>
      ) : error ? (
        <div className="my-error">{error}</div>
      ) : rides.length === 0 ? (
        <div className="my-empty">
          <div className="my-empty-icon">🚕</div>
          <p className="my-empty-title">No rides yet</p>
          <p className="my-empty-sub">
            Post a ride request and other students<br />heading to IXE can find you.
          </p>
          <button className="post-ride-btn" onClick={onPostRide}>
            Post a Ride →
          </button>
        </div>
      ) : (
        <div className="my-list">
          {rides.map(ride => (
            <MyRideCard
              key={ride.id}
              ride={ride}
              onCancel={handleCancel}
              onSeatsUpdated={handleSeatsUpdated}
            />
          ))}
        </div>
      )}

    </div>
  );
}