import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ORANGE = "#E07B39";
const ORANGE_L = "#fdf3ed";
const GRAY = "#888";
const RED = "#E24B4A";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const PAGE_SIZE = 12;

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

/* ─── Contact card (mobile view of a row) ─────── */
function ContactCard({ c, checked, onToggle, onCopy, onDelete }) {
  return (
    <div style={{
      background: "#fafaf8", border: "1px solid #f0ece8", borderRadius: "12px",
      padding: "14px", display: "flex", alignItems: "flex-start", gap: "10px",
    }}>
      <input type="checkbox" checked={checked} onChange={onToggle}
        style={{ cursor: "pointer", accentColor: ORANGE, width: "18px", height: "18px", marginTop: "2px", flexShrink: 0 }} />

      <div style={{
        width: "36px", height: "36px", borderRadius: "50%", background: ORANGE_L,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: "700", color: ORANGE, flexShrink: 0,
      }}>
        {getInitials(c.name)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: "600", color: "#1a1a1a", margin: "0 0 2px", fontSize: "13px" }}>
          {c.name || "—"}
        </p>
        <a href={`mailto:${c.email}`} style={{
          color: ORANGE, textDecoration: "none", fontSize: "12px",
          wordBreak: "break-all", display: "block", marginBottom: "6px",
        }}>
          {c.email}
        </a>
        <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: GRAY }}>
          <span>
            Joined {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
        <button onClick={onCopy} title="Copy email"
          style={{
            background: "none", border: "none", color: ORANGE, cursor: "pointer", fontSize: "16px",
            padding: "8px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          <i className="ti ti-copy" />
        </button>
        <button onClick={onDelete} title="Remove subscriber"
          style={{
            background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "16px",
            padding: "8px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          <i className="ti ti-trash" />
        </button>
      </div>
    </div>
  );
}

export default function CustomerContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [copying, setCopying] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 760 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/connect`, authOpts())
      .then(r => r.ok ? r.json() : [])
      .then(data => setContacts(Array.isArray(data) ? data : data.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this subscriber?")) return;
    const r = await fetch(`${API}/api/connect/${id}`, authOpts({ method: "DELETE" }));
    if (r.ok) setContacts(prev => prev.filter(c => c._id !== id));
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Remove ${selected.size} selected subscribers?`)) return;
    await Promise.all([...selected].map(id =>
  fetch(`${API}/api/connect/${id}`, authOpts({ method: "DELETE" }))
));
    setContacts(prev => prev.filter(c => !selected.has(c._id)));
    setSelected(new Set());
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pageContacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageContacts.map(c => c._id)));
    }
  };

  const copyEmails = async (emailList) => {
    const text = emailList.join(", ");
    await navigator.clipboard.writeText(text);
    setCopyMsg(`✓ ${emailList.length} email${emailList.length !== 1 ? "s" : ""} copied!`);
    setTimeout(() => setCopyMsg(""), 2500);
  };

  const filtered = contacts
    .filter(c => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageContacts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedEmails = contacts.filter(c => selected.has(c._id)).map(c => c.email);
  const allEmails = filtered.map(c => c.email);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE, animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading subscribers…</p>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cc-input { font-size: 16px !important; }
        @media (max-width: 760px) {
          .cc-page-pad { padding: 16px !important; }
          .cc-h1 { font-size: 20px !important; }
          .cc-summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .cc-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .cc-bulk-actions { width: 100% !important; justify-content: space-between !important; }
          .cc-panel { padding: 14px !important; }
          .cc-select-all-row { display: flex !important; }
        }
        @media (max-width: 420px) {
          .cc-summary-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      <div className="cc-page-pad" style={{ padding: "28px 32px", maxWidth: "1200px" }}>

        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <button onClick={() => window.location.href = "/admin"}
            style={{ background: "none", border: "none", color: GRAY, fontSize: "12px", cursor: "pointer", padding: "6px 0", marginBottom: "6px" }}>
            <i className="ti ti-arrow-left" style={{ marginRight: "4px" }} />
            Back to Dashboard
          </button>
          <h1 className="cc-h1" style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>
            Newsletter Subscribers
          </h1>
          <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>
            {filtered.length} subscriber{filtered.length !== 1 ? "s" : ""} — collected from the footer form
          </p>
        </div>

        {/* Summary Cards */}
        <div className="cc-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
          {[
            { label: "Total Subscribers", value: contacts.length, icon: "ti-users" },
            { label: "This Week", value: contacts.filter(c => new Date(c.createdAt) >= new Date(Date.now() - 7 * 86400000)).length, icon: "ti-user-plus" },
            { label: "This Month", value: contacts.filter(c => new Date(c.createdAt) >= new Date(Date.now() - 30 * 86400000)).length, icon: "ti-calendar" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: ORANGE_L, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: "16px", color: ORANGE }} />
                </span>
                <span style={{ fontSize: "12px", color: GRAY }}>{s.label}</span>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>{s.value}</p>
            </div>
          ))}

          {/* Copy All Emails card */}
          <div style={{ background: `linear-gradient(135deg, ${ORANGE}, #f0924a)`, border: "none", borderRadius: "14px", padding: "16px 20px", cursor: "pointer", position: "relative" }}
            onClick={() => copyEmails(allEmails)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="ti ti-copy" style={{ fontSize: "16px", color: "#fff" }} />
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>Copy All Emails</span>
            </div>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#fff", margin: 0 }}>
              {copyMsg || "Click to copy all →"}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="cc-toolbar" style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="cc-input"
            type="text" placeholder="Search by name or email…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: "220px", padding: "10px 14px", fontSize: "13px", border: "1px solid #f0ece8", borderRadius: "10px", outline: "none", background: "#fff", boxSizing: "border-box" }}
          />

          {selected.size > 0 && (
            <div className="cc-bulk-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: GRAY, whiteSpace: "nowrap" }}>{selected.size} selected</span>
              <button onClick={() => copyEmails(selectedEmails)}
                style={{ padding: "10px 14px", fontSize: "12px", borderRadius: "8px", border: `1px solid ${ORANGE}`, background: ORANGE_L, color: ORANGE, cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap" }}>
                <i className="ti ti-copy" style={{ marginRight: "5px" }} />
                Copy Selected
              </button>
              <button onClick={handleDeleteSelected}
                style={{ padding: "10px 14px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: RED, cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap" }}>
                <i className="ti ti-trash" style={{ marginRight: "5px" }} />
                Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* List / Table */}
        <div className="cc-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>

          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pageContacts.length > 0 && (
                <label style={{
                  display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: GRAY,
                  padding: "4px 2px 6px", cursor: "pointer",
                }}>
                  <input type="checkbox"
                    checked={pageContacts.length > 0 && selected.size === pageContacts.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer", accentColor: ORANGE, width: "16px", height: "16px" }} />
                  Select all on this page
                </label>
              )}

              {pageContacts.map((c) => (
                <ContactCard
                  key={c._id}
                  c={c}
                  checked={selected.has(c._id)}
                  onToggle={() => toggleSelect(c._id)}
                  onCopy={() => copyEmails([c.email])}
                  onDelete={() => handleDelete(c._id)}
                />
              ))}

              {pageContacts.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: GRAY }}>
                  <i className="ti ti-inbox" style={{ fontSize: "28px", display: "block", marginBottom: "8px", opacity: 0.4 }} />
                  No subscribers match your search
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                    <th style={{ padding: "10px", width: "36px" }}>
                      <input type="checkbox"
                        checked={pageContacts.length > 0 && selected.size === pageContacts.length}
                        onChange={toggleSelectAll}
                        style={{ cursor: "pointer", accentColor: ORANGE }} />
                    </th>
                    {["Subscriber", "Email", "Subscribed On", "Last Updated", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageContacts.map((c) => (
                    <tr key={c._id}
                      style={{ borderBottom: "1px solid #fafaf8", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fdf3ed"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      {/* Checkbox */}
                      <td style={{ padding: "12px 10px" }}>
                        <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggleSelect(c._id)}
                          style={{ cursor: "pointer", accentColor: ORANGE }} />
                      </td>

                      {/* Avatar + Name */}
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: ORANGE_L, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: ORANGE, flexShrink: 0 }}>
                            {getInitials(c.name)}
                          </div>
                          <span style={{ fontWeight: "600", color: "#1a1a1a" }}>{c.name || "—"}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: "12px 10px" }}>
                        <a href={`mailto:${c.email}`} style={{ color: ORANGE, textDecoration: "none", fontSize: "13px" }}>
                          {c.email}
                        </a>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "12px 10px", color: GRAY, fontSize: "12px", whiteSpace: "nowrap" }}>
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: "12px 10px", color: GRAY, fontSize: "12px", whiteSpace: "nowrap" }}>
                        {c.updatedAt
                          ? new Date(c.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button onClick={() => copyEmails([c.email])} title="Copy email"
                            style={{ background: "none", border: "none", color: ORANGE, cursor: "pointer", fontSize: "14px", padding: "2px 4px" }}>
                            <i className="ti ti-copy" />
                          </button>
                          <button onClick={() => handleDelete(c._id)} title="Remove subscriber"
                            style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "14px", padding: "2px 4px" }}>
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {pageContacts.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: GRAY }}>
                        <i className="ti ti-inbox" style={{ fontSize: "28px", display: "block", marginBottom: "8px", opacity: 0.4 }} />
                        No subscribers match your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "18px" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === 1 ? "#ccc" : "#1a1a1a", cursor: page === 1 ? "default" : "pointer" }}>
                Prev
              </button>
              <span style={{ fontSize: "12px", color: GRAY }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === totalPages ? "#ccc" : "#1a1a1a", cursor: page === totalPages ? "default" : "pointer" }}>
                Next
              </button>
            </div>
          )}
        </div>

        {/* Copy feedback toast */}
        {copyMsg && (
          <div style={{ position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "10px 22px", borderRadius: "30px", fontSize: "13px", fontWeight: "600", zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,0.2)", maxWidth: "calc(100% - 32px)", textAlign: "center" }}>
            {copyMsg}
          </div>
        )}

      </div>
    </div>
  );
}