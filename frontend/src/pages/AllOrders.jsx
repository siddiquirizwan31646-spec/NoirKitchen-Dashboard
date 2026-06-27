import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORANGE = "#E07B39";
const ORANGE_L = "#fdf3ed";
const GRAY = "#888";

const rupee = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const STATUS_COLORS = {
  Placed: { bg: "#e8f4fd", text: "#185FA5" },
  Preparing: { bg: "#FFF8E1", text: "#BA7517" },
  "Out for Delivery": { bg: "#EAF3DE", text: "#3B6D11" },
  Delivered: { bg: "#e8fdf0", text: "#0F6E56" },
  Cancelled: { bg: "#FCEBEB", text: "#A32D2D" },
};
const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

/* ─── responsive hook ─────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

/* ─── Discount badge ──────────────────────────── */
function DiscountBadge({ order }) {
  if (!order.discountAmount || order.discountAmount <= 0) {
    return <span style={{ color: "#ccc" }}>—</span>;
  }
  const detail =
    order.discountType === "Percentage"
      ? `${order.discountValue}% off`
      : order.discountType === "Flat"
        ? `Flat ₹${order.discountValue} off`
        : "";
  return (
    <span
      title={detail}
      style={{
        fontSize: "11px", fontWeight: "600", color: "#0F6E56",
        background: "#e8fdf0", borderRadius: "20px", padding: "3px 8px",
        display: "inline-flex", alignItems: "center", gap: "4px",
        whiteSpace: "nowrap",
      }}
    >
      {order.couponCode || "Discount"} · −{rupee(order.discountAmount)}
    </span>
  );
}

/* ─── Cancel modal ────────────────────────────── */
function CancelReasonModal({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) { setError("Please enter a reason for cancellation."); return; }
    setError("");
    setSubmitting(true);
    try { await onConfirm(reason.trim()); } finally { setSubmitting(false); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 1000, padding: "0",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 20px 32px",
          width: "100%", maxWidth: "520px", boxShadow: "0 -4px 30px rgba(0,0,0,0.15)",
        }}
      >
        {/* drag handle */}
        <div style={{ width: "36px", height: "4px", background: "#e5e5e3", borderRadius: "2px", margin: "0 auto 18px" }} />
        <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: "800", color: "#1a1a1a" }}>Cancel Order</h3>
        <p style={{ margin: "0 0 16px", fontSize: "12px", color: GRAY }}>
          #{order._id?.slice(-8).toUpperCase()} — {order.fullName}
        </p>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>
          Reason for cancellation
        </label>
        <textarea
          autoFocus
          rows={4}
          placeholder="e.g. Customer requested cancellation, out of stock, duplicate order…"
          value={reason}
          onChange={(e) => { setReason(e.target.value); if (error) setError(""); }}
          style={{
            width: "100%", padding: "12px", fontSize: "14px",
            border: `1px solid ${error ? "#e07b7b" : "#f0ece8"}`, borderRadius: "12px",
            outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
        {error && <p style={{ color: "#A32D2D", fontSize: "12px", margin: "6px 0 0" }}>{error}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "18px" }}>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              width: "100%", padding: "14px", fontSize: "14px", borderRadius: "12px", border: "none",
              background: "#A32D2D", color: "#fff", fontWeight: "700",
              cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Cancelling…" : "Confirm Cancellation"}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              width: "100%", padding: "14px", fontSize: "14px", borderRadius: "12px",
              border: "1px solid #f0ece8", background: "#fafaf8", color: "#555", cursor: "pointer",
            }}
          >
            Keep Order
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Status select ───────────────────────────── */
function OrderStatusSelect({ orderId, current, onUpdate, onCancelRequest }) {
  const [val, setVal] = useState(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setVal(current); }, [current]);

  const save = async (newStatus) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (r.ok) { setVal(newStatus); onUpdate?.(orderId, newStatus); }
    } finally { setSaving(false); }
  };

  const handleChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus === "Cancelled") { onCancelRequest(orderId); return; }
    save(newStatus);
  };

  if (val === "Cancelled") {
    return (
      <span style={{
        fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
        background: STATUS_COLORS.Cancelled.bg, color: STATUS_COLORS.Cancelled.text,
        fontWeight: "600", display: "inline-block",
      }}>
        Cancelled
      </span>
    );
  }

  // These statuses can only be set by the delivery system, not manually
  const BLOCKED = ["Out for Delivery", "Delivered"];

  // If current status is already a blocked one, just show a read-only badge
  if (BLOCKED.includes(val)) {
    return (
      <span style={{
        fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
        background: STATUS_COLORS[val]?.bg || "#f5f5f5",
        color: STATUS_COLORS[val]?.text || "#555",
        fontWeight: "600", display: "inline-block", whiteSpace: "nowrap",
      }}>
        {val}
      </span>
    );
  }

  return (
    <select
      value={val}
      onChange={handleChange}
      disabled={saving}
      onClick={(e) => e.stopPropagation()}
      style={{
        fontSize: "12px", padding: "5px 10px", borderRadius: "20px",
        border: "1px solid #ddd", background: STATUS_COLORS[val]?.bg || "#f5f5f5",
        color: STATUS_COLORS[val]?.text || "#555", fontWeight: "600",
        cursor: "pointer", outline: "none", maxWidth: "150px",
      }}
    >
      {ORDER_STATUSES.filter(s => !BLOCKED.includes(s)).map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

/* ─── Mobile Order Card ───────────────────────── */
function OrderCard({ order, onNavigate, onMarkSeen, onCancelRequest, onStatusUpdate }) {
  return (
    <div
      onClick={() => {
        if (order.isNewOrder) onMarkSeen(order._id);
        onNavigate(order._id);
      }}
      style={{
        background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px",
        padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px",
        cursor: "pointer", transition: "background 0.15s",
        borderLeft: order.isNewOrder ? `3px solid ${ORANGE}` : "1px solid #f0ece8",
      }}
    >
      {/* Row 1: ID + NEW badge + Date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          {order.isNewOrder && (
            <span
              onClick={(e) => { e.stopPropagation(); onMarkSeen(order._id); }}
              style={{
                fontSize: "9px", fontWeight: "800", color: "#fff",
                background: ORANGE, borderRadius: "20px", padding: "2px 7px",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              NEW
            </span>
          )}
          <span style={{ fontSize: "13px", fontWeight: "700", color: ORANGE }}>
            #{order._id?.slice(-8).toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: "11px", color: GRAY, whiteSpace: "nowrap" }}>
          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
      </div>

      {/* Row 2: Customer + Phone */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {order.fullName}
          </p>
          <p style={{ fontSize: "12px", color: GRAY, margin: 0 }}>
            {order.mobile || order.phone || "No phone"}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: "15px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 2px" }}>
            {rupee(order.totalAmount)}
          </p>
          {order.discountAmount > 0 && (
            <span style={{ fontSize: "10px", color: "#0F6E56", fontWeight: "600" }}>
              −{rupee(order.discountAmount)} off
            </span>
          )}
        </div>
      </div>

      {/* Row 3: Item + Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <p style={{ fontSize: "12px", color: "#555", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {order.itemName}{order.quantity > 1 ? ` ×${order.quantity}` : ""}
        </p>
        <div onClick={(e) => e.stopPropagation()}>
          <OrderStatusSelect
            orderId={order._id}
            current={order.orderStatus}
            onUpdate={onStatusUpdate}
            onCancelRequest={onCancelRequest}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────── */
const PAGE_SIZE = 10;

export default function AllOrders() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
  fetch(`${API}/api/orders?limit=10000`, { credentials: "include" })
    .then(r => r.ok ? r.json() : [])
    .then(data => setOrders(Array.isArray(data) ? data : data.orders || []))
    .catch(() => { })
    .finally(() => setLoading(false));
}, []);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleStatusUpdate = (id, newStatus) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: newStatus } : o));
  };

  const markSeen = async (orderId) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, isNewOrder: false } : o));
    try {
      await fetch(`${API}/api/orders/${orderId}/mark-seen`, { method: "PATCH", credentials: "include" });
    } catch (err) { console.error("mark-seen error:", err); }
  };

  const handleCancelRequest = (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (order) setCancelOrder(order);
  };

  const handleConfirmCancel = async (reason) => {
    if (!cancelOrder) return;
    try {
      const r = await fetch(`${API}/api/orders/${cancelOrder._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderStatus: "Cancelled", cancelReason: reason }),
      });
      if (r.ok) { handleStatusUpdate(cancelOrder._id, "Cancelled"); setCancelOrder(null); }
      else {
        const data = await r.json().catch(() => ({}));
        alert(data.message || "Failed to cancel order.");
      }
    } catch { alert("Failed to cancel order. Check your connection."); }
  };

  const filtered = orders
    .filter(o => statusFilter === "All" || o.orderStatus === statusFilter)
    .filter(o => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        o.fullName?.toLowerCase().includes(q) ||
        o._id?.toLowerCase().includes(q) ||
        o.mobile?.toLowerCase().includes(q) ||
        o.phone?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageOrders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE,
          animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading orders…</p>
      </div>
    </div>
  );

  const pad = isMobile ? "16px" : "28px 32px";

  /* ── STATUS PILLS (mobile quick-filter) ── */
  const statusCounts = {};
  ORDER_STATUSES.forEach(s => { statusCounts[s] = orders.filter(o => o.orderStatus === s).length; });

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ padding: pad, maxWidth: "1400px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: isMobile ? "14px" : "20px" }}>
          <button
            onClick={() => navigate("/admin")}
            style={{ background: "none", border: "none", color: GRAY, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <i className="ti ti-arrow-left" aria-hidden /> Back to Dashboard
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <h1 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 2px" }}>All Orders</h1>
              <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>
                {filtered.length} order{filtered.length !== 1 ? "s" : ""}
                {statusFilter !== "All" && ` · ${statusFilter}`}
              </p>
            </div>
            {/* Mobile: filter toggle button */}
            {isMobile && (
              <button
                onClick={() => setShowFilters(f => !f)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 14px", background: showFilters ? ORANGE : "#fff",
                  color: showFilters ? "#fff" : "#1a1a1a", border: "1px solid #f0ece8",
                  borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <i className="ti ti-filter" aria-hidden />
                Filter
                {statusFilter !== "All" && (
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: showFilters ? "#fff" : ORANGE, flexShrink: 0,
                  }} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Filters (desktop always visible, mobile toggleable) ── */}
        {(!isMobile || showFilters) && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: isMobile ? "10px" : "0" }}>
              <input
                type="text"
                placeholder="Search by name, phone, or order ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: "200px", padding: isMobile ? "12px 14px" : "10px 14px",
                  fontSize: "14px", border: "1px solid #f0ece8", borderRadius: "10px",
                  outline: "none", background: "#fff",
                }}
              />
              {!isMobile && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "10px 14px", fontSize: "13px", border: "1px solid #f0ece8",
                    borderRadius: "10px", outline: "none", background: "#fff", color: "#1a1a1a", cursor: "pointer",
                  }}
                >
                  <option value="All">All Statuses</option>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ── Mobile: status pill strip ── */}
        {isMobile && (
          <div style={{
            display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px",
            marginBottom: "14px", scrollbarWidth: "none",
          }}>
            <style>{`::-webkit-scrollbar{display:none}`}</style>
            {["All", ...ORDER_STATUSES].map(s => {
              const active = statusFilter === s;
              const count = s === "All" ? orders.length : statusCounts[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    flexShrink: 0, padding: "7px 14px", borderRadius: "20px", border: "none",
                    background: active ? ORANGE : "#fff",
                    color: active ? "#fff" : "#555",
                    fontSize: "12px", fontWeight: "600", cursor: "pointer",
                    boxShadow: active ? "none" : "0 0 0 1px #f0ece8",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  {s === "All" ? "All" : s}
                  <span style={{
                    fontSize: "10px", fontWeight: "700",
                    color: active ? "rgba(255,255,255,0.8)" : GRAY,
                  }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Desktop: Table ── */}
        {!isMobile && (
          <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                    {["Order ID", "Customer", "Phone", "Items", "Amount", "Discount", "Status", "Date"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageOrders.map((o) => (
                    <tr
                      key={o._id}
                      onClick={() => { if (o.isNewOrder) markSeen(o._id); navigate(`/admin/order/${o._id}`); }}
                      style={{ borderBottom: "1px solid #fafaf8", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fdf3ed"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 10px", fontWeight: "600", color: ORANGE }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {o.isNewOrder && (
                            <span
                              onClick={(e) => { e.stopPropagation(); markSeen(o._id); }}
                              title="Mark as seen"
                              style={{ fontSize: "9px", fontWeight: "800", color: "#fff", background: ORANGE, borderRadius: "20px", padding: "2px 7px", cursor: "pointer", letterSpacing: "0.3px", flexShrink: 0 }}
                            >
                              NEW
                            </span>
                          )}
                          #{o._id?.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px", color: "#1a1a1a" }}>{o.fullName}</td>
                      <td style={{ padding: "12px 10px", color: "#555" }}>{o.mobile || o.phone || "—"}</td>
                      <td style={{ padding: "12px 10px", color: "#555" }}>{o.itemName}{o.quantity > 1 ? ` ×${o.quantity}` : ""}</td>
                      <td style={{ padding: "12px 10px", fontWeight: "600", color: "#1a1a1a" }}>{rupee(o.totalAmount)}</td>
                      <td style={{ padding: "12px 10px" }}><DiscountBadge order={o} /></td>
                      <td style={{ padding: "12px 10px" }}>
                        <OrderStatusSelect orderId={o._id} current={o.orderStatus} onUpdate={handleStatusUpdate} onCancelRequest={handleCancelRequest} />
                      </td>
                      <td style={{ padding: "12px 10px", color: GRAY, whiteSpace: "nowrap" }}>
                        {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                  {pageOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: GRAY }}>No orders match your filters</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "18px" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === 1 ? "#ccc" : "#1a1a1a", cursor: page === 1 ? "default" : "pointer" }}>
                  Prev
                </button>
                <span style={{ fontSize: "12px", color: GRAY }}>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", color: page === totalPages ? "#ccc" : "#1a1a1a", cursor: page === totalPages ? "default" : "pointer" }}>
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Mobile: Card List ── */}
        {isMobile && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pageOrders.map(o => (
                <OrderCard
                  key={o._id}
                  order={o}
                  onNavigate={(id) => navigate(`/admin/order/${id}`)}
                  onMarkSeen={markSeen}
                  onCancelRequest={handleCancelRequest}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
              {pageOrders.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: GRAY }}>
                  <i className="ti ti-package-off" style={{ fontSize: "36px", display: "block", marginBottom: "8px", color: "#ddd" }} aria-hidden />
                  No orders match your filters
                </div>
              )}
            </div>

            {/* Mobile pagination */}
            {totalPages > 1 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: "12px", marginTop: "16px", padding: "12px 0",
              }}>
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                  disabled={page === 1}
                  style={{
                    flex: 1, padding: "12px", fontSize: "14px", borderRadius: "10px",
                    border: "1px solid #f0ece8", background: "#fff",
                    color: page === 1 ? "#ccc" : "#1a1a1a",
                    cursor: page === 1 ? "default" : "pointer", fontWeight: "600",
                  }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: "13px", color: GRAY, whiteSpace: "nowrap" }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                  disabled={page === totalPages}
                  style={{
                    flex: 1, padding: "12px", fontSize: "14px", borderRadius: "10px",
                    border: "1px solid #f0ece8", background: "#fff",
                    color: page === totalPages ? "#ccc" : "#1a1a1a",
                    cursor: page === totalPages ? "default" : "pointer", fontWeight: "600",
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {cancelOrder && (
        <CancelReasonModal
          order={cancelOrder}
          onClose={() => setCancelOrder(null)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}