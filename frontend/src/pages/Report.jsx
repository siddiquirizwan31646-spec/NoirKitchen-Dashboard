import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─── colour tokens ─────────────────────────── */
const ORANGE   = "#E07B39";
const ORANGE_L = "#fdf3ed";
const RED      = "#E24B4A";
const GREEN    = "#63992E";
const GRAY     = "#888";
const PIE_COLORS = [ORANGE, "#f5b88a", "#fde2c8", GREEN, RED, "#185FA5"];

/* ─── helpers ───────────────────────────────── */
const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const pct   = (v) => `${v >= 0 ? "↑" : "↓"} ${Math.abs(v)}%`;

/* ─── ChartBox — same pattern as Dashboard ─── */
function ChartBox({ height = 220, children }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const cw = entry.contentRect.width;
      if (cw > 0) setW(Math.floor(cw));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: "100%", height, overflow: "hidden" }}>
      {w > 0 && children(w, height)}
    </div>
  );
}

function growthPct(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

/* ─── date helpers ──────────────────────────── */
function rangeStart(range, offset = 0) {
  const now = new Date();
  if (range === "Today") {
    const d = new Date(now); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset); return d;
  }
  if (range === "This Week") {
    const d = new Date(now - 6 * 86400000); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset * 7); return d;
  }
  if (range === "This Month")
    return new Date(now.getFullYear(), now.getMonth() - offset, 1);
  return new Date(now.getFullYear() - offset, 0, 1);
}

function filterByRange(items, range, key = "createdAt") {
  const start = rangeStart(range, 0);
  return items.filter(i => new Date(i[key]) >= start);
}

function buildRevenueChart(orders, range) {
  if (range === "Today") {
    return Array.from({ length: 24 }, (_, h) => {
      const amt = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.toDateString() === new Date().toDateString() && d.getHours() === h;
      }).reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
      return { label, revenue: amt };
    });
  }
  if (range === "This Year") {
    return Array.from({ length: 12 }, (_, i) => {
      const ref = new Date(); ref.setDate(1); ref.setMonth(ref.getMonth() - (11 - i));
      const amt = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
      }).reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      return { label: ref.toLocaleDateString("en-IN", { month: "short" }), revenue: amt };
    });
  }
  if (range === "This Month") {
    return Array.from({ length: 5 }, (_, i) => {
      const end = new Date(); end.setDate(end.getDate() - (4 - i) * 7);
      const start = new Date(end - 6 * 86400000);
      const amt = orders.filter(o => { const d = new Date(o.createdAt); return d >= start && d <= end; })
        .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      return { label: `Wk ${i + 1}`, revenue: amt };
    });
  }
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const amt = orders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString())
      .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), revenue: amt };
  });
}

function buildOrderChart(orders, range) {
  if (range === "Today") {
    return Array.from({ length: 24 }, (_, h) => {
      const count = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.toDateString() === new Date().toDateString() && d.getHours() === h;
      }).length;
      const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
      return { label, orders: count };
    });
  }
  if (range === "This Year") {
    return Array.from({ length: 12 }, (_, i) => {
      const ref = new Date(); ref.setDate(1); ref.setMonth(ref.getMonth() - (11 - i));
      const count = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
      }).length;
      return { label: ref.toLocaleDateString("en-IN", { month: "short" }), orders: count };
    });
  }
  if (range === "This Month") {
    return Array.from({ length: 5 }, (_, i) => {
      const end = new Date(); end.setDate(end.getDate() - (4 - i) * 7);
      const start = new Date(end - 6 * 86400000);
      const count = orders.filter(o => { const d = new Date(o.createdAt); return d >= start && d <= end; }).length;
      return { label: `Wk ${i + 1}`, orders: count };
    });
  }
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const count = orders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString()).length;
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), orders: count };
  });
}

/* ─── Date heatmap ──────────────────────────── */
const HOUR_LABELS = [
  "12 AM","1 AM","2 AM","3 AM","4 AM","5 AM","6 AM","7 AM","8 AM","9 AM","10 AM","11 AM",
  "12 PM","1 PM","2 PM","3 PM","4 PM","5 PM","6 PM","7 PM","8 PM","9 PM","10 PM","11 PM",
];

function buildDateHeatmap(orders, days = 30) {
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d;
  });
  const grid = dates.map(() => Array(24).fill(0));
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const idx = dates.findIndex(dt => dt.toDateString() === d.toDateString());
    if (idx === -1) return;
    grid[idx][d.getHours()]++;
  });
  return { dates, grid };
}

function DateHeatmap({ orders, isMobile }) {
  const days = isMobile ? 14 : 30;
  const { dates, grid } = buildDateHeatmap(orders, days);
  const maxVal = Math.max(1, ...grid.flat());

  const cellW  = isMobile ? 30 : 38;
  const cellH  = isMobile ? 22 : 26;
  const labelW = isMobile ? 40 : 52;
  const headerH = isMobile ? 38 : 44;

  function getColor(val) {
    if (val === 0) return "#fdf3ed";
    const t = val / maxVal;
    const r = Math.round(253 + (224 - 253) * t);
    const g = Math.round(243 + (123 - 243) * t);
    const b = Math.round(237 + (57  - 237) * t);
    return `rgb(${r},${g},${b})`;
  }

  const scrollRef = (el) => { if (el) el.scrollLeft = el.scrollWidth; };

  return (
    <div>
      <div ref={scrollRef} style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: "8px" }}>
        <div style={{ display: "flex", minWidth: "fit-content" }}>
          <div style={{ flexShrink: 0, width: labelW }}>
            <div style={{ height: headerH }} />
            {HOUR_LABELS.map((label, h) => (
              <div key={h} style={{
                height: cellH, display: "flex", alignItems: "center",
                fontSize: isMobile ? "9px" : "10px", color: GRAY, paddingRight: "6px",
                justifyContent: "flex-end", whiteSpace: "nowrap",
              }}>{label}</div>
            ))}
          </div>
          <div style={{ display: "flex", overflowX: "visible" }}>
            {dates.map((date, di) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dayLabel = date.toLocaleDateString("en-IN", { weekday: "short" });
              const dateLabel = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
              return (
                <div key={di} style={{ flexShrink: 0, width: cellW }}>
                  <div style={{
                    height: headerH, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: "1px",
                    borderBottom: `2px solid ${isToday ? ORANGE : "transparent"}`,
                  }}>
                    <span style={{ fontSize: "9px", color: isToday ? ORANGE : GRAY, fontWeight: isToday ? "700" : "400" }}>{dayLabel}</span>
                    <span style={{ fontSize: "10px", fontWeight: isToday ? "700" : "500", color: isToday ? ORANGE : "#555" }}>{dateLabel}</span>
                  </div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const val = grid[di][h];
                    return (
                      <div key={h} title={`${dayLabel} ${dateLabel} · ${HOUR_LABELS[h]} — ${val} order${val !== 1 ? "s" : ""}`} style={{
                        width: cellW - 3, height: cellH - 3, margin: "1.5px",
                        borderRadius: "4px", background: getColor(val),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: val > 0 ? "700" : "400",
                        color: val / maxVal > 0.55 ? "#fff" : val > 0 ? ORANGE : "transparent",
                      }}>
                        {val > 0 ? val : ""}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", marginLeft: isMobile ? 0 : labelW, flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: GRAY }}>Low</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t, i) => (
          <div key={i} style={{ width: "28px", height: "12px", borderRadius: "3px", background: getColor(Math.round(t * maxVal)) }} />
        ))}
        <span style={{ fontSize: "11px", color: GRAY }}>High</span>
        <span style={{ fontSize: "11px", color: GRAY, marginLeft: isMobile ? 0 : "12px" }}>← scroll for older dates</span>
      </div>
    </div>
  );
}

/* ─── UI helpers ────────────────────────────── */
function DateRangeDropdown({ value, onChange, options }) {
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: "none", WebkitAppearance: "none",
        background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px",
        padding: "7px 28px 7px 14px", fontSize: "12px", fontWeight: "600",
        color: "#1a1a1a", cursor: "pointer", outline: "none",
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <i className="ti ti-chevron-down" style={{
        position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
        fontSize: "13px", color: GRAY, pointerEvents: "none",
      }} aria-hidden />
    </div>
  );
}

function SectionHeader({ title, sub, icon, right }) {
  return (
    <div className="rp-section-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {icon && (
          <span style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: ORANGE_L, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <i className={`ti ${icon}`} style={{ fontSize: "18px", color: ORANGE }} aria-hidden />
          </span>
        )}
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>{title}</h2>
          {sub && <p style={{ fontSize: "11px", color: GRAY, margin: "2px 0 0" }}>{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, subColor = GREEN, borderColor }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${borderColor || "#f0ece8"}`,
      borderRadius: "14px", padding: "16px 20px",
      display: "flex", flexDirection: "column", gap: "6px", minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          width: "36px", height: "36px", borderRadius: "10px",
          background: ORANGE_L, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <i className={`ti ${icon}`} style={{ fontSize: "18px", color: ORANGE }} aria-hidden />
        </span>
        <span style={{ fontSize: "12px", color: GRAY }}>{label}</span>
      </div>
      <span style={{ fontSize: "26px", fontWeight: "700", color: "#1a1a1a" }}>{value}</span>
      {sub && <span style={{ fontSize: "12px", color: subColor }}>{sub}</span>}
    </div>
  );
}

const STATUS_COLORS = {
  Placed:             { bg: "#e8f4fd", text: "#185FA5" },
  Preparing:          { bg: "#FFF8E1", text: "#BA7517" },
  "Out for Delivery": { bg: "#EAF3DE", text: "#3B6D11" },
  Delivered:          { bg: "#e8fdf0", text: "#0F6E56" },
  Cancelled:          { bg: "#FCEBEB", text: "#A32D2D" },
};
function Badge({ status }) {
  const c = STATUS_COLORS[status] || { bg: "#f5f5f5", text: "#555" };
  return (
    <span style={{
      fontSize: "11px", fontWeight: "600", padding: "3px 10px",
      borderRadius: "20px", background: c.bg, color: c.text, whiteSpace: "nowrap",
    }}>{status}</span>
  );
}

/* ─── Custom Tooltip ────────────────────────── */
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px",
      padding: "8px 12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,.08)",
    }}>
      <p style={{ margin: "0 0 4px", color: GRAY }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, fontWeight: "700", color: ORANGE }}>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Pure CSS donut chart ──────────────────── */
function DonutChart({ data, colors }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return (
    <div style={{ width: "140px", height: "140px", borderRadius: "50%", border: "16px solid #f0ece8", boxSizing: "border-box" }} />
  );
  let acc = 0;
  const stops = data.map((d, i) => {
    const startPct = (acc / total) * 100;
    acc += d.value;
    const endPct = (acc / total) * 100;
    return `${colors[i % colors.length]} ${startPct}% ${endPct}%`;
  }).join(", ");
  return (
    <div style={{
      width: "140px", height: "140px", borderRadius: "50%",
      background: `conic-gradient(${stops})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#fff" }} />
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────── */
const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

export default function Reports() {
  const navigate = useNavigate();

  const [orders,     setOrders]     = useState([]);
  const [reviews,    setReviews]    = useState([]);
  const [customers,  setCustomers]  = useState([]);
  const [menuItems,  setMenuItems]  = useState([]);
  const [summary,    setSummary]    = useState({});
  const [coupons,    setCoupons]    = useState([]);
  const [agents,     setAgents]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [isMobile,   setIsMobile]   = useState(typeof window !== "undefined" ? window.innerWidth <= 760 : false);

  const [revenueRange, setRevenueRange] = useState("This Week");
  const [ordersRange,  setOrdersRange]  = useState("This Week");
  const [topRange,     setTopRange]     = useState("This Month");

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const opts = {
      credentials: "include",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    };
    Promise.all([
      fetch(`${API}/api/orders`,           opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/reviews`,          opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/users`,            opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/menu`,             opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/payments/summary`, opts).then(r => r.ok ? r.json() : {}),
      fetch(`${API}/api/coupons`,          opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/delivery-agents`,  opts).then(r => r.ok ? r.json() : []),
    ]).then(([ord, rev, cust, menu, sum, coup, agt]) => {
      setOrders(Array.isArray(ord) ? ord : ord.orders || []);
      setReviews(Array.isArray(rev) ? rev : rev.reviews || []);
      setCustomers(Array.isArray(cust) ? cust : cust.users || []);
      setMenuItems(Array.isArray(menu) ? menu : menu.items || []);
      setSummary(sum || {});
      setCoupons(Array.isArray(coup) ? coup : []);
      setAgents(Array.isArray(agt) ? agt : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  /* ─── derived ────────────────────────────── */
  const revenueData    = buildRevenueChart(orders, revenueRange);
  const orderChartData = buildOrderChart(orders, ordersRange);

  const topOrders = filterByRange(orders, topRange);
  const itemMap   = {};
  topOrders.forEach(o => {
    if (!itemMap[o.itemName]) itemMap[o.itemName] = { count: 0, revenue: 0 };
    itemMap[o.itemName].count   += o.quantity || 1;
    itemMap[o.itemName].revenue += Number(o.totalAmount) || 0;
  });
  const topDishes = Object.entries(itemMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8)
    .map(([name, d]) => ({ name, ...d }));

  const methodMap = {};
  orders.forEach(o => {
    const m = o.paymentMethod === "Cash" ? "COD" : (o.paymentMethod || "COD");
    methodMap[m] = (methodMap[m] || 0) + (Number(o.totalAmount) || 0);
  });
  const paymentPieData = Object.entries(methodMap).map(([name, value]) => ({ name, value }));

  const statusBreakdown = ORDER_STATUSES.map(status => {
    const s = orders.filter(o => o.orderStatus === status);
    return { status, count: s.length, revenue: s.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0) };
  });

  const customerGrowth = Array.from({ length: 6 }, (_, i) => {
    const ref = new Date(); ref.setDate(1); ref.setMonth(ref.getMonth() - (5 - i));
    const count = customers.filter(c => {
      const d = new Date(c.createdAt);
      return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
    }).length;
    return { label: ref.toLocaleDateString("en-IN", { month: "short" }), customers: count };
  });

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    rating: r, count: reviews.filter(rv => rv.rating === r).length,
  }));
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "—";

  const today  = new Date();
  const last7  = new Date(today - 7  * 86400000);
  const last14 = new Date(today - 14 * 86400000);
  const newCust   = customers.filter(c => new Date(c.createdAt) >= last7).length;
  const prevCust  = customers.filter(c => { const d = new Date(c.createdAt); return d >= last14 && d < last7; }).length;
  const custDelta = growthPct(newCust, prevCust);

  const activeCoupons = coupons.filter(c => c.isActive);
  const totalUses     = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);
  const discountSaved = orders.reduce((s, o) => s + (o.discountAmount || 0), 0);
  const avgConversion = coupons.length
    ? Math.round(coupons.reduce((s, c) => s + (c.usageLimit ? (c.usedCount || 0) / c.usageLimit : 0), 0) / coupons.length * 100)
    : 0;

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE,
          animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading reports…</p>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .rp-grid-2  { grid-template-columns: 1fr !important; }
          .rp-grid-3  { grid-template-columns: 1fr !important; }
          .rp-grid-3b { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          .rp-page-pad    { padding: 16px !important; }
          .rp-header      { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .rp-h1          { font-size: 20px !important; }
          .rp-kpi-grid    { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .rp-coupon-kpis { grid-template-columns: repeat(2, 1fr) !important; }
          .rp-menu-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .rp-panel       { padding: 14px !important; }
          .rp-section-header { flex-direction: column !important; align-items: flex-start !important; }
          .rp-section-header > div:last-child { width: 100%; }
          .rp-growth-stats { gap: 14px !important; flex-wrap: wrap !important; }
        }
        @media (max-width: 420px) {
          .rp-kpi-grid    { grid-template-columns: 1fr 1fr !important; }
          .rp-coupon-kpis { grid-template-columns: 1fr 1fr !important; }
          .rp-menu-grid   { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      <div className="rp-page-pad" style={{ padding: "28px 32px", maxWidth: "1400px" }}>

        {/* ── Header ── */}
        <div className="rp-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <button onClick={() => navigate("/admin")} style={{
              background: "none", border: "none", color: GRAY, fontSize: "12px",
              cursor: "pointer", padding: "6px 0", marginBottom: "6px",
            }}>
              <i className="ti ti-arrow-left" style={{ marginRight: "4px" }} aria-hidden />
              Back to Dashboard
            </button>
            <h1 className="rp-h1" style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>Reports</h1>
            <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>Full business analytics — revenue, orders, customers, coupons &amp; delivery</p>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px",
            padding: "8px 14px", fontSize: "13px", color: "#555", flexShrink: 0,
          }}>
            <i className="ti ti-calendar" style={{ color: ORANGE }} aria-hidden />
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="rp-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px", marginBottom: "24px" }}>
          <KpiCard icon="ti-currency-rupee"   label="Total Revenue"    value={rupee(summary?.totalRevenue)}   sub={`Today: ${rupee(summary?.todayRevenue)}`}        subColor={ORANGE} />
          <KpiCard icon="ti-trending-up"      label="Net Profit"       value={rupee(summary?.netProfit)}      sub="After discounts & refunds"                         subColor={GREEN} />
          <KpiCard icon="ti-receipt"          label="Avg Order Value"  value={rupee(summary?.avgOrderValue)}  sub={`${orders.length} total orders`}                   subColor={GRAY} />
          <KpiCard icon="ti-tag"              label="Total Discounts"  value={rupee(summary?.totalDiscounts)} sub="Coupons applied"                                    subColor={RED} />
          <KpiCard icon="ti-rotate-clockwise" label="Refunded"         value={rupee(summary?.refundedAmount)} sub={`${summary?.failedPayments || 0} failed`}          subColor={RED} borderColor="#fce8e8" />
          <KpiCard icon="ti-users"            label="New Customers"    value={newCust}                        sub={`${pct(custDelta)} from last week`}                 subColor={custDelta >= 0 ? GREEN : RED} />
          <KpiCard icon="ti-star"             label="Avg Rating"       value={avgRating}                      sub={`${reviews.length} reviews`}                        subColor={ORANGE} />
          <KpiCard icon="ti-clock"            label="Pending Payments" value={summary?.pendingPayments || 0}  sub="COD unpaid"                                         subColor={RED} />
        </div>

        {/* ── Revenue + Orders Charts ── */}
        <div className="rp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "24px" }}>
          <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <SectionHeader title="Revenue Trend" right={
              <DateRangeDropdown value={revenueRange} onChange={setRevenueRange} options={["Today", "This Week", "This Month", "This Year"]} />
            } />
            <div style={{ marginBottom: "8px" }}>
              <span style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a" }}>
                {rupee(revenueData.reduce((s, d) => s + d.revenue, 0))}
              </span>
              <span style={{ fontSize: "12px", color: GRAY, marginLeft: "8px" }}>{revenueRange}</span>
            </div>
            <ChartBox height={isMobile ? 180 : 200}>
              {(w, h) => (
                <LineChart width={w} height={h} data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                    width={isMobile ? 45 : 60} domain={[0, "auto"]} />
                  <Tooltip content={<ChartTooltip formatter={rupee} />} />
                  <Line type="monotone" dataKey="revenue" stroke={ORANGE} strokeWidth={2.5}
                    dot={{ r: 4, fill: ORANGE, stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: ORANGE }} isAnimationActive={false} />
                </LineChart>
              )}
            </ChartBox>
          </div>

          <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <SectionHeader title="Order Volume" right={
              <DateRangeDropdown value={ordersRange} onChange={setOrdersRange} options={["Today", "This Week", "This Month", "This Year"]} />
            } />
            <div style={{ marginBottom: "8px" }}>
              <span style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a" }}>
                {orderChartData.reduce((s, d) => s + d.orders, 0)}
              </span>
              <span style={{ fontSize: "12px", color: GRAY, marginLeft: "8px" }}>orders</span>
            </div>
            <ChartBox height={isMobile ? 160 : 180}>
              {(w, h) => (
                <BarChart width={w} height={h} data={orderChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false}
                    allowDecimals={false} width={isMobile ? 30 : 40} domain={[0, "auto"]} />
                  <Tooltip content={<ChartTooltip formatter={v => `${v} orders`} />} />
                  <Bar dataKey="orders" fill={ORANGE} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              )}
            </ChartBox>
          </div>
        </div>

        {/* ── Top Dishes + Payment Methods + Status Breakdown ── */}
        <div className="rp-grid-3" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1.4fr", gap: "18px", marginBottom: "24px" }}>

          <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <SectionHeader title="Top Dishes by Revenue" right={
              <DateRangeDropdown value={topRange} onChange={setTopRange} options={["Today", "This Week", "This Month", "This Year"]} />
            } />
            {topDishes.length === 0
              ? <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", marginTop: "40px" }}>No orders in range</p>
              : <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                        {["#", "Dish", "Orders", "Revenue"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topDishes.map((d, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #fafaf8" }}>
                          <td style={{ padding: "10px", color: GRAY, fontWeight: "600", width: "28px" }}>{i + 1}</td>
                          <td style={{ padding: "10px", color: "#1a1a1a", fontWeight: "500" }}>{d.name}</td>
                          <td style={{ padding: "10px", color: "#555" }}>{d.count}</td>
                          <td style={{ padding: "10px", fontWeight: "700", color: ORANGE }}>{rupee(d.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>

          <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <SectionHeader title="Payment Methods" />
            {paymentPieData.length === 0
              ? <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", marginTop: "40px" }}>No data</p>
              : <>
                  <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                    <DonutChart data={paymentPieData} colors={PIE_COLORS} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                    {paymentPieData.map((d, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                        <span style={{ flex: 1, color: "#555" }}>{d.name}</span>
                        <span style={{ fontWeight: "600", color: "#1a1a1a" }}>{rupee(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
            }
          </div>

          <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <SectionHeader title="Order Status Breakdown" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                    {["Status", "Count", "Revenue", "%"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 6px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statusBreakdown.map(({ status, count, revenue }) => {
                    const perc = orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={status} style={{ borderBottom: "1px solid #fafaf8" }}>
                        <td style={{ padding: "9px 6px" }}><Badge status={status} /></td>
                        <td style={{ padding: "9px 6px", fontWeight: "600" }}>{count}</td>
                        <td style={{ padding: "9px 6px", color: "#555" }}>{rupee(revenue)}</td>
                        <td style={{ padding: "9px 6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ flex: 1, height: "5px", background: "#f0ece8", borderRadius: "3px" }}>
                              <div style={{ width: `${perc}%`, height: "100%", background: ORANGE, borderRadius: "3px" }} />
                            </div>
                            <span style={{ fontSize: "10px", color: GRAY, minWidth: "28px" }}>{perc}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Customer Growth + Rating + Menu ── */}
        <div className="rp-grid-3b" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "18px", marginBottom: "24px" }}>
          <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <SectionHeader title="Customer Growth (6 months)" />
            <div style={{ marginBottom: "8px" }}>
              <span style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a" }}>{customers.length}</span>
              <span style={{ fontSize: "12px", color: GRAY, marginLeft: "8px" }}>total customers</span>
            </div>
            <ChartBox height={isMobile ? 160 : 180}>
              {(w, h) => (
                <BarChart width={w} height={h} data={customerGrowth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false}
                    allowDecimals={false} width={isMobile ? 30 : 40} domain={[0, "auto"]} />
                  <Tooltip content={<ChartTooltip formatter={v => `${v} customers`} />} />
                  <Bar dataKey="customers" fill={ORANGE_L} stroke={ORANGE} strokeWidth={1.5} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              )}
            </ChartBox>
            <div className="rp-growth-stats" style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
              {[
                { label: "Verified",    value: customers.filter(c => c.isVerified).length },
                { label: "This Week",   value: newCust },
                { label: "Google Auth", value: customers.filter(c => c.authMethod === "google").length },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{ fontSize: "11px", color: GRAY, margin: "0 0 2px" }}>{s.label}</p>
                  <p style={{ fontSize: "18px", fontWeight: "700", color: i === 1 ? ORANGE : "#1a1a1a", margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <SectionHeader title="Review Ratings" />
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "36px", fontWeight: "800", color: "#1a1a1a" }}>{avgRating}</span>
              <span style={{ fontSize: "14px", color: "#f59e0b" }}>★</span>
              <span style={{ fontSize: "12px", color: GRAY }}>{reviews.length} reviews</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {ratingDist.map(({ rating, count }) => {
                const perc = reviews.length > 0 ? ((count / reviews.length) * 100).toFixed(0) : 0;
                return (
                  <div key={rating} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#555", minWidth: "20px" }}>{rating}★</span>
                    <div style={{ flex: 1, height: "8px", background: "#f0ece8", borderRadius: "4px" }}>
                      <div style={{ width: `${perc}%`, height: "100%", borderRadius: "4px",
                        background: rating >= 4 ? GREEN : rating === 3 ? "#f59e0b" : RED }} />
                    </div>
                    <span style={{ fontSize: "11px", color: GRAY, minWidth: "24px" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <SectionHeader title="Menu Overview" />
            <div className="rp-menu-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "Total Items",    value: menuItems.length },
                { label: "Available",      value: menuItems.filter(m => m.available).length },
                { label: "Unavailable",    value: menuItems.filter(m => !m.available).length },
                { label: "Veg",            value: menuItems.filter(m => m.veg).length },
                { label: "Chef's Special", value: menuItems.filter(m => m.chef).length },
                { label: "Non-Veg",        value: menuItems.filter(m => !m.veg).length },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fafaf8", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f0ece8" }}>
                  <p style={{ fontSize: "11px", color: GRAY, margin: "0 0 2px" }}>{s.label}</p>
                  <p style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
            {(() => {
              const catMap = {};
              menuItems.forEach(m => { catMap[m.category || "Other"] = (catMap[m.category || "Other"] || 0) + 1; });
              return Object.entries(catMap).slice(0, 4).map(([cat, cnt]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#555" }}>{cat}</span>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: ORANGE }}>{cnt} items</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* ── Coupons & Promotions ── */}
        <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <SectionHeader icon="ti-ticket" title="Coupons & Promotions" sub="Real usage, discounts, expiry" />
          <div className="rp-coupon-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Active Coupons",  value: activeCoupons.length,     sub: "isActive: true",             valueColor: GREEN },
              { label: "Total Uses",      value: totalUses,                 sub: "Sum of usedCount",           valueColor: "#185FA5" },
              { label: "Discount Saved",  value: rupee(discountSaved),      sub: "discountAmount sum",         valueColor: RED },
              { label: "Avg Conversion",  value: `${avgConversion}%`,       sub: "usedCount ÷ usageLimit",     valueColor: ORANGE },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fafaf8", borderRadius: "12px", padding: "14px 16px", border: "1px solid #f0ece8" }}>
                <p style={{ fontSize: "11px", color: GRAY, margin: "0 0 6px", fontWeight: "600" }}>{k.label}</p>
                <p style={{ fontSize: "26px", fontWeight: "800", color: k.valueColor, margin: "0 0 4px" }}>{k.value}</p>
                <p style={{ fontSize: "11px", color: GRAY, margin: 0 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {coupons.length === 0
            ? <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No coupons found</p>
            : isMobile
            ? <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {coupons.map((c, i) => {
                  const used = c.usedCount || 0; const limit = c.usageLimit || 0;
                  const fillPct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                  const isExpired = new Date(c.expiryDate) < new Date();
                  const statusLabel = !c.isActive ? "Inactive" : isExpired ? "Expired" : "Active";
                  const sc = statusLabel === "Active" ? { bg: "#e8fdf0", text: "#0F6E56" } : { bg: "#FCEBEB", text: "#A32D2D" };
                  return (
                    <div key={i} style={{ background: "#fafaf8", border: "1px solid #f0ece8", borderRadius: "12px", padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
                        <span style={{ fontWeight: "700", color: ORANGE, fontFamily: "monospace", fontSize: "12px", background: ORANGE_L, padding: "3px 8px", borderRadius: "6px" }}>{c.code}</span>
                        <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px", background: sc.bg, color: sc.text }}>{statusLabel}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                        <span style={{ color: "#555" }}>{c.discountType || "Percentage"}</span>
                        <span style={{ fontWeight: "700", color: "#1a1a1a" }}>{c.discountType === "Flat" ? rupee(c.discountValue) : `${c.discountValue}%`}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: GRAY, marginBottom: "8px" }}>
                        Min order {c.minOrderAmount ? rupee(c.minOrderAmount) : "—"}
                        {c.maxDiscount ? ` · cap ${rupee(c.maxDiscount)}` : ""}
                        {" · expires "}{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "6px", background: "#f0ece8", borderRadius: "3px" }}>
                          <div style={{ width: `${fillPct}%`, height: "100%", background: ORANGE, borderRadius: "3px" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", whiteSpace: "nowrap" }}>{used}/{limit || "∞"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            : <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                      {["Code", "Type", "Value", "Min Order", "Max Disc.", "Used / Limit", "Expiry", "Status"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c, i) => {
                      const used = c.usedCount || 0; const limit = c.usageLimit || 0;
                      const fillPct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                      const isExpired = new Date(c.expiryDate) < new Date();
                      const statusLabel = !c.isActive ? "Inactive" : isExpired ? "Expired" : "Active";
                      const sc = statusLabel === "Active" ? { bg: "#e8fdf0", text: "#0F6E56" } : { bg: "#FCEBEB", text: "#A32D2D" };
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #fafaf8" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#fdf3ed"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "12px", fontWeight: "700", color: ORANGE, fontFamily: "monospace", fontSize: "12px" }}>
                            <span style={{ background: ORANGE_L, padding: "3px 8px", borderRadius: "6px" }}>{c.code}</span>
                          </td>
                          <td style={{ padding: "12px", color: "#555" }}>{c.discountType || "Percentage"}</td>
                          <td style={{ padding: "12px", fontWeight: "700", color: "#1a1a1a" }}>{c.discountType === "Flat" ? rupee(c.discountValue) : `${c.discountValue}%`}</td>
                          <td style={{ padding: "12px", color: "#555" }}>{c.minOrderAmount ? rupee(c.minOrderAmount) : "—"}</td>
                          <td style={{ padding: "12px", color: "#555" }}>{c.maxDiscount ? rupee(c.maxDiscount) : "—"}</td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "80px", height: "6px", background: "#f0ece8", borderRadius: "3px" }}>
                                <div style={{ width: `${fillPct}%`, height: "100%", background: ORANGE, borderRadius: "3px" }} />
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a" }}>{used}/{limit || "∞"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px", color: GRAY, whiteSpace: "nowrap" }}>
                            {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px", background: sc.bg, color: sc.text }}>{statusLabel}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          }
        </div>

        {/* ── Peak Ordering Hours Heatmap ── */}
        <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <SectionHeader
            icon="ti-clock"
            title="Peak Ordering Hours"
            sub={isMobile ? "Last 14 days — scroll for more" : "Last 30 days — scroll right for latest dates"}
          />
          <DateHeatmap orders={orders} isMobile={isMobile} />
        </div>

        {/* ── Revenue Summary Table ── */}
        <div className="rp-panel" style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <SectionHeader title="Revenue Summary" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                  {["Period", "Revenue", "Orders", "Avg Order Value", "Discounts", "Net"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { period: "Today",      po: filterByRange(orders, "Today") },
                  { period: "This Week",  po: filterByRange(orders, "This Week") },
                  { period: "This Month", po: filterByRange(orders, "This Month") },
                  { period: "This Year",  po: filterByRange(orders, "This Year") },
                  { period: "All Time",   po: orders },
                ].map(({ period, po }) => {
                  const rev  = po.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
                  const disc = po.reduce((s, o) => s + (o.discountAmount || 0), 0);
                  const avg  = po.length ? Math.round(rev / po.length) : 0;
                  return (
                    <tr key={period} style={{ borderBottom: "1px solid #fafaf8" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fdf3ed"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 14px", fontWeight: "600", color: "#1a1a1a", whiteSpace: "nowrap" }}>{period}</td>
                      <td style={{ padding: "12px 14px", fontWeight: "700", color: ORANGE, whiteSpace: "nowrap" }}>{rupee(rev)}</td>
                      <td style={{ padding: "12px 14px", color: "#555" }}>{po.length}</td>
                      <td style={{ padding: "12px 14px", color: "#555", whiteSpace: "nowrap" }}>{rupee(avg)}</td>
                      <td style={{ padding: "12px 14px", color: RED, whiteSpace: "nowrap" }}>{rupee(disc)}</td>
                      <td style={{ padding: "12px 14px", fontWeight: "700", color: GREEN, whiteSpace: "nowrap" }}>{rupee(rev - disc)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid #f0ece8", fontSize: "12px", color: GRAY, flexWrap: "wrap", gap: "6px" }}>
          <span>© 2026 Noir Kitchen. All rights reserved.</span>
          <span>Made with for Noir Kitchen</span>
        </div>

      </div>
    </div>
  );
}