import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORANGE = "#E07B39";
const ORANGE_L = "#fdf3ed";
const RED = "#E24B4A";
const GREEN = "#63992E";
const GRAY = "#888";

const rupee = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const pct = (v) => `${v > 0 ? "↑" : "↓"} ${Math.abs(v)}%`;

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

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

function rangeStart(range, offset = 0) {
  const now = new Date();
  if (range === "Today") {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - offset); return d;
  }
  if (range === "This Week") {
    const d = new Date(now - 6 * 86400000); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - offset * 7); return d;
  }
  if (range === "This Month") return new Date(now.getFullYear(), now.getMonth() - offset, 1);
  return new Date(now.getFullYear() - offset, 0, 1);
}
function filterByRange(orders, range) {
  return orders.filter(o => new Date(o.createdAt) >= rangeStart(range, 0));
}
function previousPeriodOrders(orders, range) {
  const start = rangeStart(range, 1);
  const end = rangeStart(range, 0);
  return orders.filter(o => { const d = new Date(o.createdAt); return d >= start && d < end; });
}
function growthPct(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function buildSalesData(orders, range, anchor = new Date()) {
  if (range === "Today") {
    return Array.from({ length: 24 }, (_, h) => {
      const revenue = orders
        .filter(o => {
          const d = new Date(o.createdAt);
          return d.toDateString() === anchor.toDateString() && d.getHours() === h;
        })
        .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      const label = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
      return {
        day: label, revenue,
        fullDate: `${anchor.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${label}`,
      };
    });
  }
  if (range === "This Year") {
    return Array.from({ length: 12 }, (_, i) => {
      const ref = new Date(anchor); ref.setDate(1); ref.setMonth(ref.getMonth() - (11 - i));
      const revenue = orders
        .filter(o => { const d = new Date(o.createdAt); return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear(); })
        .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      return {
        day: ref.toLocaleDateString("en-IN", { month: "short" }),
        revenue,
        fullDate: ref.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        drillAnchor: ref,
        drillRange: "This Month",
      };
    });
  }
  if (range === "This Month") {
    return Array.from({ length: 5 }, (_, i) => {
      const end = new Date(anchor); end.setDate(end.getDate() - (4 - i) * 7);
      const start = new Date(end - 6 * 86400000);
      const revenue = orders
        .filter(o => { const d = new Date(o.createdAt); return d >= start && d <= end; })
        .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      return {
        day: `Wk ${i + 1}`,
        revenue,
        fullDate: `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
        drillAnchor: end,
        drillRange: "This Week",
      };
    });
  }
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor); d.setDate(d.getDate() - (6 - i));
    const revenue = orders
      .filter(o => new Date(o.createdAt).toDateString() === d.toDateString())
      .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue,
      fullDate: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      drillAnchor: d,
      drillRange: "Today",
    };
  });
}

function StatCard({ icon, label, value, delta, deltaLabel = "from yesterday" }) {
  const isMobile = useIsMobile();
  const up = delta >= 0;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #f0ece8",
      borderRadius: "12px",
      padding: isMobile ? "10px 12px" : "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: "3px",
      minWidth: 0,
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{
          width: isMobile ? "26px" : "28px",
          height: isMobile ? "26px" : "28px",
          borderRadius: "8px",
          background: ORANGE_L,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <i className={`ti ${icon}`} style={{ fontSize: isMobile ? "13px" : "15px", color: ORANGE }} aria-hidden />
        </span>
        <span style={{
          fontSize: isMobile ? "10px" : "11px",
          color: GRAY,
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>{label}</span>
      </div>
      <span style={{
        fontSize: isMobile ? "17px" : "20px",
        fontWeight: "700",
        color: "#1a1a1a",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>{value}</span>
      {delta !== undefined && (
        <span style={{ fontSize: "10px", color: up ? GREEN : RED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {pct(delta)}{" "}
          <span style={{ color: GRAY }}>{deltaLabel}</span>
        </span>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  Placed: { bg: "#e8f4fd", text: "#185FA5" },
  Preparing: { bg: "#FFF8E1", text: "#BA7517" },
  "Out for Delivery": { bg: "#EAF3DE", text: "#3B6D11" },
  Delivered: { bg: "#e8fdf0", text: "#0F6E56" },
  Cancelled: { bg: "#FCEBEB", text: "#A32D2D" },
  Confirmed: { bg: "#e8fdf0", text: "#0F6E56" },
  Pending: { bg: "#FFF8E1", text: "#BA7517" },
  "Low Stock": { bg: "#FCEBEB", text: "#A32D2D" },
};

function Badge({ status }) {
  const c = STATUS_COLORS[status] || { bg: "#f5f5f5", text: "#555" };
  return (
    <span style={{
      fontSize: "11px", fontWeight: "600", padding: "3px 8px",
      borderRadius: "20px", background: c.bg, color: c.text,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {status}
    </span>
  );
}

function DateRangeDropdown({ value, onChange, options }) {
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
          background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px",
          padding: "6px 24px 6px 10px", fontSize: "11px", fontWeight: "600",
          color: "#1a1a1a", cursor: "pointer", outline: "none", maxWidth: "120px",
        }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <i className="ti ti-chevron-down" style={{
        position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)",
        fontSize: "11px", color: GRAY, pointerEvents: "none",
      }} aria-hidden />
    </div>
  );
}

const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

function OrderStatusSelect({ orderId, current, onUpdate }) {
  const [val, setVal] = useState(current);
  const [saving, setSaving] = useState(false);
  const save = async (newStatus) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        credentials: "include",
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (r.ok) { setVal(newStatus); onUpdate?.(orderId, newStatus); }
    } finally { setSaving(false); }
  };
  return (
    <select
      value={val}
      onChange={(e) => save(e.target.value)}
      disabled={saving}
      style={{
        fontSize: "10px", padding: "3px 6px", borderRadius: "20px",
        border: "1px solid #ddd", background: STATUS_COLORS[val]?.bg || "#f5f5f5",
        color: STATUS_COLORS[val]?.text || "#555", fontWeight: "600",
        cursor: "pointer", outline: "none", maxWidth: "110px", flexShrink: 0,
      }}
    >
      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #f0ece8",
      borderRadius: "14px",
      padding: "12px",
      minWidth: 0,
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CollapsibleCard({ title, onViewAll, right, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", gap: "8px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a", margin: 0, flexShrink: 0 }}>{title}</h2>
          {right ? right : onViewAll && (
            <button onClick={onViewAll} style={{
              background: "none", border: "none", color: ORANGE,
              fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: 0, flexShrink: 0,
            }}>View All</button>
          )}
        </div>
        {children}
      </Card>
    );
  }

  return (
    <Card>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", userSelect: "none", gap: "8px",
        }}
      >
        <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a", margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {right && <div onClick={e => e.stopPropagation()}>{right}</div>}
          {onViewAll && !open && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewAll(); }}
              style={{ background: "none", border: "none", color: ORANGE, fontSize: "11px", fontWeight: "600", cursor: "pointer", padding: 0 }}
            >All</button>
          )}
          <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: "13px", color: GRAY }} aria-hidden />
        </div>
      </div>
      {open && <div style={{ marginTop: "10px" }}>{children}</div>}
    </Card>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div style={{
      background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px",
      padding: "8px 12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,.08)",
    }}>
      <p style={{ margin: "0 0 4px", color: GRAY }}>{point.fullDate || point.day}</p>
      <p style={{ margin: 0, fontWeight: "700", color: ORANGE }}>{rupee(payload[0].value)}</p>
    </div>
  );
}

function ClickableDot(props) {
  const { cx, cy, payload, onDotClick } = props;
  if (cx == null || cy == null) return null;
  const clickable = !!payload?.drillRange;
  return (
    <circle
      cx={cx} cy={cy} r={4}
      fill={ORANGE} stroke="#fff" strokeWidth={2}
      style={{ cursor: clickable ? "pointer" : "default" }}
      onClick={() => clickable && onDotClick(payload)}
    />
  );
}

const STATUS_PIE_COLORS = {
  Placed: "#185FA5",
  Preparing: "#BA7517",
  "Out for Delivery": "#3B6D11",
  Delivered: ORANGE,
  Cancelled: RED,
};

// The backend paginates /api/orders (default 50/page) and returns
// { orders, total, page }. This loops through every page so the
// dashboard always reflects the true order count, however large.
async function fetchAllOrders(headers) {
  const pageSize = 200; // fewer round trips than the backend's default of 50
  let page = 1;
  let all = [];
  let total = Infinity;

  while (all.length < total) {
    const r = await fetch(`${API}/api/orders?page=${page}&limit=${pageSize}`, {
      credentials: "include",
      headers,
    });
    if (!r.ok) break;
    const data = await r.json();
    const batch = Array.isArray(data) ? data : data.orders || [];
    all = all.concat(batch);
    total = Array.isArray(data) ? all.length : Number(data.total ?? all.length);
    if (batch.length === 0) break; // safety net against an infinite loop
    page += 1;
  }
  return all;
}

export default function Dashboard() {
  const isMobile = useIsMobile();

  const [salesRange, setSalesRange] = useState("This Week");
  const [salesAnchor, setSalesAnchor] = useState(null);
  const [salesBreadcrumb, setSalesBreadcrumb] = useState([]);
  const [dishesRange, setDishesRange] = useState("This Week");
  const [revenueRange, setRevenueRange] = useState("This Month");

  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [siteContent, setSiteContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const opts = { credentials: "include", headers };
    Promise.all([
      fetchAllOrders(headers),
      fetch(`${API}/api/reviews`, opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/menu`, opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/users`, opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/contact`, opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/chefs`, opts).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/webcontent`, { credentials: "include" }).then(r => r.ok ? r.json() : {}),
    ]).then(([ord, rev, menu, cust, msg, ch, cnt]) => {
      setOrders(ord);
      setReviews(Array.isArray(rev) ? rev : rev.reviews || []);
      setMenuItems(Array.isArray(menu) ? menu : menu.items || []);
      setCustomers(Array.isArray(cust) ? cust : cust.users || []);
      setMessages(Array.isArray(msg) ? msg : msg.messages || []);
      setChefs(Array.isArray(ch) ? ch : ch.chefs || []);
      setSiteContent(cnt?.boxes || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date();
  const yesterday = new Date(today - 86400000);
  const last7Start = new Date(today - 7 * 86400000);
  const prev7Start = new Date(today - 14 * 86400000);

  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today.toDateString());
  const yesterdayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === yesterday.toDateString());

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.orderStatus === "Placed" || o.orderStatus === "Preparing").length;
  const completedOrders = orders.filter(o => o.orderStatus === "Delivered").length;

  const todayRevenue = todayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const isPending = (o) => o.orderStatus === "Placed" || o.orderStatus === "Preparing";
  const ordersDelta = growthPct(todayOrders.length, yesterdayOrders.length);
  const revenueDelta = growthPct(todayRevenue, yesterdayRevenue);
  const pendingDelta = growthPct(todayOrders.filter(isPending).length, yesterdayOrders.filter(isPending).length);
  const completedDelta = growthPct(
    todayOrders.filter(o => o.orderStatus === "Delivered").length,
    yesterdayOrders.filter(o => o.orderStatus === "Delivered").length
  );

  const newCustomers = customers.filter(c => new Date(c.createdAt) >= last7Start).length;
  const lastWeekCustomers = customers.filter(c => { const d = new Date(c.createdAt); return d >= prev7Start && d < last7Start; }).length;
  const customersDelta = growthPct(newCustomers, lastWeekCustomers);

  const todayReviews = reviews.filter(r => new Date(r.createdAt).toDateString() === today.toDateString()).length;
  const yesterdayReviews = reviews.filter(r => new Date(r.createdAt).toDateString() === yesterday.toDateString()).length;
  const reviewsDelta = growthPct(todayReviews, yesterdayReviews);

  const revenueOrders = filterByRange(orders, revenueRange);
  const totalRevenue = revenueOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const prevRevenueOrders = previousPeriodOrders(orders, revenueRange);
  const prevRevenue = prevRevenueOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const revenueGrowth = growthPct(totalRevenue, prevRevenue);

  const revenueBreakdown = ORDER_STATUSES
    .map(status => {
      const statusOrders = revenueOrders.filter(o => o.orderStatus === status);
      return {
        name: status,
        value: statusOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
        count: statusOrders.length,
      };
    })
    .filter(d => d.value > 0);

  const salesData = buildSalesData(orders, salesRange, salesAnchor || new Date());
  const salesTotal = salesData.reduce((s, d) => s + d.revenue, 0);
  const salesPeak = salesData.reduce((max, d) => d.revenue > max.revenue ? d : max, salesData[0] || { revenue: 0, day: "-" });
  const salesFirstHalf = salesData.slice(0, Math.ceil(salesData.length / 2)).reduce((s, d) => s + d.revenue, 0);
  const salesSecondHalf = salesData.slice(Math.ceil(salesData.length / 2)).reduce((s, d) => s + d.revenue, 0);
  const salesTrend = growthPct(salesSecondHalf, salesFirstHalf);

  const handleSalesDrillIn = (point) => {
    if (!point?.drillRange) return;
    setSalesBreadcrumb(prev => [...prev, { range: salesRange, anchor: salesAnchor }]);
    setSalesRange(point.drillRange);
    setSalesAnchor(point.drillAnchor);
  };

  const handleSalesDrillBack = () => {
    setSalesBreadcrumb(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setSalesRange(last.range);
      setSalesAnchor(last.anchor);
      return prev.slice(0, -1);
    });
  };

  const handleSalesRangeChange = (newRange) => {
    setSalesRange(newRange);
    setSalesAnchor(null);
    setSalesBreadcrumb([]);
  };

  const dishOrders = filterByRange(orders, dishesRange);
  const itemCounts = {};
  dishOrders.forEach(o => {
    if (!itemCounts[o.itemName]) itemCounts[o.itemName] = { count: 0, revenue: 0 };
    itemCounts[o.itemName].count += o.quantity || 1;
    itemCounts[o.itemName].revenue += o.totalAmount || 0;
  });
  const topDishes = Object.entries(itemCounts)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, d]) => ({ name, ...d }));

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const handleOrderStatusUpdate = (id, newStatus) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: newStatus } : o));
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
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading dashboard…</p>
      </div>
    </div>
  );

  const pad = isMobile ? "12px" : "20px 24px";
  const gap = isMobile ? "10px" : "14px";

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ padding: pad, maxWidth: "1400px" }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isMobile ? "12px" : "18px",
          gap: "10px",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 2px" }}>
              Dashboard
            </h1>
            <p style={{ fontSize: isMobile ? "11px" : "13px", color: GRAY, margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getGreeting()}, Rizwan!{" "}
              {todayOrders.length > 0 ? (
                <span>
                  <span style={{ color: ORANGE, fontWeight: "700" }}>{todayOrders.length} order{todayOrders.length !== 1 ? "s" : ""}</span>{" "}today
                  {pendingOrders > 0 && <span style={{ color: RED, fontWeight: "700" }}> — {pendingOrders} pending</span>}
                </span>
              ) : "No orders yet today."}
            </p>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px",
            padding: isMobile ? "6px 10px" : "7px 12px",
            fontSize: isMobile ? "11px" : "12px", color: "#555", flexShrink: 0,
          }}>
            <i className="ti ti-calendar" style={{ color: ORANGE, fontSize: isMobile ? "12px" : "14px" }} aria-hidden />
            {isMobile
              ? new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
            }
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))",
          gap: isMobile ? "8px" : "10px",
          marginBottom: gap,
        }}>
          <StatCard icon="ti-shopping-bag" label="Total Orders" value={totalOrders} delta={ordersDelta} />
          <StatCard icon="ti-currency-rupee" label="Today's Revenue" value={rupee(todayRevenue)} delta={revenueDelta} />
          <StatCard icon="ti-clock" label="Pending" value={pendingOrders} delta={pendingDelta} />
          <StatCard icon="ti-circle-check" label="Completed" value={completedOrders} delta={completedDelta} />
          <StatCard icon="ti-users" label="New Customers" value={newCustomers} delta={customersDelta} deltaLabel="vs last week" />
          <StatCard icon="ti-star" label="Reviews" value={reviews.length} delta={reviewsDelta} />
        </div>

        {/* ── Sales Chart ── */}
        <div style={{ marginBottom: gap }}>
          <CollapsibleCard
            title="Sales Overview"
            right={
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {salesBreadcrumb.length > 0 && (
                  <button
                    onClick={handleSalesDrillBack}
                    style={{
                      background: "none", border: "1px solid #f0ece8", borderRadius: "8px",
                      padding: "4px 8px", fontSize: "11px", fontWeight: "600",
                      color: ORANGE, cursor: "pointer", display: "flex", alignItems: "center", gap: "3px",
                    }}
                  >
                    <i className="ti ti-arrow-left" aria-hidden /> Back
                  </button>
                )}
                <DateRangeDropdown value={salesRange} onChange={handleSalesRangeChange} options={["Today", "This Week", "This Month", "This Year"]} />
              </div>
            }
          >
            {/* Stats row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, auto)",
              gap: isMobile ? "8px" : "24px",
              marginBottom: "10px",
            }}>
              <div>
                <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 1px" }}>Total in period</p>
                <p style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>{rupee(salesTotal)}</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 1px" }}>Peak</p>
                <p style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {rupee(salesPeak.revenue)} <span style={{ fontSize: "10px", color: GRAY, fontWeight: "400" }}>({salesPeak.day})</span>
                </p>
              </div>
              {!isMobile && (
                <div>
                  <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 1px" }}>Trend</p>
                  <p style={{ fontSize: "17px", fontWeight: "700", color: salesTrend >= 0 ? GREEN : RED, margin: 0 }}>
                    {pct(salesTrend)} <span style={{ fontSize: "10px", color: GRAY, fontWeight: "400" }}>2nd vs 1st half</span>
                  </p>
                </div>
              )}
            </div>

            {salesData.some(d => d.drillRange) && (
              <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <i className="ti ti-hand-click" style={{ color: ORANGE }} aria-hidden />
                Tap a point to drill in
              </p>
            )}

            <ChartBox height={isMobile ? 150 : 190}>
              {(w, h) => (
                <LineChart width={w} height={h} data={salesData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: isMobile ? 9 : 10, fill: GRAY }}
                    axisLine={{ stroke: "#e5e5e3" }}
                    tickLine={false}
                    angle={salesRange === "Today" ? -45 : 0}
                    textAnchor={salesRange === "Today" ? "end" : "middle"}
                    height={salesRange === "Today" ? 36 : 20}
                    interval={salesRange === "Today" && isMobile ? 3 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: isMobile ? 9 : 10, fill: GRAY }}
                    axisLine={false} tickLine={false}
                    width={isMobile ? 38 : 50}
                    tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                    domain={[0, "auto"]}
                    tickCount={4}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone" dataKey="revenue" stroke={ORANGE}
                    strokeWidth={2}
                    dot={<ClickableDot onDotClick={handleSalesDrillIn} />}
                    activeDot={<ClickableDot onDotClick={handleSalesDrillIn} />}
                    isAnimationActive={false}
                  />
                </LineChart>
              )}
            </ChartBox>
          </CollapsibleCard>
        </div>

        {/* ── Top Dishes + Recent Orders ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1.2fr",
          gap,
          marginBottom: gap,
        }}>
          <CollapsibleCard
            title="Top Selling Dishes"
            right={<DateRangeDropdown value={dishesRange} onChange={setDishesRange} options={["Today", "This Week", "This Month", "This Year"]} />}
            defaultOpen={!isMobile}
          >
            {topDishes.length === 0 ? (
              <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", margin: "12px 0" }}>No orders yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {topDishes.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "8px", background: ORANGE_L,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", flexShrink: 0,
                    }}>🍽️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</p>
                      <p style={{ fontSize: "10px", color: GRAY, margin: 0 }}>{d.count} orders</p>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#1a1a1a", whiteSpace: "nowrap", flexShrink: 0 }}>{rupee(d.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleCard>

          <CollapsibleCard title="Recent Orders" onViewAll={() => window.location.href = "/admin/orders"} defaultOpen={!isMobile}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentOrders.map((o) => (
                <div key={o._id} style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "10px", fontWeight: "600", color: ORANGE, margin: 0 }}>
                      #{o._id?.slice(-8).toUpperCase()}
                    </p>
                    <p style={{ fontSize: "11px", color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.fullName}
                    </p>
                  </div>
                  <OrderStatusSelect orderId={o._id} current={o.orderStatus} onUpdate={handleOrderStatusUpdate} />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#1a1a1a", whiteSpace: "nowrap", flexShrink: 0 }}>{rupee(o.totalAmount)}</span>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", margin: "12px 0" }}>No orders yet</p>
              )}
            </div>
          </CollapsibleCard>
        </div>

        {/* ── Revenue Overview ── */}
        <div style={{ marginBottom: gap }}>
          <CollapsibleCard
            title="Revenue Overview"
            right={<DateRangeDropdown value={revenueRange} onChange={setRevenueRange} options={["This Week", "This Month", "This Year"]} />}
          >
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "row" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              gap: isMobile ? "12px" : "16px",
              flexWrap: isMobile ? "wrap" : "nowrap",
            }}>
              {/* Left: number + breakdown */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: isMobile ? "22px" : "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 2px" }}>{rupee(totalRevenue)}</p>
                <p style={{ fontSize: "11px", color: revenueGrowth >= 0 ? GREEN : RED, margin: "0 0 8px" }}>
                  {pct(revenueGrowth)} from last {revenueRange === "This Week" ? "week" : revenueRange === "This Year" ? "year" : "month"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {revenueBreakdown.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", minWidth: 0 }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: STATUS_PIE_COLORS[d.name] || GRAY, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.name} <span style={{ color: GRAY }}>({d.count})</span>
                      </span>
                      <span style={{ fontWeight: "600", color: "#1a1a1a", flexShrink: 0 }}>{rupee(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: donut */}
              <div style={{
                flexShrink: 0,
                width: isMobile ? "100px" : "120px",
                height: isMobile ? "100px" : "120px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {(() => {
                  const vals = revenueBreakdown.map(d => (Number.isFinite(d.value) ? Math.max(d.value, 0) : 0));
                  const sum = vals.reduce((a, b) => a + b, 0);
                  const size = isMobile ? 88 : 108;
                  const hole = isMobile ? 46 : 58;
                  if (sum <= 0) {
                    return (
                      <div style={{
                        width: `${size}px`, height: `${size}px`, borderRadius: "50%",
                        border: `${isMobile ? 12 : 16}px solid #f0ece8`, boxSizing: "border-box",
                      }} />
                    );
                  }
                  let acc = 0;
                  const stops = vals.map((v, i) => {
                    const startPct = (acc / sum) * 100;
                    acc += v;
                    const endPct = (acc / sum) * 100;
                    const color = STATUS_PIE_COLORS[revenueBreakdown[i].name] || GRAY;
                    return `${color} ${startPct}% ${endPct}%`;
                  }).join(", ");
                  return (
                    <div style={{
                      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
                      background: `conic-gradient(${stops})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{ width: `${hole}px`, height: `${hole}px`, borderRadius: "50%", background: "#fff" }} />
                    </div>
                  );
                })()}
              </div>
            </div>
          </CollapsibleCard>
        </div>

        {/* ── Customer Messages + Reviews ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap,
          marginBottom: gap,
        }}>
          <CollapsibleCard title="Customer Messages" onViewAll={() => window.location.href = "/admin/customerMessage"} defaultOpen={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages.slice(0, 5).map((m, i) => (
                <div key={i} style={{ paddingBottom: "6px", borderBottom: "1px solid #f5f5f3", minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1px", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.name}</span>
                    <span style={{ fontSize: "10px", color: GRAY, flexShrink: 0 }}>{m.date || ""}</span>
                  </div>
                  {m.subject && <p style={{ fontSize: "10px", color: ORANGE, margin: "0 0 1px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</p>}
                  <p style={{ fontSize: "11px", color: "#555", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.message}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", margin: "12px 0" }}>No messages yet</p>
              )}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Recent Reviews" onViewAll={() => window.location.href = "/admin/reviews"} defaultOpen={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {reviews.slice(0, 5).map((r, i) => (
                <div key={i} style={{ paddingBottom: "6px", borderBottom: "1px solid #f5f5f3", minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {r.user?.name}
                    </span>
                    <div style={{ display: "flex", gap: "1px", flexShrink: 0 }}>
                      {Array.from({ length: 5 }, (_, j) => (
                        <i key={j} className="ti ti-star-filled" style={{ fontSize: "11px", color: j < r.rating ? "#f59e0b" : "#e5e7eb" }} aria-hidden />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: "11px", color: "#555", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.message}
                  </p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", margin: "12px 0" }}>No reviews yet</p>
              )}
            </div>
          </CollapsibleCard>
        </div>

        {/* ── Menu + Customers + Website Content ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap,
          marginBottom: gap,
        }}>
          {/* Menu Overview */}
          <CollapsibleCard title="Menu Overview" onViewAll={() => window.location.href = "/admin/menuManagement"} defaultOpen={false}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", marginBottom: "10px" }}>
              {[
                { label: "Total Items", value: menuItems.length },
                { label: "Available", value: menuItems.filter(m => m.available).length },
                { label: "Veg", value: menuItems.filter(m => m.veg).length },
                { label: "Chef's Special", value: menuItems.filter(m => m.chef).length },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fafaf8", borderRadius: "10px", padding: "7px 10px", border: "1px solid #f0ece8" }}>
                  <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 1px" }}>{s.label}</p>
                  <p style={{ fontSize: "17px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {menuItems.slice(0, 4).map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", minWidth: 0 }}>
                  <span style={{ fontSize: "12px", color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.name}</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: ORANGE, flexShrink: 0 }}>{m.price ? `₹${m.price}` : ""}</span>
                  <span style={{
                    fontSize: "10px", padding: "2px 6px", borderRadius: "20px",
                    background: m.available ? "#EAF3DE" : "#FCEBEB",
                    color: m.available ? "#3B6D11" : "#A32D2D",
                    fontWeight: "600", flexShrink: 0,
                  }}>{m.available ? "Live" : "Off"}</span>
                </div>
              ))}
            </div>
          </CollapsibleCard>

          {/* Customers */}
          <CollapsibleCard title="Customers" onViewAll={() => window.location.href = "/admin/customers"} defaultOpen={false}>
            <div style={{ background: ORANGE_L, borderRadius: "12px", padding: "9px 12px", marginBottom: "10px", display: "flex", gap: "16px" }}>
              <div>
                <p style={{ fontSize: "10px", color: "#888", margin: "0 0 1px" }}>Total</p>
                <p style={{ fontSize: "17px", fontWeight: "800", color: "#1a1a1a", margin: 0 }}>{customers.length}</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", color: "#888", margin: "0 0 1px" }}>Verified</p>
                <p style={{ fontSize: "17px", fontWeight: "800", color: "#1a1a1a", margin: 0 }}>{customers.filter(c => c.isVerified).length}</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", color: "#888", margin: "0 0 1px" }}>This Week</p>
                <p style={{ fontSize: "17px", fontWeight: "800", color: ORANGE, margin: 0 }}>{newCustomers}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {customers.slice(0, 5).map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%", background: ORANGE_L,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: "700", color: ORANGE, flexShrink: 0,
                  }}>{c.name?.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                    <p style={{ fontSize: "10px", color: GRAY, margin: 0 }}>{c.authMethod}</p>
                  </div>
                  {c.isVerified
                    ? <i className="ti ti-circle-check" style={{ fontSize: "14px", color: GREEN, flexShrink: 0 }} aria-hidden />
                    : <i className="ti ti-clock" style={{ fontSize: "14px", color: "#f59e0b", flexShrink: 0 }} aria-hidden />
                  }
                </div>
              ))}
            </div>
          </CollapsibleCard>

          {/* Website Content */}
          <CollapsibleCard title="Website Content" defaultOpen={false}>
            <p style={{ fontSize: "11px", color: GRAY, margin: "0 0 8px" }}>Live content blocks on your site.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {siteContent.length === 0 ? (
                <p style={{ fontSize: "13px", color: GRAY, textAlign: "center", margin: "8px 0" }}>No content saved yet.</p>
              ) : (
                siteContent.slice(0, 5).map((box) => {
                  const filled = !!(box.content || box.emoji || box.imageUrl || box.icon);
                  return (
                    <div key={box.id} style={{
                      background: "#fafaf8", borderRadius: "8px",
                      padding: "7px 10px", border: "1px solid #f0ece8",
                      minWidth: 0, overflow: "hidden",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                        <p style={{
                          fontSize: "10px", color: GRAY, margin: 0,
                          textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0,
                        }}>{box.label}</p>
                        <span style={{
                          fontSize: "10px", padding: "1px 6px", borderRadius: "20px",
                          background: filled ? "#e8fdf0" : "#f5f5f3",
                          color: filled ? "#0F6E56" : GRAY,
                          fontWeight: "600", flexShrink: 0, whiteSpace: "nowrap",
                        }}>{filled ? "Filled" : "Empty"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                        {box.imageUrl && (
                          <img src={box.imageUrl} alt="" style={{ width: "28px", height: "28px", borderRadius: "5px", objectFit: "cover", flexShrink: 0 }} />
                        )}
                        {box.emoji && !box.imageUrl && (
                          <span style={{ fontSize: "18px", flexShrink: 0, lineHeight: 1 }}>{box.emoji}</span>
                        )}
                        {box.icon && !box.emoji && !box.imageUrl && (
                          <i className={`ti ${box.icon}`} style={{ fontSize: "16px", color: ORANGE, flexShrink: 0 }} />
                        )}
                        <p style={{
                          fontSize: "11px", color: "#1a1a1a", margin: 0,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          flex: 1, minWidth: 0,
                        }}>
                          {box.content || (box.emoji ? `${box.emoji} emoji` : box.imageUrl ? "Image" : box.icon ? box.icon.replace("ti-", "") : <span style={{ color: "#ccc" }}>—</span>)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button
              onClick={() => window.location.href = "/admin/Webcontent"}
              style={{
                marginTop: "10px", width: "100%", padding: "9px",
                background: ORANGE, color: "#fff", border: "none",
                borderRadius: "10px", fontSize: "12px", fontWeight: "600",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "6px", boxSizing: "border-box",
              }}
            >
              <i className="ti ti-edit" style={{ fontSize: "13px" }} aria-hidden />
              Edit Website Content
            </button>
          </CollapsibleCard>
        </div>

        {/* ── Staff + Order Status Breakdown ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.6fr",
          gap,
          marginBottom: gap,
        }}>
          {/* Staff */}
          <CollapsibleCard title="Staff & Chefs" onViewAll={() => window.location.href = "/admin/staff"} defaultOpen={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {chefs.slice(0, 5).map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <img src={c.image} alt={c.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                    <p style={{ fontSize: "10px", color: GRAY, margin: 0 }}>{c.role}</p>
                  </div>
                  <span style={{
                    fontSize: "10px", padding: "2px 7px", borderRadius: "20px",
                    background: ORANGE_L, color: ORANGE, fontWeight: "600", flexShrink: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70px",
                  }}>{c.category}</span>
                </div>
              ))}
              {chefs.length === 0 && (
                <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", margin: "12px 0" }}>No staff added yet</p>
              )}
            </div>
          </CollapsibleCard>

          {/* Order Status Breakdown — always card layout (no table on mobile) */}
          <CollapsibleCard title="Order Status" onViewAll={() => window.location.href = "/admin/orders"} defaultOpen={!isMobile}>
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {ORDER_STATUSES.map((status) => {
                  const statusOrders = orders.filter(o => o.orderStatus === status);
                  const rev = statusOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
                  const perc = totalOrders > 0 ? ((statusOrders.length / totalOrders) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={status} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "7px 10px", background: "#fafaf8",
                      borderRadius: "10px", border: "1px solid #f0ece8", minWidth: 0,
                    }}>
                      <Badge status={status} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ height: "4px", background: "#f0ece8", borderRadius: "3px" }}>
                          <div style={{ width: `${perc}%`, height: "100%", background: ORANGE, borderRadius: "3px" }} />
                        </div>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#1a1a1a", flexShrink: 0 }}>{statusOrders.length}</span>
                      <span style={{ fontSize: "10px", color: GRAY, flexShrink: 0, minWidth: "40px", textAlign: "right" }}>{rupee(rev)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                      {["Status", "Count", "Revenue", "% of Total"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ORDER_STATUSES.map((status) => {
                      const statusOrders = orders.filter(o => o.orderStatus === status);
                      const rev = statusOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
                      const perc = totalOrders > 0 ? ((statusOrders.length / totalOrders) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={status} style={{ borderBottom: "1px solid #fafaf8" }}>
                          <td style={{ padding: "8px 10px" }}><Badge status={status} /></td>
                          <td style={{ padding: "8px 10px", fontWeight: "600" }}>{statusOrders.length}</td>
                          <td style={{ padding: "8px 10px" }}>{rupee(rev)}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ flex: 1, height: "6px", background: "#f0ece8", borderRadius: "3px" }}>
                                <div style={{ width: `${perc}%`, height: "100%", background: ORANGE, borderRadius: "3px" }} />
                              </div>
                              <span style={{ fontSize: "11px", color: GRAY, minWidth: "32px" }}>{perc}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CollapsibleCard>
        </div>

        {/* footer */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "center" : "flex-start",
          gap: "4px",
          paddingTop: "12px",
          borderTop: "1px solid #f0ece8",
          fontSize: "11px",
          color: GRAY,
          textAlign: isMobile ? "center" : "left",
        }}>
          <span>© 2026 Noir Kitchen. All rights reserved.</span>
          <span>Made with for Noir Kitchen</span>
        </div>

      </div>
    </div>
  );
}