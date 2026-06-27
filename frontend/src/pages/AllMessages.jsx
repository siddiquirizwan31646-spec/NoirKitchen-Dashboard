import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORANGE   = "#E07B39";
const ORANGE_L = "#fdf3ed";
const RED      = "#E24B4A";
const GRAY     = "#888";
const PAGE_SIZE = 10;

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

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

export default function AllMessages() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [msgRes, userRes] = await Promise.all([
  fetch(`${API}/api/contact`, authOpts()),
  fetch(`${API}/api/users`,   authOpts()),
]);
        const msgData  = msgRes.ok  ? await msgRes.json()  : [];
        const userData = userRes.ok ? await userRes.json() : [];
        setMessages(Array.isArray(msgData) ? msgData : msgData.messages || []);
        const userList = Array.isArray(userData) ? userData : userData.users || [];
        const emailMap = {};
        userList.forEach(u => { if (u.email) emailMap[u.email.toLowerCase()] = u._id; });
        setUsers(emailMap);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    const r = await fetch(`${API}/api/contact/${id}`, authOpts({ method: "DELETE" }));
    if (r.ok) setMessages(prev => prev.filter(m => m._id !== id));
  };

  const filtered = messages
    .filter(m => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) ||
        m.message?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageMessages = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE,
          animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading messages…</p>
      </div>
    </div>
  );

  const formatDate = (createdAt) => {
    const d = new Date(createdAt);
    return {
      date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    };
  };

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ padding: isMobile ? "16px" : "28px 32px", maxWidth: "1400px" }}>

        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => window.location.href = "/admin"}
            style={{ background: "none", border: "none", color: GRAY, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <i className="ti ti-arrow-left" aria-hidden /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>
            Customer Messages
          </h1>
          <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>
            {filtered.length} message{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Search */}
        <div style={{
          position: isMobile ? "sticky" : "static",
          top: 0,
          background: isMobile ? "#fafaf8" : "transparent",
          paddingBottom: isMobile ? "10px" : 0,
          zIndex: 10,
          marginBottom: "14px",
        }}>
          <input
            type="text"
            placeholder="Search by name, email, subject, or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 14px", fontSize: "13px",
              border: "1px solid #f0ece8", borderRadius: "10px",
              outline: "none", background: "#fff",
            }}
          />
        </div>

        {/* ── MOBILE: Cards ── */}
        {isMobile ? (
          <div>
            {pageMessages.length === 0 ? (
              <p style={{ textAlign: "center", color: GRAY, marginTop: "40px" }}>No messages match your filters</p>
            ) : pageMessages.map((m) => {
              const { date, time } = formatDate(m.createdAt);
              const matchedUserId = m.email ? users[m.email.toLowerCase()] : null;
              return (
                <div key={m._id} style={{
                  background: "#fff",
                  border: "1px solid #f0ece8",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  marginBottom: "10px",
                }}>
                  {/* Top row: name + date + delete */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a" }}>{m.name || "—"}</span>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ display: "block", fontSize: "11px", color: GRAY }}>{date}</span>
                      <span style={{ display: "block", fontSize: "11px", color: "#aaa" }}>{time}</span>
                    </div>
                  </div>

                  {/* Email */}
                  <a href={`mailto:${m.email}`} style={{ display: "block", fontSize: "12px", color: ORANGE, textDecoration: "none", marginBottom: "8px" }}>
                    {m.email || "—"}
                  </a>

                  {/* Subject */}
                  {m.subject && (
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 4px" }}>
                      {m.subject}
                    </p>
                  )}

                  {/* Message */}
                  <p style={{ fontSize: "12px", color: "#555", lineHeight: "1.55", margin: "0 0 10px" }}>
                    {m.message || "—"}
                  </p>

                  {/* Footer: UID + delete */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0ece8", paddingTop: "10px" }}>
                    {matchedUserId ? (
                      <span style={{ fontFamily: "monospace", fontSize: "11px", color: ORANGE, background: ORANGE_L, borderRadius: "5px", padding: "2px 8px" }}>
                        {matchedUserId.slice(-8).toUpperCase()}
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#aaa", background: "#f5f5f5", borderRadius: "5px", padding: "2px 8px" }}>
                        Guest
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(m._id)}
                      style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "18px", padding: "4px 8px", display: "flex", alignItems: "center" }}
                      title="Delete message"
                    >
                      <i className="ti ti-trash" aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── DESKTOP: Table ── */
          <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                    {["Name","Email","User ID","Subject","Message","Date & Time",""].map((h, i) => (
                      <th key={i} style={{
                        width: ["120px","180px","100px","160px","200px","120px","40px"][i],
                        textAlign: "left", padding: "10px", color: GRAY,
                        fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageMessages.map((m) => {
                    const { date, time } = formatDate(m.createdAt);
                    const matchedUserId = m.email ? users[m.email.toLowerCase()] : null;
                    return (
                      <tr key={m._id} style={{ borderBottom: "1px solid #fafaf8" }}>
                        <td style={{ padding: "12px 10px", fontWeight: "600", color: "#1a1a1a", whiteSpace: "nowrap", verticalAlign: "top" }}>{m.name || "—"}</td>
                        <td style={{ padding: "12px 10px", color: GRAY, fontSize: "12px", verticalAlign: "top" }}>
                          <a href={`mailto:${m.email}`} style={{ color: ORANGE, textDecoration: "none" }}>{m.email || "—"}</a>
                        </td>
                        <td style={{ padding: "12px 10px", fontFamily: "monospace", fontSize: "11px", verticalAlign: "top" }}>
                          {matchedUserId ? (
                            <span style={{ color: ORANGE }}>{matchedUserId.slice(-8).toUpperCase()}</span>
                          ) : (
                            <span style={{ color: "#aaa", fontSize: "10px", background: "#f5f5f5", borderRadius: "4px", padding: "2px 6px" }}>Guest</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 10px", color: "#1a1a1a", fontWeight: "500", whiteSpace: "normal", wordBreak: "break-word", verticalAlign: "top" }}>{m.subject || <span style={{ color: GRAY }}>—</span>}</td>
                        <td style={{ padding: "12px 10px", color: "#555", whiteSpace: "normal", wordBreak: "break-word", verticalAlign: "top" }}>{m.message || "—"}</td>
                        <td style={{ padding: "12px 10px", color: GRAY, whiteSpace: "nowrap", verticalAlign: "top" }}>
                          <span style={{ display: "block", fontSize: "12px" }}>{date}</span>
                          <span style={{ display: "block", fontSize: "11px", color: "#aaa" }}>{time}</span>
                        </td>
                        <td style={{ padding: "12px 10px", verticalAlign: "top" }}>
                          <button onClick={() => handleDelete(m._id)} style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "13px" }} title="Delete message">
                            <i className="ti ti-trash" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pageMessages.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: "30px", textAlign: "center", color: GRAY }}>No messages match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "18px" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "7px 16px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === 1 ? "#ccc" : "#1a1a1a", cursor: page === 1 ? "default" : "pointer" }}
            >
              Prev
            </button>
            <span style={{ fontSize: "12px", color: GRAY }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: "7px 16px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === totalPages ? "#ccc" : "#1a1a1a", cursor: page === totalPages ? "default" : "pointer" }}
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}