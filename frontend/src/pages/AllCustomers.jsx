import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORANGE   = "#E07B39";
const ORANGE_L = "#fdf3ed";
const RED      = "#E24B4A";
const GREEN    = "#63992E";
const GRAY     = "#888";

const PAGE_SIZE = 10;

const AUTH_LABELS = {
  otp:      { label: "OTP",      bg: "#e8f4fd", text: "#185FA5" },
  password: { label: "Password", bg: "#f3e8fd", text: "#6B21A8" },
  google:   { label: "Google",   bg: "#e8fdf0", text: "#0F6E56" },
  both:     { label: "Both",     bg: "#FFF8E1", text: "#BA7517" },
};

const ROLE_COLORS = {
  customer: { bg: ORANGE_L,  text: ORANGE },
  admin:    { bg: "#FCEBEB", text: "#A32D2D" },
  staff:    { bg: "#EAF3DE", text: "#3B6D11" },
};

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Badge({ label, bg, text }) {
  return (
    <span style={{
      fontSize: "11px", fontWeight: "600", padding: "3px 10px",
      borderRadius: "20px", background: bg, color: text, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function Avatar({ src, name }) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  return (!src || imgError) ? (
    <div style={{
      width: "36px", height: "36px", borderRadius: "50%",
      background: ORANGE_L, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: "13px", fontWeight: "700",
      color: ORANGE, flexShrink: 0, letterSpacing: "0.5px", userSelect: "none",
    }}>
      {initials}
    </div>
  ) : (
    <img src={src} alt={name} onError={() => setImgError(true)}
      style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  );
}

/* ── MOBILE CARD ─────────────────────────────── */
function CustomerCard({ c, orders, onDelete }) {
  const [open, setOpen] = useState(false);

  const customerOrders = orders.filter(o => o.customerId === c._id || o.email === c.email);
  const totalSpent = customerOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const auth   = AUTH_LABELS[c.authMethod] || { label: c.authMethod, bg: "#f5f5f5", text: "#555" };
  const role   = ROLE_COLORS[c.role]       || { bg: "#f5f5f5", text: "#555" };
  const joined = new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const lastLogin = c.lastLoginAt
    ? new Date(c.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const address = c.address
    ? [c.address.houseNo, c.address.areaName, c.address.areaNo, c.address.city, c.address.pinCode]
        .filter(v => v && v.trim() !== "").join(", ") || null
    : null;

  return (
    <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", marginBottom: "10px", overflow: "hidden" }}>
      {/* Card Header — always visible */}
      <div onClick={() => setOpen(o => !o)} style={{ padding: "14px 16px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Avatar src={c.avatar} name={c.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a" }}>{c.name}</span>
              <Badge label={c.role} bg={role.bg} text={role.text} />
              {c.isVerified
                ? <i className="ti ti-circle-check" style={{ fontSize: "15px", color: GREEN }} />
                : <i className="ti ti-clock"         style={{ fontSize: "15px", color: "#f59e0b" }} />
              }
            </div>
            <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()}
              style={{ fontSize: "12px", color: ORANGE, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.email}
            </a>
          </div>
          {/* Expand + Delete */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onDelete(c._id); }}
              style={{ background: "none", border: "none", color: RED, cursor: "pointer", padding: "4px", fontSize: "18px", display: "flex" }}
              title="Delete"
            >
              <i className="ti ti-trash" />
            </button>
            <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: "16px", color: GRAY }} />
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{ display: "flex", gap: "16px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #f5f5f3" }}>
          <div>
            <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Orders</p>
            <p style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>{customerOrders.length}</p>
          </div>
          <div>
            <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Spent</p>
            <p style={{ fontSize: "14px", fontWeight: "700", color: ORANGE, margin: 0 }}>₹{totalSpent.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Auth</p>
            <Badge label={auth.label} bg={auth.bg} text={auth.text} />
          </div>
          <div style={{ marginLeft: "auto" }}>
            <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Joined</p>
            <p style={{ fontSize: "12px", color: GRAY, margin: 0 }}>{joined}</p>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f0ece8" }}>
          <div style={{ paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* UID + Phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "#fafaf8", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f0ece8" }}>
                <p style={{ fontSize: "10px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px", fontWeight: "600" }}>User ID</p>
                <p style={{ fontSize: "12px", fontFamily: "monospace", color: ORANGE, margin: 0, fontWeight: "600" }}>
                  {c._id ? c._id.slice(-8).toUpperCase() : "—"}
                </p>
              </div>
              <div style={{ background: "#fafaf8", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f0ece8" }}>
                <p style={{ fontSize: "10px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px", fontWeight: "600" }}>Phone</p>
                <p style={{ fontSize: "12px", color: "#1a1a1a", margin: 0 }}>{c.phone || "—"}</p>
              </div>
            </div>

            {/* Address */}
            <div style={{ background: "#fafaf8", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f0ece8" }}>
              <p style={{ fontSize: "10px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px", fontWeight: "600" }}>Delivery Address</p>
              <p style={{ fontSize: "12px", color: address ? "#1a1a1a" : GRAY, margin: 0, lineHeight: "1.6" }}>
                {address || "No address saved"}
              </p>
            </div>

            {/* Login Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "#fafaf8", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f0ece8" }}>
                <p style={{ fontSize: "10px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px", fontWeight: "600" }}>Last Login</p>
                <p style={{ fontSize: "12px", color: "#1a1a1a", margin: 0 }}>{lastLogin}</p>
              </div>
              <div style={{ background: "#fafaf8", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f0ece8" }}>
                <p style={{ fontSize: "10px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px", fontWeight: "600" }}>Total Logins</p>
                <p style={{ fontSize: "12px", color: "#1a1a1a", margin: 0 }}>{(c.loginCount ?? 0) + 1}</p>
              </div>
            </div>

            {/* Dietary */}
            <div style={{ background: "#fafaf8", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f0ece8" }}>
              <p style={{ fontSize: "10px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px", fontWeight: "600" }}>Dietary Preferences</p>
              {c.preferences?.dietaryRestrictions?.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {c.preferences.dietaryRestrictions.map((d, i) => (
                    <span key={i} style={{ fontSize: "11px", background: ORANGE_L, color: ORANGE, padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{d}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: GRAY, margin: 0 }}>None specified</p>
              )}
            </div>

            {/* Recent Orders */}
            {customerOrders.length > 0 && (
              <div style={{ background: "#fafaf8", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f0ece8" }}>
                <p style={{ fontSize: "10px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px", fontWeight: "600" }}>Recent Orders</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {customerOrders.slice(0, 3).map((o, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <span style={{ color: "#1a1a1a", fontWeight: "500", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>{o.itemName}</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                        <span style={{ fontWeight: "700", color: ORANGE }}>₹{o.totalAmount?.toLocaleString("en-IN")}</span>
                        <span style={{
                          fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                          background: o.orderStatus === "Delivered" ? "#e8fdf0" : o.orderStatus === "Cancelled" ? "#FCEBEB" : "#FFF8E1",
                          color: o.orderStatus === "Delivered" ? "#0F6E56" : o.orderStatus === "Cancelled" ? "#A32D2D" : "#BA7517",
                          fontWeight: "600",
                        }}>
                          {o.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── DESKTOP ROW ─────────────────────────────── */
function CustomerRow({ c, orders, onDelete }) {
  const [open, setOpen] = useState(false);

  const customerOrders = orders.filter(o => o.customerId === c._id || o.email === c.email);
  const totalSpent = customerOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const auth   = AUTH_LABELS[c.authMethod] || { label: c.authMethod, bg: "#f5f5f5", text: "#555" };
  const role   = ROLE_COLORS[c.role]       || { bg: "#f5f5f5", text: "#555" };
  const joined = new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const lastLogin = c.lastLoginAt
    ? new Date(c.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const address = c.address
    ? [c.address.houseNo, c.address.areaName, c.address.areaNo, c.address.city, c.address.pinCode]
        .filter(v => v && v.trim() !== "").join(", ") || null
    : null;

  return (
    <>
      <tr
        onClick={(e) => { if (e.defaultPrevented) return; setOpen(o => !o); }}
        style={{ borderBottom: open ? "none" : "1px solid #fafaf8", cursor: "pointer", background: open ? "#fffaf7" : "#fff" }}
      >
        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Avatar src={c.avatar} name={c.name} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: 0, whiteSpace: "nowrap" }}>{c.name}</p>
              <p style={{ fontSize: "11px", color: GRAY, margin: 0 }}>{c.phone || "No phone"}</p>
            </div>
          </div>
        </td>
        <td style={{ padding: "12px 10px", fontSize: "12px", verticalAlign: "middle" }}>
          <a href={`mailto:${c.email}`} style={{ color: ORANGE, textDecoration: "none" }} onClick={e => e.stopPropagation()}>{c.email}</a>
        </td>
        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
          <Badge label={c.role} bg={role.bg} text={role.text} />
        </td>
        <td style={{ padding: "12px 10px", color: GRAY, fontFamily: "monospace", fontSize: "11px", verticalAlign: "middle" }}>
          {c._id ? c._id.slice(-8).toUpperCase() : "—"}
        </td>
        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
          <Badge label={auth.label} bg={auth.bg} text={auth.text} />
        </td>
        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
          {c.isVerified
            ? <i className="ti ti-circle-check" style={{ fontSize: "17px", color: GREEN }} />
            : <i className="ti ti-clock"         style={{ fontSize: "17px", color: "#f59e0b" }} />
          }
        </td>
        <td style={{ padding: "12px 10px", fontWeight: "600", color: "#1a1a1a", verticalAlign: "middle" }}>{customerOrders.length}</td>
        <td style={{ padding: "12px 10px", fontWeight: "700", color: ORANGE, verticalAlign: "middle" }}>₹{totalSpent.toLocaleString("en-IN")}</td>
        <td style={{ padding: "12px 10px", color: GRAY, fontSize: "12px", whiteSpace: "nowrap", verticalAlign: "middle" }}>{joined}</td>
        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: "14px", color: GRAY }} />
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(c._id); }}
              style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "13px", padding: 0 }}
              title="Delete customer"
            >
              <i className="ti ti-trash" />
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr style={{ borderBottom: "1px solid #fafaf8", background: "#fffaf7" }}>
          <td colSpan={10} style={{ padding: "0 12px 16px 12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", paddingTop: "4px" }}>
              <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px", padding: "12px 14px" }}>
                <p style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px", fontWeight: "600" }}>Delivery Address</p>
                {address
                  ? <p style={{ fontSize: "12px", color: "#1a1a1a", margin: 0, lineHeight: "1.6" }}>{address}</p>
                  : <p style={{ fontSize: "12px", color: GRAY, margin: 0 }}>No address saved</p>
                }
              </div>
              <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px", padding: "12px 14px" }}>
                <p style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px", fontWeight: "600" }}>Login Info</p>
                <p style={{ fontSize: "12px", color: "#1a1a1a", margin: "0 0 4px" }}><span style={{ color: GRAY }}>Last login:</span> {lastLogin}</p>
                <p style={{ fontSize: "12px", color: "#1a1a1a", margin: 0 }}><span style={{ color: GRAY }}>Total logins:</span> {(c.loginCount ?? 0) + 1}</p>
              </div>
              <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px", padding: "12px 14px" }}>
                <p style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px", fontWeight: "600" }}>Dietary Preferences</p>
                {c.preferences?.dietaryRestrictions?.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {c.preferences.dietaryRestrictions.map((d, i) => (
                      <span key={i} style={{ fontSize: "11px", background: ORANGE_L, color: ORANGE, padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{d}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: GRAY, margin: 0 }}>None specified</p>
                )}
              </div>
              {customerOrders.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px", padding: "12px 14px", gridColumn: "span 2" }}>
                  <p style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px", fontWeight: "600" }}>Recent Orders</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {customerOrders.slice(0, 3).map((o, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                        <span style={{ color: "#1a1a1a", fontWeight: "500" }}>{o.itemName}</span>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <span style={{ color: GRAY }}>{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          <span style={{ fontWeight: "700", color: ORANGE }}>₹{o.totalAmount?.toLocaleString("en-IN")}</span>
                          <span style={{
                            fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                            background: o.orderStatus === "Delivered" ? "#e8fdf0" : o.orderStatus === "Cancelled" ? "#FCEBEB" : "#FFF8E1",
                            color: o.orderStatus === "Delivered" ? "#0F6E56" : o.orderStatus === "Cancelled" ? "#A32D2D" : "#BA7517",
                            fontWeight: "600",
                          }}>
                            {o.orderStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── MAIN PAGE ───────────────────────────────── */
export default function AllCustomers() {
  const [customers, setCustomers]           = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [roleFilter, setRoleFilter]         = useState("All");
  const [verifiedFilter, setVerifiedFilter] = useState("All");
  const [page, setPage]                     = useState(1);
  const [showFilters, setShowFilters]       = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const opts = { credentials: "include" };
    Promise.all([
      fetch(`${API}/api/users?limit=200`, opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/orders`, opts).then(r => r.ok ? r.json() : []),
    ]).then(([cust, ord]) => {
      setCustomers(Array.isArray(cust) ? cust : cust.users || []);
      setOrders(Array.isArray(ord) ? ord : ord.orders || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search, roleFilter, verifiedFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    const r = await fetch(`${API}/api/users/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) setCustomers(prev => prev.filter(c => c._id !== id));
  };

  const filtered = customers
    .filter(c => roleFilter === "All" || c.role === roleFilter)
    .filter(c => verifiedFilter === "All" || (verifiedFilter === "Verified" ? c.isVerified : !c.isVerified))
    .filter(c => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageCustomers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalCustomers = customers.filter(c => c.role === "customer").length;
  const verifiedCount  = customers.filter(c => c.isVerified).length;
  const last7          = new Date(Date.now() - 7 * 86400000);
  const newThisWeek    = customers.filter(c => new Date(c.createdAt) >= last7).length;
  const googleCount    = customers.filter(c => c.authMethod === "google" || c.authMethod === "both").length;

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE, animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading customers…</p>
      </div>
    </div>
  );

  const pad = isMobile ? "16px" : "28px 32px";
  const selectStyle = {
    width: "100%", padding: "10px 14px", fontSize: "13px",
    border: "1px solid #f0ece8", borderRadius: "10px",
    outline: "none", background: "#fff", cursor: "pointer",
  };

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ padding: pad, maxWidth: "1400px" }}>

        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => window.location.href = "/admin"}
            style={{ background: "none", border: "none", color: GRAY, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <i className="ti ti-arrow-left" /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>Customers</h1>
          <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>{filtered.length} customer{filtered.length !== 1 ? "s" : ""} found</p>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: "12px", marginBottom: "20px",
        }}>
          {[
            { label: "Total Customers", value: totalCustomers, icon: "ti-users" },
            { label: "Verified",        value: verifiedCount,  icon: "ti-circle-check" },
            { label: "New This Week",   value: newThisWeek,    icon: "ti-user-plus" },
            { label: "Google Auth",     value: googleCount,    icon: "ti-brand-google" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: isMobile ? "14px" : "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: ORANGE_L, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: "15px", color: ORANGE }} />
                </span>
                <span style={{ fontSize: isMobile ? "11px" : "12px", color: GRAY, lineHeight: "1.3" }}>{s.label}</span>
              </div>
              <p style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter toggle */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{
            position: isMobile ? "sticky" : "static",
            top: 0, background: isMobile ? "#fafaf8" : "transparent",
            paddingBottom: isMobile ? "8px" : 0, zIndex: 10,
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search by name, email, or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, padding: "10px 14px", fontSize: "13px",
                  border: "1px solid #f0ece8", borderRadius: "10px",
                  outline: "none", background: "#fff",
                }}
              />
              {isMobile ? (
                <button
                  onClick={() => setShowFilters(v => !v)}
                  style={{
                    padding: "10px 12px", border: `1px solid ${showFilters ? ORANGE : "#f0ece8"}`,
                    borderRadius: "10px", background: showFilters ? ORANGE_L : "#fff",
                    color: showFilters ? ORANGE : GRAY, cursor: "pointer", flexShrink: 0,
                    display: "flex", alignItems: "center", gap: "4px", fontSize: "13px",
                  }}
                >
                  <i className="ti ti-adjustments-horizontal" aria-hidden /> Filters
                </button>
              ) : (
                <div style={{ display: "flex", gap: "10px" }}>
                  <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    style={{ ...selectStyle, width: "auto", padding: "10px 14px" }}>
                    <option value="All">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </select>
                  <select value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)}
                    style={{ ...selectStyle, width: "auto", padding: "10px 14px" }}>
                    <option value="All">All Status</option>
                    <option value="Verified">Verified</option>
                    <option value="Unverified">Unverified</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Mobile filter panel */}
          {isMobile && showFilters && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "12px", background: "#fafaf8", borderRadius: "10px", border: "1px solid #f0ece8", marginTop: "8px" }}>
              <div>
                <label style={{ fontSize: "10px", color: GRAY, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>Role</label>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectStyle}>
                  <option value="All">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "10px", color: GRAY, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>Status</label>
                <select value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)} style={selectStyle}>
                  <option value="All">All Status</option>
                  <option value="Verified">Verified</option>
                  <option value="Unverified">Unverified</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isMobile ? (
          /* ── Mobile Cards ── */
          <div>
            {pageCustomers.length === 0 ? (
              <p style={{ textAlign: "center", color: GRAY, marginTop: "40px" }}>No customers match your filters</p>
            ) : pageCustomers.map(c => (
              <CustomerCard key={c._id} c={c} orders={orders} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          /* ── Desktop Table ── */
          <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                    {["Customer", "Email", "Role", "User ID", "Auth", "Verified", "Orders", "Total Spent", "Joined", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageCustomers.map(c => (
                    <CustomerRow key={c._id} c={c} orders={orders} onDelete={handleDelete} />
                  ))}
                  {pageCustomers.length === 0 && (
                    <tr><td colSpan={10} style={{ padding: "30px", textAlign: "center", color: GRAY }}>No customers match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "18px" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "7px 16px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === 1 ? "#ccc" : "#1a1a1a", cursor: page === 1 ? "default" : "pointer" }}>
              Prev
            </button>
            <span style={{ fontSize: "12px", color: GRAY }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "7px 16px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === totalPages ? "#ccc" : "#1a1a1a", cursor: page === totalPages ? "default" : "pointer" }}>
              Next
            </button>
          </div>
        )}

        <p style={{ fontSize: "12px", color: GRAY, textAlign: "center", marginTop: "14px" }}>
          <i className="ti ti-info-circle" style={{ marginRight: "4px" }} />
          {isMobile ? "Tap any card to expand details" : "Click any row to expand full details"}
        </p>

      </div>
    </div>
  );
}