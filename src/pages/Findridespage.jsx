import { useState, useEffect, useMemo } from "react";
import { apiGetRides } from "../services/api";
import "../styles/Findridespage.css";


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

// ── WhatsApp SVG icon ─────────────────────────────────────────────────────────
function WaIcon() {
  return (
    <svg className="wa-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// time string "HH:MM:SS" → minutes since midnight (for sorting)
function timeToMins(t) {
  if (!t) return 9999;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ── Sorting logic ─────────────────────────────────────────────────────────────
// Priority:
// 1. Earliest departure date
// 2. Closest leave_campus_at time
// 3. More filled seats first (e.g. 3/4 before 1/4) — easier to complete the pool
function sortRides(rides) {
  return [...rides].sort((a, b) => {
    // 1. date
    if (a.departure_date < b.departure_date) return -1;
    if (a.departure_date > b.departure_date) return 1;
    // 2. leave time (ascending)
    const timeDiff = timeToMins(a.leave_campus_at) - timeToMins(b.leave_campus_at);
    if (timeDiff !== 0) return timeDiff;
    // 3. filled seats descending (more filled = higher priority)
    return b.filled_seats - a.filled_seats;
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ filled, total }) {
  const spots = total - filled;
  if (spots === 0) return <span className="status-badge full">Full</span>;
  if (spots === 1) return <span className="status-badge one-left">1 spot left</span>;
  return <span className="status-badge open">{spots} spots open</span>;
}

// ── Ride Card ─────────────────────────────────────────────────────────────────
function RideCard({ ride }) {
  const { profiles: poster } = ride;
  const isFull = ride.filled_seats >= ride.pool_size;
  const isUrgent = (ride.pool_size - ride.filled_seats) === 1;

  const waMsg = encodeURIComponent(
    `Hi ${poster?.full_name?.split(" ")[0] || ""}! I saw your cab pool request on Cab to Flight` +
    `${ride.flight_number ? ` for flight ${ride.flight_number}` : ""}` +
    ` on ${fmtDate(ride.departure_date)}. Are you still looking for pool mates?`
  );
  const waUrl = `https://wa.me/91${poster?.phone}?text=${waMsg}`;
  const callUrl = `tel:+91${poster?.phone}`;

  return (
    <div className={`ride-card ${isUrgent ? "urgent" : ""}`}>

      {/* top */}
      <div className="card-top">
        {ride.flight_number
          ? <span className="card-flight">{ride.flight_number}</span>
          : <span className="card-flight no-flight">No flight number</span>
        }
        <StatusBadge filled={ride.filled_seats} total={ride.pool_size} />
      </div>

      {/* meta */}
      <div className="card-meta">
        <div className="meta-item">
          <span className="meta-icon">📅</span>
          <span>{fmtDate(ride.departure_date)}</span>
        </div>
        {ride.departure_time && (
          <div className="meta-item">
            <span className="meta-icon">✈</span>
            <span>Flies {fmt24to12(ride.departure_time)}</span>
          </div>
        )}
        <div className="meta-item">
          <span className="meta-icon">🕐</span>
          <span>Leave {fmt24to12(ride.leave_campus_at)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">📍</span>
          <span>IXE</span>
        </div>
      </div>

      {/* seats */}
      <div className="seats-row">
        {Array.from({ length: ride.pool_size }).map((_, i) => (
          <div
            key={i}
            className={`seat-dot ${i < ride.filled_seats ? "filled" : "empty"}`}
          />
        ))}
        <span className="seats-label">
          {ride.filled_seats}/{ride.pool_size} joined
        </span>
      </div>

      <div className="card-div" />

      {/* poster */}
      <div className="poster-row">
        <div className="poster-avatar">{initials(poster?.full_name)}</div>
        <div className="poster-info">
          <div className="poster-name">{poster?.full_name || "Unknown"}</div>
          <div className="poster-phone">+91 {poster?.phone}</div>
        </div>
      </div>

      {/* note */}
      {ride.note && (
        <div className="card-note">"{ride.note}"</div>
      )}

      {/* actions */}
      {isFull ? (
        <div className="full-overlay">Pool is full — check others</div>
      ) : (
        <div className="card-actions">
          <a className="wa-btn" href={waUrl} target="_blank" rel="noreferrer">
            <WaIcon />
            WhatsApp
          </a>
          <a className="call-btn" href={callUrl}>
            📞 Call
          </a>
        </div>
      )}

    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FindRidesPage() {
  const [rides, setRides]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  // filters
  const [filterDate, setFilterDate]     = useState("");
  const [filterFlight, setFilterFlight] = useState("");
  const [filterTime, setFilterTime]     = useState("");

  const fetchRides = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetRides(filterDate || null);
      setRides(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-fetch when date filter changes
  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate]);

  // ── Client-side filter + sort ───────────────────────────────────────────────
  const displayed = useMemo(() => {
    let result = [...rides];

    // flight number filter
    if (filterFlight.trim()) {
      result = result.filter(r =>
        r.flight_number?.toLowerCase().includes(filterFlight.trim().toLowerCase())
      );
    }

    // time window filter — show rides leaving within ±2 hrs of entered time
    if (filterTime) {
      const [fh, fm] = filterTime.split(":").map(Number);
      const targetMins = fh * 60 + fm;
      result = result.filter(r => {
        const leaveMins = timeToMins(r.leave_campus_at);
        return Math.abs(leaveMins - targetMins) <= 120; // within 2 hours
      });
    }

    return sortRides(result);
  }, [rides, filterFlight, filterTime]);

  const hasFilters = filterDate || filterFlight || filterTime;

  const clearFilters = () => {
    setFilterDate("");
    setFilterFlight("");
    setFilterTime("");
  };

  return (
    <div className="find-shell">

      {/* nav */}
      <div className="find-nav">
        <div className="find-nav-brand">
          <Logo size={28} />
          <span className="find-nav-title">Find a <span>Ride</span></span>
        </div>
        {!loading && (
          <span className="find-nav-count">
            {displayed.length} ride{displayed.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* filters */}
      <div className="find-filters">
        <div className="filter-row">
          <input
            className="filter-input"
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            title="Filter by date"
          />
          <input
            className="filter-input flight"
            type="text"
            placeholder="Flight no."
            value={filterFlight}
            onChange={e => setFilterFlight(e.target.value.toUpperCase())}
            style={{ maxWidth: 120 }}
          />
        </div>
        <div className="filter-row">
          <input
            className="filter-input"
            type="time"
            value={filterTime}
            onChange={e => setFilterTime(e.target.value)}
            title="Show rides leaving around this time (±2 hrs)"
            style={{ flex: 1 }}
          />
          {hasFilters && (
            <button className="clear-btn" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
        <p className="sort-note">
          Sorted by: date · leaving time · seats filled
        </p>
      </div>

      <div className="find-divider" />

      {/* content */}
      {loading ? (
        <div className="find-loading">
          <div className="find-spinner" />
          <p>Finding rides…</p>
        </div>
      ) : error ? (
        <div className="find-error">
          {error}
          <br />
          <button className="retry-btn" onClick={fetchRides}>Retry</button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="find-empty">
          <div className="find-empty-icon">✈</div>
          <p className="find-empty-title">
            {hasFilters ? "No rides match your filters" : "No rides yet"}
          </p>
          <p className="find-empty-sub">
            {hasFilters
              ? "Try changing the date or clearing filters"
              : "Be the first to post a ride request!"}
          </p>
        </div>
      ) : (
        <div className="find-list">
          {displayed.map(ride => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}

    </div>
  );
}