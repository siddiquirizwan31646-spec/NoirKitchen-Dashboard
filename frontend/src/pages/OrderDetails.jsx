import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORANGE = "#E07B39";
const ORANGE_L = "#fdf3ed";
const GRAY = "#888";
const GREEN = "#0F6E56";
const GREEN_L = "#e8fdf0";

const rupee = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// ── Auth helper ──────────────────────────────────────────────────────────────
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

const STATUS_COLORS = {
  Placed: { bg: "#e8f4fd", text: "#185FA5" },
  Preparing: { bg: "#FFF8E1", text: "#BA7517" },
  "Out for Delivery": { bg: "#EAF3DE", text: "#3B6D11" },
  Delivered: { bg: "#e8fdf0", text: "#0F6E56" },
  Cancelled: { bg: "#FCEBEB", text: "#A32D2D" },
};
const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: "#f5f5f5", text: "#555" };
  return (
    <span style={{
      fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
      background: c.bg, color: c.text, fontWeight: "700", display: "inline-block",
    }}>
      {status}
    </span>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.7px",
      color: ORANGE, fontWeight: "700", marginBottom: "10px",
      paddingBottom: "6px", borderBottom: `1px solid ${ORANGE_L}`,
    }}>
      {children}
    </div>
  );
}

function Field({ label, value, mono, full }) {
  const v = value == null ? "" : String(value).trim();
  if (!v || v === "None" || v === "null") return null;
  return (
    <div style={{ marginBottom: "11px", gridColumn: full ? "1 / -1" : undefined }}>
      <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.6px", color: GRAY, fontWeight: "600", marginBottom: "3px" }}>
        {label}
      </div>
      <div style={{ fontSize: "13px", color: "#1a1a1a", fontFamily: mono ? "'Courier New', monospace" : "inherit", wordBreak: "break-all", lineHeight: "1.4" }}>
        {v}
      </div>
    </div>
  );
}

/* ─── Cancellation reason modal ─ */
function CancelReasonModal({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please enter a reason for cancellation.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "14px", padding: "24px",
          width: "400px", maxWidth: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "800", color: "#1a1a1a" }}>
          Cancel Order
        </h3>
        <p style={{ margin: "0 0 14px", fontSize: "12px", color: GRAY }}>
          #{order._id?.slice(-8).toUpperCase()} — {order.fullName}
        </p>

        <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>
          Reason for cancellation
        </label>
        <textarea
          autoFocus
          rows={4}
          placeholder="e.g. Customer requested cancellation, out of stock, duplicate order…"
          value={reason}
          onChange={(e) => { setReason(e.target.value); if (error) setError(""); }}
          style={{
            width: "100%", padding: "10px 12px", fontSize: "13px",
            border: `1px solid ${error ? "#e07b7b" : "#f0ece8"}`, borderRadius: "10px",
            outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
        {error && <p style={{ color: "#A32D2D", fontSize: "11px", margin: "6px 0 0" }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "8px 16px", fontSize: "13px", borderRadius: "8px",
              border: "1px solid #f0ece8", background: "#fff", color: "#555", cursor: "pointer",
            }}
          >
            Keep Order
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              padding: "8px 16px", fontSize: "13px", borderRadius: "8px", border: "none",
              background: "#A32D2D", color: "#fff", fontWeight: "600",
              cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Cancelling…" : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing breakdown ─────────────────────────────────────────── */
function PricingBreakdown({ order }) {
  const base = Number(order.baseAmount) || 0;
  const addon = Number(order.addonTotal) || 0;
  const gst = Number(order.gstAmount) || 0;
  const discount = Number(order.discountAmount) || 0;
  const total = Number(order.totalAmount) || 0;
  const subtotal = base + addon + gst;          // before discount

  const hasCoupon = order.couponCode && order.couponCode !== "" && order.couponCode !== "None";
  const discountLabel = hasCoupon
    ? `Discount (${order.couponCode}${order.discountValue ? ` · ${order.discountValue}${order.discountType === "Percentage" ? "%" : "₹"} off` : ""})`
    : "Discount";

  const row = (label, value, opts = {}) => {
    if (value == null || value === 0) return null;
    const { bold, orange, green, isDiscount, light, pill } = opts;
    return (
      <div style={{
        padding: bold ? "12px 16px" : "10px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: bold ? ORANGE_L : light ? "#fafaf8" : "transparent",
        borderBottom: bold ? "none" : "1px solid #f0ece8",
      }}>
        <span style={{
          fontSize: bold ? "13px" : "12px",
          fontWeight: bold ? "700" : "400",
          color: bold ? "#1a1a1a" : "#555",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          {label}
          {pill && (
            <span style={{
              fontSize: "10px", padding: "2px 7px", borderRadius: "20px",
              background: GREEN_L, color: GREEN, fontWeight: "700",
            }}>
              {pill}
            </span>
          )}
        </span>
        <span style={{
          fontSize: bold ? "15px" : "13px",
          fontWeight: bold ? "800" : "600",
          color: orange ? ORANGE : green ? GREEN : isDiscount ? GREEN : "#1a1a1a",
        }}>
          {isDiscount ? "−" : ""}{rupee(value)}
        </span>
      </div>
    );
  };

  return (
    <div style={{ border: "1px solid #f0ece8", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
      {row("Base Amount", base)}
      {addon > 0 && row("Add-on Total", addon)}
      {gst > 0 && row("GST", gst)}

      {/* subtotal line — only meaningful if there's a discount */}
      {discount > 0 && (
        <div style={{
          padding: "10px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#fafaf8", borderBottom: "1px solid #f0ece8",
          borderTop: "1px dashed #e8e0d8",
        }}>
          <span style={{ fontSize: "12px", color: "#888" }}>Subtotal (before discount)</span>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#888", textDecoration: "line-through" }}>
            {rupee(subtotal)}
          </span>
        </div>
      )}

      {/* discount row */}
      {discount > 0 && row(
        discountLabel,
        discount,
        {
          isDiscount: true,
          pill: hasCoupon ? "Coupon Applied" : undefined,
        }
      )}

      {/* savings callout */}
      {discount > 0 && (
        <div style={{
          padding: "8px 16px",
          background: GREEN_L,
          borderBottom: "1px solid #d4f0e7",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <span style={{ fontSize: "11px", color: GREEN, fontWeight: "600" }}>
            🎉 You saved {rupee(discount)} on this order
          </span>
        </div>
      )}

      {/* total */}
      <div style={{
        padding: "14px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: ORANGE_L,
      }}>
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a" }}>Total</span>
        <span style={{ fontSize: "16px", fontWeight: "800", color: ORANGE }}>{rupee(total)}</span>
      </div>
    </div>
  );
}

/* ─── Order Details Page ────────────────────────────────────────── */
export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/orders/${orderId}`, authOpts())
      .then((r) => {
        if (!r.ok) throw new Error("Order not found");
        return r.json();
      })
      .then((data) => {
        const o = data.order || data;
        setOrder(o);
        setStatus(o.orderStatus);
      })
      .catch((e) => setError(e.message || "Failed to load order"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const saveStatus = async (newStatus, cancelReason) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/orders/${order._id}/status`, {
        method: "PATCH",
        ...authOpts(),
        body: JSON.stringify(
          cancelReason ? { orderStatus: newStatus, cancelReason } : { orderStatus: newStatus }
        ),
      });
      if (r.ok) {
        setStatus(newStatus);
      } else {
        const data = await r.json().catch(() => ({}));
        alert(data.message || "Failed to update status. Please try again.");
      }
    } catch {
      alert("Failed to update status. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === "Cancelled") {
      setShowCancelModal(true);
      return;
    }
    saveStatus(newStatus);
  };

  const handleConfirmCancel = async (reason) => {
    await saveStatus("Cancelled", reason);
    setShowCancelModal(false);
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE,
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: GRAY, fontSize: "14px" }}>Loading order…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#A32D2D", fontSize: "14px", marginBottom: "12px" }}>{error || "Order not found"}</p>
          <button
            onClick={() => navigate("/admin/orders")}
            style={{ padding: "8px 16px", fontSize: "13px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", cursor: "pointer" }}
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const orderDate = order.orderDateTime || order.createdAt;

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ padding: "28px 32px", maxWidth: "840px", margin: "0 auto" }}>

        <button
          onClick={() => navigate("/admin/orders")}
          style={{ background: "none", border: "none", color: GRAY, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "18px" }}
        >
          <i className="ti ti-arrow-left" style={{ marginRight: "4px" }} aria-hidden />
          Back to Orders
        </button>

        <div style={{
          background: "#fff", borderRadius: "18px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}>

          {/* ── Header ── */}
          <div style={{
            padding: "24px 28px 20px", borderBottom: "1px solid #f0ece8",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            background: ORANGE_L,
          }}>
            <div>
              <div style={{ fontSize: "10px", color: GRAY, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "4px" }}>Order ID</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#1a1a1a", letterSpacing: "-0.3px", fontFamily: "'Courier New', monospace" }}>
                #{order._id?.slice(-8).toUpperCase()}
              </div>
              {orderDate && (
                <div style={{ fontSize: "12px", color: GRAY, marginTop: "4px" }}>
                  {new Date(orderDate).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
            <StatusBadge status={status} />
          </div>

          {/* ── Body ── */}
          <div style={{ padding: "24px 28px" }}>

            {/* Status editor */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              {(status === "Cancelled" || status === "Out for Delivery" || status === "Delivered") ? (
                <span style={{ fontSize: "12px", color: GRAY, fontStyle: "italic" }}>
                  {status === "Cancelled"
                    ? "Order cancelled — status locked"
                    : `Order ${status.toLowerCase()} — status locked`}
                </span>
              ) : (
                <>
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={saving}
                    style={{ fontSize: "12px", padding: "7px 12px", borderRadius: "8px", border: `1.5px solid ${ORANGE}`, background: "#fff", color: "#1a1a1a", fontWeight: "600", cursor: "pointer", outline: "none", opacity: saving ? 0.6 : 1 }}
                  >
                    {ORDER_STATUSES.filter(s => s !== "Out for Delivery" && s !== "Delivered").map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {saving && <span style={{ fontSize: "11px", color: GRAY }}>Saving…</span>}
                </>
              )}
            </div>

            {/* ── Item ── */}
            <SectionTitle>Item</SectionTitle>
            <div style={{ border: "1px solid #f0ece8", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
              <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a" }}>{order.itemName || "—"}</div>
                  {order.variant && order.variant !== "" && (
                    <div style={{ fontSize: "12px", color: GRAY, marginTop: "3px" }}>Variant: <span style={{ color: "#555", fontWeight: "600" }}>{order.variant}</span></div>
                  )}
                  {order.addons && order.addons !== "" && (
                    <div style={{ fontSize: "12px", color: GRAY, marginTop: "2px" }}>Add-ons: <span style={{ color: "#555" }}>{order.addons}</span></div>
                  )}
                  {order.specialInstructions && order.specialInstructions !== "" && (
                    <div style={{ fontSize: "12px", color: "#9a7c5f", marginTop: "4px", fontStyle: "italic" }}>"{order.specialInstructions}"</div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "13px", color: GRAY, marginBottom: "4px" }}>Qty: <span style={{ fontWeight: "700", color: "#1a1a1a" }}>×{order.quantity || 1}</span></div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: ORANGE }}>{rupee(order.baseAmount || 0)}</div>
                  <div style={{ fontSize: "10px", color: GRAY }}>base price</div>
                </div>
              </div>
            </div>

            {/* ── Pricing ── */}
            <SectionTitle>Pricing</SectionTitle>
            <PricingBreakdown order={order} />

            {/* ── Payment & Delivery ── */}
            <SectionTitle>Payment & Delivery</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px", marginBottom: "20px" }}>
              <Field label="Payment Method" value={order.paymentMethod} />
              <Field label="Estimated Delivery" value={order.estimatedDelivery} />
              <Field label="Delivery Partner" value={order.deliveryPartner} />
            </div>

            {/* ── Customer ── */}
            <SectionTitle>Customer</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px", marginBottom: "20px" }}>
              <Field label="Full Name" value={order.fullName} />
              <Field label="Mobile" value={order.mobile || order.phone} />
              <Field label="Email" value={order.email} full />
              <Field label="Customer ID" value={order.customerId ? `…${String(order.customerId).slice(-8).toUpperCase()}` : null} mono />
              <Field label="Food ID" value={order.foodId ? `…${String(order.foodId).slice(-8).toUpperCase()}` : null} mono />
            </div>

            {/* ── Delivery Address ── */}
            <SectionTitle>Delivery Address</SectionTitle>
            <div style={{ border: "1px solid #f0ece8", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px" }}>
              {order.deliveryAddress ? (
                <div style={{ fontSize: "13px", color: "#1a1a1a", lineHeight: "1.6" }}>{order.deliveryAddress}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
                  <Field label="House No" value={order.houseNo} />
                  <Field label="Area Name" value={order.areaName} />
                  <Field label="Area / No" value={order.areaNo} />
                  <Field label="City" value={order.city} />
                  <Field label="Pin Code" value={order.pinCode || order.pincode} />
                </div>
              )}
              {order.deliveryAddress && (order.houseNo || order.areaName) && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #f0ece8", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
                  <Field label="House No" value={order.houseNo} />
                  <Field label="Area Name" value={order.areaName} />
                  <Field label="Area No" value={order.areaNo} />
                  <Field label="City" value={order.city} />
                  <Field label="Pin Code" value={order.pinCode || order.pincode} />
                </div>
              )}
              {(() => {
                const lat = order.latitude ?? order.location?.coordinates?.[1];
                const lng = order.longitude ?? order.location?.coordinates?.[0];
                if (lat == null || lng == null) return null;
                return (
                  <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #f0ece8", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
                      <Field label="Latitude" value={lat} mono />
                      <Field label="Longitude" value={lng} mono />
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "12px", fontWeight: "700", color: ORANGE,
                        textDecoration: "none", border: `1.5px solid ${ORANGE}`,
                        borderRadius: "8px", padding: "6px 12px", whiteSpace: "nowrap",
                      }}
                    >
                      View on Map
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* ── Timestamps ── */}
            <SectionTitle>Timestamps</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
              <Field label="Order Date & Time" value={order.orderDateTime ? new Date(order.orderDateTime).toLocaleString("en-IN") : null} />
              <Field label="Created At" value={order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : null} />
              <Field label="Updated At" value={order.updatedAt ? new Date(order.updatedAt).toLocaleString("en-IN") : null} />
            </div>

          </div>

          {/* ── Footer ── */}
          <div style={{ padding: "16px 28px", borderTop: "1px solid #f0ece8", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafaf8" }}>
            <div>
              <div style={{ fontSize: "12px", color: GRAY }}>Total Amount</div>
              {order.discountAmount > 0 && (
                <div style={{ fontSize: "11px", color: GREEN, fontWeight: "600", marginTop: "2px" }}>
                  Saved {rupee(order.discountAmount)}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {order.discountAmount > 0 && (
                <div style={{ fontSize: "12px", color: "#aaa", textDecoration: "line-through", marginBottom: "2px" }}>
                  {rupee((Number(order.baseAmount) || 0) + (Number(order.addonTotal) || 0) + (Number(order.gstAmount) || 0))}
                </div>
              )}
              <div style={{ fontSize: "20px", fontWeight: "800", color: ORANGE }}>{rupee(order.totalAmount)}</div>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelReasonModal
          order={order}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}