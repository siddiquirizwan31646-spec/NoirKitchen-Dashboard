import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─── colour tokens (matches Dashboard.jsx) ──── */
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
const ORDER_STATUS_COLORS = {
    Placed: { bg: "#e8f4fd", text: "#185FA5" },
    Preparing: { bg: "#FFF8E1", text: "#BA7517" },
    "Out for Delivery": { bg: "#EAF3DE", text: "#3B6D11" },
    Delivered: { bg: "#e8fdf0", text: "#0F6E56" },
    Cancelled: { bg: "#FCEBEB", text: "#A32D2D" },
};
const AGENT_STATUS_COLORS = {
    Available: { bg: "#EAF3DE", text: "#3B6D11" },
    "On Delivery": { bg: "#FFF8E1", text: "#BA7517" },
    Offline: { bg: "#f5f5f5", text: "#777" },
};
const DELIVERY_STATUS_COLORS = {
    Unassigned: { bg: "#FCEBEB", text: "#A32D2D" },
    Assigned: { bg: "#e8f4fd", text: "#185FA5" },
    "Picked Up": { bg: "#FFF8E1", text: "#BA7517" },
    "Out for Delivery": { bg: "#EAF3DE", text: "#3B6D11" },
    Delivered: { bg: "#e8fdf0", text: "#0F6E56" },
    Failed: { bg: "#FCEBEB", text: "#A32D2D" },
};
const DELIVERY_STATUSES = ["Unassigned", "Assigned", "Picked Up", "Out for Delivery", "Delivered", "Failed"];

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
function AgentLogModal({ agent, onClose }) {
    const today = new Date().toDateString();

    const todayLogs = (agent.statusLog || [])
        .filter(l => new Date(l.changedAt).toDateString() === today)
        .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));

    const fmt = (iso) => new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true
    });

    const STATUS_DOT = {
        "Available": "#63992E",
        "On Delivery": "#BA7517",
        "Offline": "#888",
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
                onClick={e => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: "16px", padding: "24px",
                    width: "380px", maxWidth: "100%", maxHeight: "85vh", overflowY: "auto",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <div style={{
                        width: "42px", height: "42px", borderRadius: "50%", background: "#fdf3ed",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "16px", fontWeight: "700", color: "#E07B39", flexShrink: 0,
                    }}>
                        {agent.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a1a" }}>{agent.name}</div>
                        <div style={{ fontSize: "11px", color: "#888" }}>
                            Today's Activity · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                {todayLogs.length === 0 ? (
                    <p style={{ color: "#888", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                        No activity recorded today.
                    </p>
                ) : (
                    <div style={{ position: "relative", paddingLeft: "20px" }}>
                        {/* vertical line */}
                        <div style={{
                            position: "absolute", left: "6px", top: "8px",
                            bottom: "8px", width: "2px", background: "#f0ece8",
                        }} />

                        {todayLogs.map((log, i) => (
                            <div key={i} style={{ position: "relative", marginBottom: "18px" }}>
                                {/* dot */}
                                <div style={{
                                    position: "absolute", left: "-17px", top: "3px",
                                    width: "10px", height: "10px", borderRadius: "50%",
                                    background: STATUS_DOT[log.status] || "#888",
                                    border: "2px solid #fff",
                                    boxShadow: `0 0 0 2px ${STATUS_DOT[log.status] || "#888"}40`,
                                }} />

                                <div style={{ fontSize: "11px", color: "#888", marginBottom: "2px" }}>
                                    {fmt(log.changedAt)}
                                </div>
                                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a" }}>
                                    {log.status}
                                </div>
                                {log.orderId && (
                                    <div style={{
                                        fontSize: "11px", color: "#E07B39", marginTop: "2px",
                                        fontFamily: "monospace",
                                    }}>
                                        #{String(log.orderId).slice(-8).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={onClose}
                    style={{
                        width: "100%", marginTop: "8px", padding: "12px",
                        background: "#fdf3ed", border: "none", borderRadius: "10px",
                        color: "#E07B39", fontWeight: "600", fontSize: "13px", cursor: "pointer",
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
}

/* ─── Delivery card (mobile view of a row) ─────── */
function DeliveryCard({ d, agents, onAssign }) {
    return (
        <div style={{
            background: "#fafaf8", border: "1px solid #f0ece8", borderRadius: "12px",
            padding: "14px", display: "flex", flexDirection: "column", gap: "8px",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontWeight: "700", color: ORANGE, fontSize: "13px" }}>
                    #{d._id?.slice(-8).toUpperCase() || "—"}
                </span>
                <Badge status={d.orderStatus} map={ORDER_STATUS_COLORS} />
            </div>
            <div style={{ fontSize: "13px", color: "#1a1a1a", lineHeight: 1.4 }}>
    {d.deliveryAddress}
</div>
{d.orderStatus === "Cancelled" && d.cancelReason && (
    <div style={{
        fontSize: "11px", color: "#A32D2D",
        background: "#FCEBEB", padding: "6px 10px",
        borderRadius: "6px",
    }}>
        Cancel reason: {d.cancelReason}
    </div>
)}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                {d.deliveryPartner ? (
                    <span style={{ fontSize: "12px", color: GRAY }}>
                        Agent: <span style={{ color: "#1a1a1a", fontWeight: "600" }}>{d.deliveryPartner.name}</span>
                    </span>
                ) : (
                    <select defaultValue="" onChange={(e) => onAssign(d._id, e.target.value)}
                        style={{
                            fontSize: "13px", padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd",
                            outline: "none", flex: 1, background: "#fff",
                        }}>
                        <option value="" disabled>Assign agent…</option>
                        {agents.filter(a => a.status === "Available").map(a => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                    </select>
                )}
                <span style={{ fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap" }}>
                    {rupee(d.totalAmount)}
                </span>
            </div>
        </div>
    );
}

/* ─── MAIN PAGE ───────────────────────────────── */
export default function AdminDelivery() {
    const [agents, setAgents] = useState([]);
    const [logAgent, setLogAgent] = useState(null);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddAgent, setShowAddAgent] = useState(false);
    const [newAgent, setNewAgent] = useState({ name: "", phone: "", email: "", vehicleType: "Bike", vehicleNumber: "" });
    const [savingAgent, setSavingAgent] = useState(false);
    const [agentError, setAgentError] = useState("");
    const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 760 : false);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 760);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const load = () => {
        Promise.all([
  fetch(`${API}/api/delivery-agents`, authOpts()).then(r => r.ok ? r.json() : []),
  fetch(`${API}/api/orders`, authOpts()).then(r => r.ok ? r.json() : { orders: [] }),
]).then(([ag, ordRes]) => {
            setAgents(Array.isArray(ag) ? ag : []);
            setDeliveries(Array.isArray(ordRes.orders) ? ordRes.orders : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    /* ─── derived stats ─────────────────────────── */
    const totalAgents = agents.length;
    const availableAgents = agents.filter(a => a.status === "Available").length;
    const onDeliveryAgents = agents.filter(a => a.status === "On Delivery").length;
    const unassignedCount = deliveries.filter(d => !d.deliveryPartner && ["Placed", "Preparing"].includes(d.orderStatus)).length;
    const todayDelivered = deliveries.filter(d =>
        d.orderStatus === "Delivered" &&
        new Date(d.updatedAt).toDateString() === new Date().toDateString()
    ).length;

    /* ─── actions ────────────────────────────────── */
    const assignAgent = async (orderId, agentId) => {
        if (!agentId) return;
        const r = await fetch(`${API}/api/orders/${orderId}/assign-partner`, authOpts({
  method: "PATCH",
  body: JSON.stringify({ agentId }),
}));
        if (r.ok) load();
    };

    const addAgent = async (e) => {
        e.preventDefault();
        setAgentError("");
        if (!newAgent.name || !newAgent.phone || !newAgent.email) {
            setAgentError("Name, phone, and email are all required.");
            return;
        }
        setSavingAgent(true);
        try {
            const r = await fetch(`${API}/api/delivery-agents`, authOpts({
  method: "POST",
  body: JSON.stringify(newAgent),
}));
            const data = await r.json().catch(() => ({}));
            if (r.ok) {
                setNewAgent({ name: "", phone: "", email: "", vehicleType: "Bike", vehicleNumber: "" });
                setShowAddAgent(false);
                load();
            } else {
                setAgentError(data.message || "Could not add agent. Email may already be in use.");
            }
        } finally {
            setSavingAgent(false);
        }
    };

    const removeAgent = async (id) => {
        if (!window.confirm("Remove this agent?")) return;
        const r = await fetch(`${API}/api/delivery-agents/${id}`, authOpts({ method: "DELETE" }));
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
                <p style={{ color: GRAY, fontSize: "14px" }}>Loading deliveries…</p>
            </div>
        </div>
    );

    return (
        <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .ad-input { font-size: 16px !important; }
                @media (max-width: 760px) {
                    .ad-page-pad { padding: 16px !important; }
                    .ad-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
                    .ad-main-grid { grid-template-columns: 1fr !important; }
                    .ad-h1 { font-size: 20px !important; }
                }
                @media (max-width: 420px) {
                    .ad-stat-grid { grid-template-columns: 1fr 1fr !important; }
                }
            `}</style>
            <div className="ad-page-pad" style={{ padding: "28px 32px", maxWidth: "1400px" }}>

                {/* ── Header ── */}
                <div style={{ marginBottom: "24px" }}>
                    <h1 className="ad-h1" style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>Delivery Management</h1>
                    <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>
                        {unassignedCount > 0
                            ? <>You have <span style={{ color: RED, fontWeight: "700" }}>{unassignedCount} unassigned order{unassignedCount !== 1 ? "s" : ""}</span> waiting for a rider.</>
                            : "All orders are assigned. Nice work."}
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="ad-stat-grid" style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: "14px", marginBottom: "24px",
                }}>
                    <StatCard icon="ti-users" label="Total Agents" value={totalAgents} />
                    <StatCard icon="ti-circle-check" label="Available" value={availableAgents} color={GREEN} />
                    <StatCard icon="ti-motorbike" label="On Delivery" value={onDeliveryAgents} />
                    <StatCard icon="ti-alert-triangle" label="Unassigned Orders" value={unassignedCount} color={RED} />
                    <StatCard icon="ti-package" label="Delivered Today" value={todayDelivered} color={GREEN} />
                </div>

                <div className="ad-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "18px" }}>

                    {/* ── Agents panel ── */}
                    <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "18px" }}>
                        <SectionHeader title="Delivery Agents" right={
                            <button onClick={() => { setShowAddAgent(s => !s); setAgentError(""); }} style={{
                                background: "none", border: "none", color: ORANGE, fontSize: "13px",
                                fontWeight: "600", cursor: "pointer", padding: "6px 0", flexShrink: 0,
                            }}>
                                {showAddAgent ? "Cancel" : "+ Add Agent"}
                            </button>
                        } />

                        {showAddAgent && (
                            <form onSubmit={addAgent} style={{
                                background: "#fafaf8", border: "1px solid #f0ece8", borderRadius: "10px",
                                padding: "14px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px",
                            }}>
                                <input className="ad-input" placeholder="Name" value={newAgent.name}
                                    onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))}
                                    style={{ padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                                <input className="ad-input" placeholder="Phone" value={newAgent.phone}
                                    onChange={e => setNewAgent(p => ({ ...p, phone: e.target.value }))}
                                    style={{ padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                                <input className="ad-input" type="email" placeholder="Email (used to sign in)" value={newAgent.email}
                                    onChange={e => setNewAgent(p => ({ ...p, email: e.target.value }))}
                                    style={{ padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <select className="ad-input" value={newAgent.vehicleType}
                                        onChange={e => setNewAgent(p => ({ ...p, vehicleType: e.target.value }))}
                                        style={{ flex: "1 1 120px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }}>
                                        {["Bike", "Scooter", "Bicycle", "Car"].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                    <input className="ad-input" placeholder="Vehicle no." value={newAgent.vehicleNumber}
                                        onChange={e => setNewAgent(p => ({ ...p, vehicleNumber: e.target.value }))}
                                        style={{ flex: "1 1 120px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }} />
                                </div>

                                {agentError && (
                                    <p style={{ fontSize: "12px", color: "#A32D2D", background: "#FCEBEB", padding: "8px 10px", borderRadius: "8px", margin: 0 }}>
                                        {agentError}
                                    </p>
                                )}

                                <button type="submit" disabled={savingAgent} style={{
                                    marginTop: "4px", padding: "12px", background: ORANGE, color: "#fff", border: "none",
                                    borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                                }}>
                                    {savingAgent ? "Saving…" : "Save Agent"}
                                </button>
                            </form>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {agents.map((a) => (
                                <div key={a._id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{
                                        width: "38px", height: "38px", borderRadius: "50%", background: ORANGE_L,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "14px", fontWeight: "700", color: ORANGE, flexShrink: 0,
                                        cursor: "pointer",
                                    }}
                                        onClick={() => setLogAgent(a)}>
                                        {a.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setLogAgent(a)}>
                                        <p style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {a.name}
                                        </p>
                                        <p style={{ fontSize: "11px", color: GRAY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {a.vehicleType} · {a.phone}
                                        </p>
                                        <p style={{ fontSize: "11px", color: GRAY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {a.email}
                                        </p>
                                    </div>
                                    <div style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setLogAgent(a)}>
                                        <Badge status={a.status} map={AGENT_STATUS_COLORS} />
                                    </div>
                                    <button onClick={() => removeAgent(a._id)} style={{
                                        border: "none", background: "none", cursor: "pointer", padding: "8px", flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <i className="ti ti-trash" style={{ fontSize: "14px", color: GRAY }} aria-hidden />
                                    </button>
                                </div>
                            ))}
                            {agents.length === 0 && (
                                <p style={{ color: GRAY, fontSize: "13px", textAlign: "center", marginTop: "20px" }}>No agents added yet</p>
                            )}
                        </div>
                    </div>

                    {/* ── Deliveries ── */}
                    <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "18px" }}>
                        <SectionHeader title="Active Deliveries" />

                        {isMobile ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {deliveries.map((d) => (
                                    <DeliveryCard key={d._id} d={d} agents={agents} onAssign={assignAgent} />
                                ))}
                                {deliveries.length === 0 && (
                                    <p style={{ textAlign: "center", padding: "30px", color: GRAY, fontSize: "13px" }}>No deliveries yet</p>
                                )}
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                                            {["Order", "Address", "Agent", "Status", "Amount"].map(h => (
                                                <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveries.map((d) => (
                                            <tr key={d._id} style={{ borderBottom: "1px solid #fafaf8" }}>
                                                <td style={{ padding: "10px", fontWeight: "600", color: ORANGE }}>
                                                    #{d._id?.slice(-8).toUpperCase() || "—"}
                                                </td>
                                                <td style={{ padding: "10px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {d.deliveryAddress}
                                                </td>
                                                <td style={{ padding: "10px" }}>
                                                    {d.deliveryPartner ? (
                                                        d.deliveryPartner.name
                                                    ) : (
                                                        <select defaultValue="" onChange={(e) => assignAgent(d._id, e.target.value)}
                                                            style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #ddd", outline: "none" }}>
                                                            <option value="" disabled>Assign agent…</option>
                                                            {agents.filter(a => a.status === "Available").map(a => (
                                                                <option key={a._id} value={a._id}>{a.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                                <td style={{ padding: "10px" }}>
    <Badge status={d.orderStatus} map={ORDER_STATUS_COLORS} />
    {d.orderStatus === "Cancelled" && d.cancelReason && (
        <div style={{ fontSize: "11px", color: "#A32D2D", marginTop: "4px" }}>
            {d.cancelReason}
        </div>
    )}
</td>
                                                <td style={{ padding: "10px", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                    {rupee(d.totalAmount)}
                                                </td>
                                            </tr>
                                        ))}
                                        {deliveries.length === 0 && (
                                            <tr><td colSpan={5} style={{ textAlign: "center", padding: "30px", color: GRAY }}>No deliveries yet</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {logAgent && (
                <AgentLogModal agent={logAgent} onClose={() => setLogAgent(null)} />
            )}
        </div>
    );
}