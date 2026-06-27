// src/Pages/Payment.jsx
import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORANGE   = "#E07B39";
const ORANGE_L = "#fdf3ed";
const GRAY     = "#888";
const RED      = "#E24B4A";
const GREEN    = "#63992E";
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
});const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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

const PAYMENT_STATUS_COLORS = {
  Paid:      { bg: "#e8fdf0", text: "#0F6E56" },
  Pending:   { bg: "#FFF8E1", text: "#BA7517" },
  Failed:    { bg: "#FCEBEB", text: "#A32D2D" },
  Refunded:  { bg: "#e8f4fd", text: "#185FA5" },
  Cancelled: { bg: "#f5f5f5", text: "#555" },
};

function Badge({ status, map = PAYMENT_STATUS_COLORS }) {
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

function StatCard({ icon, label, value, sub }) {
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
          <i className={`ti ${icon}`} style={{ fontSize: "18px", color: ORANGE }} aria-hidden />
        </span>
        <span style={{ fontSize: "12px", color: GRAY }}>{label}</span>
      </div>
      <span style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a" }}>{value}</span>
      {sub && <span style={{ fontSize: "11px", color: GRAY }}>{sub}</span>}
    </div>
  );
}

async function exportCSV(filters) {
  // Fetch ALL records (no limit) for export
  try {
    const params = new URLSearchParams({
      limit: 10000,
      page: 1,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    });
    const r = await fetch(`${API}/api/payments?${params}`, authOpts());
    const data = r.ok ? await r.json() : { payments: [] };
    const payments = data.payments || [];

    const headers = ["Order ID","Customer","Phone","Transaction ID","Amount","Tax","Discount","Method","Gateway","Payment Status","Order Status","Date"];
    const rows = payments.map(p => [
      p.order?._id || p._id, p.customerName, p.customerPhone, p.transactionId,
      p.amount, p.taxAmount, p.discountAmount, p.paymentMethod, p.gatewayName,
      p.paymentStatus, p.orderStatus, new Date(p.createdAt).toLocaleString("en-IN"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `payments-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export failed", e);
  }
}

/* ─── Payment card (mobile view of a row) ─────── */
function PaymentCard({ p, onView, onRefund, refunding }) {
  return (
    <div
      style={{
        background: "#fafaf8", border: "1px solid #f0ece8", borderRadius: "12px",
        padding: "14px", display: "flex", flexDirection: "column", gap: "8px",
      }}
      onClick={() => onView(p)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ fontFamily: "monospace", fontSize: "12px", color: GRAY }}>
          #{(p.order?._id || p._id)?.slice(-8).toUpperCase()}
        </span>
        <Badge status={p.paymentStatus} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ fontWeight: "700", color: "#1a1a1a", fontSize: "14px" }}>{p.customerName}</span>
        <span style={{ fontWeight: "700", color: "#1a1a1a", fontSize: "15px", whiteSpace: "nowrap" }}>{rupee(p.amount)}</span>
      </div>

      <div style={{ fontSize: "11px", color: GRAY, display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span>{p.paymentMethod}</span>
        <span>·</span>
        <span>{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>

      <div style={{ display: "flex", gap: "16px", marginTop: "2px" }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onView(p)} style={{
          background: "none", border: "none", color: ORANGE, cursor: "pointer", fontSize: "12px",
          fontWeight: "600", padding: "6px 0", display: "flex", alignItems: "center", gap: "4px",
        }}>
          <i className="ti ti-eye" aria-hidden />View
        </button>
        <button onClick={() => window.print()} style={{
          background: "none", border: "none", color: GRAY, cursor: "pointer", fontSize: "12px",
          fontWeight: "600", padding: "6px 0", display: "flex", alignItems: "center", gap: "4px",
        }}>
          <i className="ti ti-printer" aria-hidden />Print
        </button>
        {p.paymentStatus === "Paid" && (
          <button onClick={() => onRefund(p)} disabled={refunding} style={{
            background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "12px",
            fontWeight: "600", padding: "6px 0", display: "flex", alignItems: "center", gap: "4px",
          }}>
            <i className={`ti ${refunding ? "ti-loader-2" : "ti-rotate"}`} aria-hidden />Refund
          </button>
        )}
      </div>
    </div>
  );
}

export default function Payment() {
  const [summary, setSummary]   = useState(null);
  const [payments, setPayments] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [viewing, setViewing]   = useState(null);
  const [refundingId, setRefundingId] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 760 : false
  );
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: "", status: "", method: "", from: "", to: "", minAmount: "", maxAmount: "",
  });

  // Show 25 per page so 74 orders fit in 3 pages instead of 5
  const limit = 25;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/payments/summary`, authOpts())
      .then(r => r.ok ? r.json() : null)
      .then(setSummary)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    });
    fetch(`${API}/api/payments?${params}`, authOpts())
      .then(r => r.ok ? r.json() : { payments: [], total: 0 })
      .then(data => {
        setPayments(data.payments || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filters]);

  const updateFilter = (key, val) => {
    setPage(1);
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleExport = async () => {
    setExporting(true);
    await exportCSV(filters);
    setExporting(false);
  };

  const handleRefund = async (p) => {
    const reason = window.prompt(`Refund ₹${p.amount} to ${p.customerName}?\nEnter a reason:`);
    if (reason === null) return;
    setRefundingId(p._id);
    try {
      const r = await fetch(`${API}/api/payments/${p._id}/refund`, authOpts({
  method: "PATCH",
  body: JSON.stringify({ reason }),
}));
      if (r.ok) {
        const { payment } = await r.json();
        setPayments(prev => prev.map(x => x._id === payment._id ? payment : x));
      }
    } finally { setRefundingId(null); }
  };

  const cards = summary ? [
    { icon: "ti-currency-rupee", label: "Total Revenue",     value: rupee(summary.totalRevenue) },
    { icon: "ti-calendar",       label: "Today's Revenue",   value: rupee(summary.todayRevenue) },
    { icon: "ti-calendar-week",  label: "Weekly Revenue",    value: rupee(summary.weeklyRevenue) },
    { icon: "ti-calendar-month", label: "Monthly Revenue",   value: rupee(summary.monthlyRevenue) },
    { icon: "ti-calendar-stats", label: "Yearly Revenue",    value: rupee(summary.yearlyRevenue) },
    { icon: "ti-shopping-bag",   label: "Total Orders",      value: summary.totalOrders },
    { icon: "ti-receipt",        label: "Avg Order Value",   value: rupee(summary.avgOrderValue) },
    { icon: "ti-clock",          label: "Pending Payments",  value: summary.pendingPayments },
    { icon: "ti-alert-triangle", label: "Failed Payments",   value: summary.failedPayments },
    { icon: "ti-rotate",         label: "Refunded Amount",   value: rupee(summary.refundedAmount) },
    { icon: "ti-trending-up",    label: "Net Profit",        value: rupee(summary.netProfit) },
    { icon: "ti-discount-2",     label: "Total Discounts",   value: rupee(summary.totalDiscounts) },
  ] : [];

  /* ── range label for footer ── */
  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd   = Math.min(page * limit, total);

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-input { font-size: 16px !important; }
        @media (max-width: 760px) {
          .pay-page-pad { padding: 16px !important; }
          .pay-h1 { font-size: 20px !important; }
          .pay-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .pay-panel { padding: 14px !important; }
          .pay-filters-desktop { display: none !important; }
          .pay-filters-toggle { display: flex !important; }
          .pay-modal {
            width: 100% !important; max-width: 100% !important;
            border-radius: 16px 16px 0 0 !important;
            position: fixed !important; bottom: 0 !important; left: 0 !important;
            margin: 0 !important; max-height: 85vh !important;
          }
        }
        @media (max-width: 420px) {
          .pay-stat-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (min-width: 761px) {
          .pay-filters-toggle { display: none !important; }
        }
      `}</style>

      <div className="pay-page-pad" style={{ padding: "28px 32px", maxWidth: "1400px" }}>

        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1 className="pay-h1" style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>Payments</h1>
          <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>Revenue, transactions, and refunds at a glance.</p>
        </div>

        {/* Summary cards */}
        <div className="pay-stat-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "14px", marginBottom: "24px",
        }}>
          {cards.map((c, i) => <StatCard key={i} {...c} />)}
        </div>

        {/* Filters — desktop inline row */}
        <div className="pay-filters-desktop" style={{
          display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px",
        }}>
          <input
            placeholder="Search customer, phone, txn ID…" value={filters.search}
            onChange={e => updateFilter("search", e.target.value)}
            style={{ flex: 1, minWidth: "200px", padding: "9px 12px", fontSize: "13px", border: "1px solid #f0ece8", borderRadius: "10px", outline: "none", background: "#fff" }}
          />
          <select value={filters.status} onChange={e => updateFilter("status", e.target.value)}
            style={{ padding: "9px 12px", fontSize: "13px", border: "1px solid #f0ece8", borderRadius: "10px", background: "#fff" }}>
            <option value="">All Status</option>
            {["Paid","Pending","Failed","Refunded","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.method} onChange={e => updateFilter("method", e.target.value)}
            style={{ padding: "9px 12px", fontSize: "13px", border: "1px solid #f0ece8", borderRadius: "10px", background: "#fff" }}>
            <option value="">All Methods</option>
            {["UPI","Card","NetBanking","Wallet","COD"].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={e => updateFilter("from", e.target.value)}
            style={{ padding: "9px 12px", fontSize: "13px", border: "1px solid #f0ece8", borderRadius: "10px", background: "#fff" }} />
          <input type="date" value={filters.to} onChange={e => updateFilter("to", e.target.value)}
            style={{ padding: "9px 12px", fontSize: "13px", border: "1px solid #f0ece8", borderRadius: "10px", background: "#fff" }} />
          <button
            onClick={handleExport} disabled={exporting}
            style={{ padding: "9px 16px", fontSize: "13px", fontWeight: "600", borderRadius: "10px", border: "none", background: ORANGE, color: "#fff", cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.7 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
            <i className={`ti ${exporting ? "ti-loader-2" : "ti-download"}`} style={{ animation: exporting ? "spin 0.8s linear infinite" : "none" }} aria-hidden />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>

        {/* Filters — mobile */}
        <div className="pay-filters-toggle" style={{ display: "none", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          <input
            className="pay-input"
            placeholder="Search customer, phone, txn ID…" value={filters.search}
            onChange={e => updateFilter("search", e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", fontSize: "14px", border: "1px solid #f0ece8", borderRadius: "10px", outline: "none", background: "#fff" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowFilters(s => !s)} style={{
              flex: 1, padding: "11px 14px", fontSize: "13px", fontWeight: "600", borderRadius: "10px",
              border: "1px solid #f0ece8", background: "#fff", color: "#1a1a1a", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
              <i className="ti ti-filter" aria-hidden />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <button
              onClick={handleExport} disabled={exporting}
              style={{ padding: "11px 16px", fontSize: "13px", fontWeight: "600", borderRadius: "10px", border: "none", background: ORANGE, color: "#fff", cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.7 : 1 }}>
              <i className={`ti ${exporting ? "ti-loader-2" : "ti-download"}`} style={{ animation: exporting ? "spin 0.8s linear infinite" : "none" }} aria-hidden />
            </button>
          </div>

          {showFilters && (
            <div style={{
              background: "#fff", border: "1px solid #f0ece8", borderRadius: "12px",
              padding: "14px", display: "flex", flexDirection: "column", gap: "10px",
            }}>
              <select className="pay-input" value={filters.status} onChange={e => updateFilter("status", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", fontSize: "14px", border: "1px solid #f0ece8", borderRadius: "10px", background: "#fff" }}>
                <option value="">All Status</option>
                {["Paid","Pending","Failed","Refunded","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="pay-input" value={filters.method} onChange={e => updateFilter("method", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", fontSize: "14px", border: "1px solid #f0ece8", borderRadius: "10px", background: "#fff" }}>
                <option value="">All Methods</option>
                {["UPI","Card","NetBanking","Wallet","COD"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div style={{ display: "flex", gap: "8px" }}>
                <input className="pay-input" type="date" value={filters.from} onChange={e => updateFilter("from", e.target.value)}
                  style={{ flex: 1, padding: "11px 12px", fontSize: "14px", border: "1px solid #f0ece8", borderRadius: "10px", background: "#fff" }} />
                <input className="pay-input" type="date" value={filters.to} onChange={e => updateFilter("to", e.target.value)}
                  style={{ flex: 1, padding: "11px 12px", fontSize: "14px", border: "1px solid #f0ece8", borderRadius: "10px", background: "#fff" }} />
              </div>
            </div>
          )}
        </div>

        {/* List / Table */}
        <div className="pay-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>

          {/* Row count indicator */}
          {total > 0 && (
            <p style={{ fontSize: "12px", color: GRAY, margin: "0 0 14px" }}>
              Showing <strong style={{ color: "#1a1a1a" }}>{pageStart}–{pageEnd}</strong> of{" "}
              <strong style={{ color: "#1a1a1a" }}>{total}</strong> transactions
            </p>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE,
                animation: "spin 0.8s linear infinite",
              }} />
            </div>
          ) : isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {payments.map(p => (
                <PaymentCard
                  key={p._id} p={p} onView={setViewing} onRefund={handleRefund}
                  refunding={refundingId === p._id}
                />
              ))}
              {payments.length === 0 && (
                <p style={{ padding: "40px", textAlign: "center", color: GRAY, fontSize: "13px" }}>No transactions found</p>
              )}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                    {["Order ID","Customer","Phone","Txn ID","Amount","Tax","Discount","Method","Gateway","Payment Status","Order Status","Date","Actions"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "10px 8px", color: GRAY,
                        fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase",
                        letterSpacing: "0.4px", whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id} style={{ borderBottom: "1px solid #fafaf8" }}>
                      <td style={{ padding: "10px 8px", fontFamily: "monospace", color: GRAY }}>
                        {(p.order?._id || p._id)?.slice(-8).toUpperCase()}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: "600", color: "#1a1a1a", whiteSpace: "nowrap" }}>{p.customerName}</td>
                      <td style={{ padding: "10px 8px", color: "#555", whiteSpace: "nowrap" }}>{p.customerPhone || "—"}</td>
                      <td style={{ padding: "10px 8px", fontFamily: "monospace", color: GRAY, whiteSpace: "nowrap" }}>{p.transactionId || "—"}</td>
                      <td style={{ padding: "10px 8px", fontWeight: "700", color: "#1a1a1a", whiteSpace: "nowrap" }}>{rupee(p.amount)}</td>
                      <td style={{ padding: "10px 8px", color: "#555", whiteSpace: "nowrap" }}>{rupee(p.taxAmount)}</td>
                      <td style={{ padding: "10px 8px", color: "#555", whiteSpace: "nowrap" }}>{rupee(p.discountAmount)}</td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{p.paymentMethod}</td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{p.gatewayName}</td>
                      <td style={{ padding: "10px 8px" }}><Badge status={p.paymentStatus} /></td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{p.orderStatus || "—"}</td>
                      <td style={{ padding: "10px 8px", color: GRAY, whiteSpace: "nowrap" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => setViewing(p)} title="View Details"
                            style={{ background: "none", border: "none", color: ORANGE, cursor: "pointer" }}>
                            <i className="ti ti-eye" aria-hidden />
                          </button>
                          <button onClick={() => window.print()} title="Print Receipt"
                            style={{ background: "none", border: "none", color: GRAY, cursor: "pointer" }}>
                            <i className="ti ti-printer" aria-hidden />
                          </button>
                          {p.paymentStatus === "Paid" && (
                            <button onClick={() => handleRefund(p)} disabled={refundingId === p._id} title="Refund"
                              style={{ background: "none", border: "none", color: RED, cursor: "pointer" }}>
                              <i className={`ti ${refundingId === p._id ? "ti-loader-2" : "ti-rotate"}`} aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={13} style={{ padding: "40px", textAlign: "center", color: GRAY }}>No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              gap: "8px", marginTop: "18px", flexWrap: "wrap",
            }}>
              <button
                onClick={() => setPage(1)} disabled={page === 1}
                style={{ padding: "7px 12px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                «
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "7px 14px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                Prev
              </button>

              {/* Page number pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "…"
                    ? <span key={`ellipsis-${i}`} style={{ fontSize: "12px", color: GRAY, padding: "0 4px" }}>…</span>
                    : (
                      <button
                        key={n} onClick={() => setPage(n)}
                        style={{
                          padding: "7px 12px", fontSize: "12px", borderRadius: "8px",
                          border: "1px solid", borderColor: n === page ? ORANGE : "#f0ece8",
                          background: n === page ? ORANGE_L : "#fff",
                          color: n === page ? ORANGE : "#1a1a1a",
                          fontWeight: n === page ? "700" : "400",
                          cursor: n === page ? "default" : "pointer",
                        }}>
                        {n}
                      </button>
                    )
                )
              }

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "7px 14px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
                Next
              </button>
              <button
                onClick={() => setPage(totalPages)} disabled={page === totalPages}
                style={{ padding: "7px 12px", fontSize: "12px", borderRadius: "8px", border: "1px solid #f0ece8", background: "#fff", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
                »
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View details modal */}
      {viewing && (
        <div onClick={() => setViewing(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999,
          display: "flex", alignItems: isMobile ? "flex-end" : "center",
          justifyContent: "center", padding: isMobile ? 0 : "16px",
        }}>
          <div className="pay-modal" onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "16px", padding: "24px",
            width: "420px", maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Payment Details</h3>
              <button onClick={() => setViewing(null)} style={{ background: "none", border: "none", color: GRAY, cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>
                <i className="ti ti-x" aria-hidden />
              </button>
            </div>
            {[
              ["Customer",       viewing.customerName],
              ["Phone",          viewing.customerPhone],
              ["Email",          viewing.customerEmail],
              ["Transaction ID", viewing.transactionId],
              ["Amount",         rupee(viewing.amount)],
              ["Tax",            rupee(viewing.taxAmount)],
              ["Discount",       rupee(viewing.discountAmount)],
              ["Coupon Applied", viewing.discountApplied || "—"],
              ["Method",         viewing.paymentMethod],
              ["Gateway",        viewing.gatewayName],
              ["Payment Status", viewing.paymentStatus],
              ["Order Status",   viewing.orderStatus],
              ["Refund Reason",  viewing.refundReason || "—"],
              ["Date",           new Date(viewing.createdAt).toLocaleString("en-IN")],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", gap: "12px",
                padding: "8px 0", borderBottom: "1px solid #f5f5f3", fontSize: "13px",
              }}>
                <span style={{ color: GRAY, flexShrink: 0 }}>{label}</span>
                <span style={{ fontWeight: "600", color: "#1a1a1a", textAlign: "right", wordBreak: "break-word" }}>{val}</span>
              </div>
            ))}
            <button onClick={() => setViewing(null)} style={{
              marginTop: "18px", width: "100%", padding: "12px", borderRadius: "10px",
              border: "none", background: ORANGE, color: "#fff", fontWeight: "600", cursor: "pointer",
            }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}