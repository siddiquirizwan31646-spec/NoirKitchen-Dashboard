import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─── colour tokens (matches Dashboard.jsx / AdminDelivery.jsx) ──── */
const ORANGE = "#E07B39";
const ORANGE_L = "#fdf3ed";
const RED = "#E24B4A";
const GREEN = "#63992E";
const GRAY = "#888";
const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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

const COUPON_STATUS_COLORS = {
    Active: { bg: "#EAF3DE", text: "#3B6D11" },
    Inactive: { bg: "#f5f5f5", text: "#777" },
    Expired: { bg: "#FCEBEB", text: "#A32D2D" },
    "Limit Reached": { bg: "#FFF8E1", text: "#BA7517" },
};

/* derive a coupon's display status from its raw fields */
function couponStatus(c) {
    if (!c.isActive) return "Inactive";
    if (c.expiryDate && new Date(c.expiryDate) < new Date()) return "Expired";
    if (c.usageLimit && c.usedCount >= c.usageLimit) return "Limit Reached";
    return "Active";
}

function Badge({ status, map }) {
    const c = map[status] || { bg: "#f5f5f5", text: "#555" };
    return (
        <span style={{
            fontSize: "11px", fontWeight: "600", padding: "3px 10px",
            borderRadius: "20px", background: c.bg, color: c.text, whiteSpace: "nowrap",
        }}>
            {status}
        </span>
    );
}

function StatCard({ icon, label, value, color = ORANGE }) {
    return (
        <div style={{
            background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px",
            padding: "16px 20px", display: "flex", flexDirection: "column", gap: "6px", minWidth: 0,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                    width: "36px", height: "36px", borderRadius: "10px", background: ORANGE_L,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    <i className={`ti ${icon}`} style={{ fontSize: "18px", color }} aria-hidden />
                </span>
                <span style={{ fontSize: "12px", color: GRAY }}>{label}</span>
            </div>
            <span style={{ fontSize: "26px", fontWeight: "700", color: "#1a1a1a" }}>{value}</span>
        </div>
    );
}

function SectionHeader({ title, right }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", gap: "10px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>{title}</h2>
            {right}
        </div>
    );
}

const EMPTY_COUPON = {
    code: "", discountType: "Percentage", discountValue: "",
    minOrderAmount: "", maxDiscount: "", usageLimit: "", expiryDate: "",
};

/* ─── Redemption card (mobile view of a row) ─────── */
function RedemptionCard({ o }) {
    return (
        <div style={{
            background: "#fafaf8", border: "1px solid #f0ece8", borderRadius: "12px",
            padding: "14px", display: "flex", flexDirection: "column", gap: "8px",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontWeight: "700", color: ORANGE, fontSize: "13px" }}>
                    #{o._id?.slice(-8).toUpperCase() || "—"}
                </span>
                <span style={{ fontSize: "11px", color: GRAY, whiteSpace: "nowrap" }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>{o.couponCode}</span>
                <span style={{ color: GREEN, fontWeight: "600", fontSize: "13px" }}>
                    −{rupee(o.discountAmount)}
                </span>
            </div>
            <div style={{ fontSize: "12px", color: GRAY }}>
                Order total: <span style={{ color: "#1a1a1a", fontWeight: "600" }}>{rupee(o.totalAmount)}</span>
            </div>
        </div>
    );
}

/* ─── MAIN PAGE ───────────────────────────────── */
export default function AdminCoupon() {
    const [coupons, setCoupons] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddCoupon, setShowAddCoupon] = useState(false);
    const [editingId, setEditingId] = useState(null); // null = adding, otherwise coupon._id being edited
    const [newCoupon, setNewCoupon] = useState(EMPTY_COUPON);
    const [savingCoupon, setSavingCoupon] = useState(false);
    const [couponError, setCouponError] = useState("");
    const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 760 : false);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 760);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const load = () => {
        Promise.all([
  fetch(`${API}/api/coupons`, authOpts()).then(r => r.ok ? r.json() : []),
  fetch(`${API}/api/orders`, authOpts()).then(r => r.ok ? r.json() : { orders: [] }),
]).then(([cp, ordRes]) => {
            setCoupons(Array.isArray(cp) ? cp : []);
            setOrders(Array.isArray(ordRes.orders) ? ordRes.orders : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    /* ─── derived stats ─────────────────────────── */
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => couponStatus(c) === "Active").length;
    const expiredCoupons = coupons.filter(c => couponStatus(c) === "Expired").length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

    /* orders that had a coupon applied, most recent first */
    const redemptions = orders
        .filter(o => o.couponCode)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    /* ─── form open/close helpers ─────────────────── */
    const startAdd = () => {
        setEditingId(null);
        setNewCoupon(EMPTY_COUPON);
        setCouponError("");
        setShowAddCoupon(true);
    };

    const startEdit = (c) => {
        setEditingId(c._id);
        setNewCoupon({
            code: c.code || "",
            discountType: c.discountType || "Percentage",
            discountValue: c.discountValue ?? "",
            minOrderAmount: c.minOrderAmount ?? "",
            maxDiscount: c.maxDiscount ?? "",
            usageLimit: c.usageLimit ?? "",
            expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0, 10) : "",
        });
        setCouponError("");
        setShowAddCoupon(true);
    };

    const cancelForm = () => {
        setShowAddCoupon(false);
        setEditingId(null);
        setNewCoupon(EMPTY_COUPON);
        setCouponError("");
    };

    /* ─── actions ────────────────────────────────── */
    const toggleCouponStatus = async (coupon) => {
        const r = await fetch(`${API}/api/coupons/${coupon._id}`, authOpts({
  method: "PATCH",
  body: JSON.stringify({ isActive: !coupon.isActive }),
}));
        if (r.ok) load();
    };

    const saveCoupon = async (e) => {
        e.preventDefault();
        setCouponError("");
        if (!newCoupon.code || !newCoupon.discountValue || !newCoupon.expiryDate) {
            setCouponError("Code, discount value, and expiry date are all required.");
            return;
        }
        setSavingCoupon(true);
        try {
            const payload = {
                ...newCoupon,
                code: newCoupon.code.toUpperCase(),
                discountValue: Number(newCoupon.discountValue),
                minOrderAmount: Number(newCoupon.minOrderAmount) || 0,
                maxDiscount: Number(newCoupon.maxDiscount) || 0,
                usageLimit: Number(newCoupon.usageLimit) || 0,
            };

            const url = editingId ? `${API}/api/coupons/${editingId}` : `${API}/api/coupons`;
            const method = editingId ? "PATCH" : "POST";

            const r = await fetch(url, authOpts({
  method,
  body: JSON.stringify(payload),
}));
            const data = await r.json().catch(() => ({}));
            if (r.ok) {
                cancelForm();
                load();
            } else {
                setCouponError(data.message || (editingId ? "Could not update coupon." : "Could not add coupon. Code may already be in use."));
            }
        } finally {
            setSavingCoupon(false);
        }
    };

    const removeCoupon = async (id) => {
        if (!window.confirm("Remove this coupon?")) return;
        const r = await fetch(`${API}/api/coupons/${id}`, authOpts({ method: "DELETE" }));
        if (r.ok) load();
    };

    if (loading) return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE,
                    animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
                }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ color: GRAY, fontSize: "14px" }}>Loading coupons…</p>
            </div>
        </div>
    );

    return (
        <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .ac-input { font-size: 16px !important; }
                @media (max-width: 760px) {
                    .ac-page-pad { padding: 16px !important; }
                    .ac-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
                    .ac-main-grid { grid-template-columns: 1fr !important; }
                    .ac-h1 { font-size: 20px !important; }
                    .ac-coupon-row { flex-wrap: wrap !important; }
                    .ac-coupon-actions { margin-left: auto !important; }
                }
                @media (max-width: 420px) {
                    .ac-stat-grid { grid-template-columns: 1fr 1fr !important; }
                }
            `}</style>
            <div className="ac-page-pad" style={{ padding: "28px 32px", maxWidth: "1400px" }}>

                {/* ── Header ── */}
                <div style={{ marginBottom: "24px" }}>
                    <h1 className="ac-h1" style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>Coupon Management</h1>
                    <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>
                        {expiredCoupons > 0
                            ? <>You have <span style={{ color: RED, fontWeight: "700" }}>{expiredCoupons} expired coupon{expiredCoupons !== 1 ? "s" : ""}</span> you may want to clean up.</>
                            : "All coupons are live and within their validity window."}
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="ac-stat-grid" style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: "14px", marginBottom: "24px",
                }}>
                    <StatCard icon="ti-tags" label="Total Coupons" value={totalCoupons} />
                    <StatCard icon="ti-circle-check" label="Active" value={activeCoupons} color={GREEN} />
                    <StatCard icon="ti-calendar-x" label="Expired" value={expiredCoupons} color={RED} />
                    <StatCard icon="ti-discount-2" label="Total Redemptions" value={totalRedemptions} />
                </div>

                <div className="ac-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "18px" }}>

                    {/* ── Coupons panel ── */}
                    <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "18px" }}>
                        <SectionHeader title="Coupons" right={
                            <button
                                onClick={() => (showAddCoupon ? cancelForm() : startAdd())}
                                style={{
                                    background: "none", border: "none", color: ORANGE, fontSize: "13px",
                                    fontWeight: "600", cursor: "pointer", padding: "6px 0", flexShrink: 0,
                                }}>
                                {showAddCoupon ? "Cancel" : "+ Add Coupon"}
                            </button>
                        } />

                        {showAddCoupon && (
                            <form onSubmit={saveCoupon} style={{
                                background: "#fafaf8", border: "1px solid #f0ece8", borderRadius: "10px",
                                padding: "14px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px",
                            }}>
                                {editingId && (
                                    <p style={{ fontSize: "11px", color: ORANGE, fontWeight: "600", margin: "0 0 2px" }}>
                                        Editing {newCoupon.code || "coupon"}
                                    </p>
                                )}

                                <input className="ac-input" placeholder="Coupon code (e.g. WELCOME50)" value={newCoupon.code}
                                    onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                    style={{ padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none", textTransform: "uppercase", width: "100%", boxSizing: "border-box" }} />

                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <select className="ac-input" value={newCoupon.discountType}
                                        onChange={e => setNewCoupon(p => ({ ...p, discountType: e.target.value }))}
                                        style={{ flex: "1 1 120px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }}>
                                        {["Percentage", "Flat"].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                    <input className="ac-input" type="number" placeholder={newCoupon.discountType === "Percentage" ? "Discount %" : "Discount ₹"}
                                        value={newCoupon.discountValue}
                                        onChange={e => setNewCoupon(p => ({ ...p, discountValue: e.target.value }))}
                                        style={{ flex: "1 1 120px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }} />
                                </div>

                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <input className="ac-input" type="number" placeholder="Min order amount"
                                        value={newCoupon.minOrderAmount}
                                        onChange={e => setNewCoupon(p => ({ ...p, minOrderAmount: e.target.value }))}
                                        style={{ flex: "1 1 120px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }} />
                                    {newCoupon.discountType === "Percentage" && (
                                        <input className="ac-input" type="number" placeholder="Max discount cap"
                                            value={newCoupon.maxDiscount}
                                            onChange={e => setNewCoupon(p => ({ ...p, maxDiscount: e.target.value }))}
                                            style={{ flex: "1 1 120px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }} />
                                    )}
                                </div>

                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <input className="ac-input" type="number" placeholder="Usage limit (total uses)"
                                        value={newCoupon.usageLimit}
                                        onChange={e => setNewCoupon(p => ({ ...p, usageLimit: e.target.value }))}
                                        style={{ flex: "1 1 120px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }} />
                                    <input className="ac-input" type="date" value={newCoupon.expiryDate}
                                        onChange={e => setNewCoupon(p => ({ ...p, expiryDate: e.target.value }))}
                                        style={{ flex: "1 1 120px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }} />
                                </div>

                                {couponError && (
                                    <p style={{ fontSize: "12px", color: "#A32D2D", background: "#FCEBEB", padding: "8px 10px", borderRadius: "8px", margin: 0 }}>
                                        {couponError}
                                    </p>
                                )}

                                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                    <button type="submit" disabled={savingCoupon} style={{
                                        flex: 1, padding: "12px", background: ORANGE, color: "#fff", border: "none",
                                        borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                                    }}>
                                        {savingCoupon ? "Saving…" : editingId ? "Update Coupon" : "Save Coupon"}
                                    </button>
                                    {editingId && (
                                        <button type="button" onClick={cancelForm} style={{
                                            padding: "12px 16px", background: "#fff", color: GRAY, border: "1px solid #e5e5e3",
                                            borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                                        }}>
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {coupons.map((c) => (
                                <div key={c._id} className="ac-coupon-row" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{
                                        width: "38px", height: "38px", borderRadius: "10px", background: ORANGE_L,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "14px", fontWeight: "700", color: ORANGE, flexShrink: 0,
                                    }}>
                                        <i className="ti ti-ticket" style={{ fontSize: "16px" }} aria-hidden />
                                    </div>
                                    <div style={{ flex: "1 1 140px", minWidth: 0, cursor: "pointer" }} onClick={() => startEdit(c)}>
                                        <p style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a", margin: 0, letterSpacing: "0.3px" }}>
                                            {c.code}
                                        </p>
                                        <p style={{ fontSize: "11px", color: GRAY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {c.discountType === "Percentage" ? `${c.discountValue}% off` : `${rupee(c.discountValue)} off`}
                                            {c.minOrderAmount ? ` · min ${rupee(c.minOrderAmount)}` : ""}
                                        </p>
                                        <p style={{ fontSize: "11px", color: GRAY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""} used · expires {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN") : "—"}
                                        </p>
                                    </div>
                                    <div className="ac-coupon-actions" style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                        <button onClick={() => toggleCouponStatus(c)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
                                            <Badge status={couponStatus(c)} map={COUPON_STATUS_COLORS} />
                                        </button>
                                        <button onClick={() => startEdit(c)} style={{
                                            border: "none", background: "none", cursor: "pointer", padding: "8px",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <i className="ti ti-edit" style={{ fontSize: "14px", color: GRAY }} aria-hidden />
                                        </button>
                                        <button onClick={() => removeCoupon(c._id)} style={{
                                            border: "none", background: "none", cursor: "pointer", padding: "8px",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <i className="ti ti-trash" style={{ fontSize: "14px", color: GRAY }} aria-hidden />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {coupons.length === 0 && (
                                <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", marginTop: "20px" }}>No coupons added yet</p>
                            )}
                        </div>
                    </div>

                    {/* ── Redemptions ── */}
                    <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "18px" }}>
                        <SectionHeader title="Recent Redemptions" />

                        {isMobile ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {redemptions.map((o) => (
                                    <RedemptionCard key={o._id} o={o} />
                                ))}
                                {redemptions.length === 0 && (
                                    <p style={{ textAlign: "center", padding: "30px", color: GRAY, fontSize: "13px" }}>No coupons redeemed yet</p>
                                )}
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                                            {["Order", "Coupon", "Discount", "Order Total", "Date"].map(h => (
                                                <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {redemptions.map((o) => (
                                            <tr key={o._id} style={{ borderBottom: "1px solid #fafaf8" }}>
                                                <td style={{ padding: "10px", fontWeight: "600", color: ORANGE }}>
                                                    #{o._id?.slice(-8).toUpperCase() || "—"}
                                                </td>
                                                <td style={{ padding: "10px", fontWeight: "600" }}>
                                                    {o.couponCode}
                                                </td>
                                                <td style={{ padding: "10px", color: GREEN, fontWeight: "600" }}>
                                                    −{rupee(o.discountAmount)}
                                                </td>
                                                <td style={{ padding: "10px", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                    {rupee(o.totalAmount)}
                                                </td>
                                                <td style={{ padding: "10px", color: GRAY, whiteSpace: "nowrap" }}>
                                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                        {redemptions.length === 0 && (
                                            <tr><td colSpan={5} style={{ textAlign: "center", padding: "30px", color: GRAY }}>No coupons redeemed yet</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}