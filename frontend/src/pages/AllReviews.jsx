import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORANGE   = "#E07B39";
const ORANGE_L = "#fdf3ed";
const RED      = "#E24B4A";
const GRAY     = "#888";
const RATING_OPTIONS = ["All", "5", "4", "3", "2", "1"];

const authHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
const authOpts = (extra = {}) => ({
  credentials: "include",
  headers: authHeaders(),
  ...extra,
});

function Stars({ rating }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {Array.from({ length: 5 }, (_, j) => (
        <i key={j} className="ti ti-star-filled" style={{
          fontSize: "13px", color: j < rating ? "#f59e0b" : "#e5e7eb",
        }} aria-hidden />
      ))}
    </div>
  );
}

const PAGE_SIZE = 10;

/* ─── Review card (mobile view of a row) ─────── */
function ReviewCard({ r, onDelete }) {
  return (
    <div style={{
      background: "#fafaf8", border: "1px solid #f0ece8", borderRadius: "12px",
      padding: "14px", display: "flex", flexDirection: "column", gap: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
            {r.user?.name || "—"}
          </p>
          {r.user?.email ? (
            <a href={`mailto:${r.user.email}`} style={{
              color: ORANGE, textDecoration: "none", fontSize: "12px",
              wordBreak: "break-all",
            }}>
              {r.user.email}
            </a>
          ) : (
            <span style={{ color: GRAY, fontSize: "12px" }}>—</span>
          )}
        </div>
        <button
          onClick={() => onDelete(r._id)}
          style={{
            background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "15px",
            padding: "6px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="Delete review"
        >
          <i className="ti ti-trash" aria-hidden />
        </button>
      </div>

      <Stars rating={r.rating} />

      <p style={{ fontSize: "13px", color: "#555", margin: 0, lineHeight: 1.45 }}>{r.message}</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ fontSize: "11px", color: GRAY, fontFamily: "monospace" }}>
          {r.user?.userId ? `ID ${r.user.userId.slice(-8).toUpperCase()}` : ""}
        </span>
        <span style={{ fontSize: "11px", color: GRAY, whiteSpace: "nowrap" }}>
          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export default function AllReviews() {
  const [reviews, setReviews]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [page, setPage]                 = useState(1);
  const [isMobile, setIsMobile]         = useState(typeof window !== "undefined" ? window.innerWidth <= 760 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/reviews`, authOpts())
      .then(r => r.ok ? r.json() : [])
      .then(data => setReviews(Array.isArray(data) ? data : data.reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search, ratingFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    const r = await fetch(`${API}/api/reviews/${id}`, authOpts({ method: "DELETE" }));  
    if (r.ok) setReviews(prev => prev.filter(rv => rv._id !== id));
  };

  const filtered = reviews
    .filter(r => ratingFilter === "All" || String(r.rating) === ratingFilter)
    .filter(r => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.user?.userId?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageReviews = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE,
          animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading reviews…</p>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ar-input { font-size: 16px !important; }
        @media (max-width: 760px) {
          .ar-page-pad { padding: 16px !important; }
          .ar-h1 { font-size: 20px !important; }
          .ar-filters { flex-direction: column !important; align-items: stretch !important; }
          .ar-filters select { width: 100% !important; }
          .ar-panel { padding: 14px !important; }
        }
      `}</style>
      <div className="ar-page-pad" style={{ padding: "28px 32px", maxWidth: "1400px" }}>

        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => window.location.href = "/admin"}
            style={{ background: "none", border: "none", color: GRAY, fontSize: "12px", cursor: "pointer", padding: "6px 0", marginBottom: "6px" }}
          >
            <i className="ti ti-arrow-left" style={{ marginRight: "4px" }} aria-hidden />
            Back to Dashboard
          </button>
          <h1 className="ar-h1" style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>All Reviews</h1>
          <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>{filtered.length} review{filtered.length !== 1 ? "s" : ""} found</p>
        </div>

        <div className="ar-filters" style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
          <input
            className="ar-input"
            type="text"
            placeholder="Search by user name, email, user ID, or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: "220px", padding: "10px 14px", fontSize: "13px",
              border: "1px solid #f0ece8", borderRadius: "10px", outline: "none", background: "#fff",
              boxSizing: "border-box",
            }}
          />
          <select
            className="ar-input"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            style={{
              padding: "10px 14px", fontSize: "13px", border: "1px solid #f0ece8",
              borderRadius: "10px", outline: "none", background: "#fff", color: "#1a1a1a", cursor: "pointer",
            }}
          >
            {RATING_OPTIONS.map(r => <option key={r} value={r}>{r === "All" ? "All Ratings" : `${r} Star${r !== "1" ? "s" : ""}`}</option>)}
          </select>
        </div>

        <div className="ar-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>

          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pageReviews.map((r) => (
                <ReviewCard key={r._id} r={r} onDelete={handleDelete} />
              ))}
              {pageReviews.length === 0 && (
                <p style={{ padding: "30px", textAlign: "center", color: GRAY, fontSize: "13px" }}>No reviews match your filters</p>
              )}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                    {["User", "Email", "User ID", "Rating", "Review", "Date", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageReviews.map((r) => (
                    <tr key={r._id} style={{ borderBottom: "1px solid #fafaf8" }}>

                      {/* Name */}
                      <td style={{ padding: "12px 10px", fontWeight: "600", color: "#1a1a1a", whiteSpace: "nowrap" }}>
                        {r.user?.name || "—"}
                      </td>

                      {/* Email */}
                      <td style={{ padding: "12px 10px", fontSize: "12px" }}>
                        {r.user?.email ? (
                          <a href={`mailto:${r.user.email}`} style={{ color: ORANGE, textDecoration: "none" }}>
                            {r.user.email}
                          </a>
                        ) : (
                          <span style={{ color: GRAY }}>—</span>
                        )}
                      </td>

                      {/* User ID */}
                      <td style={{ padding: "12px 10px", color: GRAY, fontFamily: "monospace", fontSize: "11px" }}>
                        {r.user?.userId ? r.user.userId.slice(-8).toUpperCase() : "—"}
                      </td>

                      {/* Rating */}
                      <td style={{ padding: "12px 10px" }}><Stars rating={r.rating} /></td>

                      {/* Review */}
                      <td style={{ padding: "12px 10px", color: "#555", maxWidth: "320px" }}>{r.message}</td>

                      {/* Date */}
                      <td style={{ padding: "12px 10px", color: GRAY, whiteSpace: "nowrap" }}>
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>

                      {/* Delete */}
                      <td style={{ padding: "12px 10px" }}>
                        <button
                          onClick={() => handleDelete(r._id)}
                          style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "13px" }}
                          title="Delete review"
                        >
                          <i className="ti ti-trash" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pageReviews.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: GRAY }}>No reviews match your filters</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "18px" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === 1 ? "#ccc" : "#1a1a1a", cursor: page === 1 ? "default" : "pointer" }}
              >
                Prev
              </button>
              <span style={{ fontSize: "12px", color: GRAY }}>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === totalPages ? "#ccc" : "#1a1a1a", cursor: page === totalPages ? "default" : "pointer" }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}