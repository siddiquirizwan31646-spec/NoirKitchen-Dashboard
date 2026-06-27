import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORANGE   = "#E07B39";
const ORANGE_L = "#fdf3ed";
const RED      = "#E24B4A";
const GREEN    = "#63992E";
const GRAY     = "#888";

const SPICE_LABELS = ["None", "Mild", "Medium", "Hot", "Extra Hot"];
const SPICE_COLORS = ["#aaa", GREEN, "#f59e0b", ORANGE, RED];

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
}

const rupee = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function SpiceBar({ level = 0 }) {
  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{
          width: "14px", height: "4px", borderRadius: "2px",
          background: i < level ? SPICE_COLORS[level] : "#f0ece8",
        }} />
      ))}
      <span style={{ fontSize: "10px", color: SPICE_COLORS[level], marginLeft: "4px", fontWeight: "600" }}>
        {SPICE_LABELS[level]}
      </span>
    </div>
  );
}

function Badge({ label, bg, color }) {
  return (
    <span style={{
      fontSize: "10px", fontWeight: "600", padding: "2px 8px",
      borderRadius: "20px", background: bg, color, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function MiniStat({ label, value, color = "#1a1a1a" }) {
  return (
    <div style={{
      background: "#fafaf8", borderRadius: "10px", padding: "10px 14px",
      border: "1px solid #f0ece8", flex: 1, minWidth: 0,
    }}>
      <p style={{ fontSize: "11px", color: GRAY, margin: "0 0 3px", whiteSpace: "nowrap" }}>{label}</p>
      <p style={{ fontSize: "22px", fontWeight: "800", color, margin: 0 }}>{value}</p>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: "36px", height: "20px", borderRadius: "10px",
        cursor: disabled ? "default" : "pointer",
        background: checked ? ORANGE : "#e5e5e3",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: "3px",
        left: checked ? "19px" : "3px",
        width: "14px", height: "14px", borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

function MenuImage({ src, name, size = 44 }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "10px",
        background: ORANGE_L, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: size * 0.45, flexShrink: 0,
      }}>
        🍽️
      </div>
    );
  }
  return (
    <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
  );
}

/* ─── ITEM MODAL ─────────────────────────────── */
const EMPTY_ITEM = {
  name: "", category: "", price: "", desc: "", ingredients: "",
  img: "", pairing: "", veg: true, vegan: false, spice: 0,
  chef: false, signature: false, featured: false, available: true,
  prepTime: "", rating: "", variants: [], addons: [],
};

function ItemModal({ item, onClose, onSave, isMobile }) {
  const [form, setForm]               = useState(item ? { ...EMPTY_ITEM, ...item } : { ...EMPTY_ITEM });
  const [saving, setSaving]           = useState(false);
  const [variantInput, setVariantInput] = useState({ label: "", price: "" });
  const [addonInput, setAddonInput]   = useState({ label: "", price: "" });
  const isEdit = !!item?._id;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    if (!form.name || !form.category || !form.price) return alert("Name, category and price are required.");
    setSaving(true);
    try {
      const url = isEdit ? `${API}/api/menu/${item._id}` : `${API}/api/menu`;
      const r = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (r.ok) { onSave(await r.json()); onClose(); }
      else alert("Failed to save item.");
    } finally { setSaving(false); }
  };

  const inputBase = {
    width: "100%", padding: "9px 10px", fontSize: "13px",
    border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none",
    boxSizing: "border-box", background: "#fff",
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <label style={{ fontSize: "11px", color: GRAY, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>
        {label}
      </label>
      <input
        type={type}
        value={form[key] ?? ""}
        placeholder={placeholder}
        onChange={e => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
        style={inputBase}
      />
    </div>
  );

  const toggleField = (label, key) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ fontSize: "13px", color: "#1a1a1a" }}>{label}</span>
      <Toggle checked={!!form[key]} onChange={v => set(key, v)} />
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1000, display: "flex",
      alignItems: isMobile ? "flex-end" : "center",
      justifyContent: "center",
      padding: isMobile ? 0 : "20px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: isMobile ? "20px 20px 0 0" : "16px",
        width: "100%",
        maxWidth: isMobile ? "100%" : "620px",
        maxHeight: isMobile ? "92vh" : "90vh",
        overflowY: "auto",
        padding: isMobile ? "20px 16px 32px" : "28px",
      }}>
        {/* drag handle on mobile */}
        {isMobile && (
          <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "#e5e5e3", margin: "0 auto 16px" }} />
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1a1a1a", margin: 0 }}>
            {isEdit ? "Edit Item" : "Add Item"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: GRAY, padding: "4px" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Basic */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            {field("Item Name *", "name", "text", "e.g. Paneer Tikka")}
            {field("Category *", "category", "text", "e.g. Starters")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: "12px" }}>
            {field("Price (₹) *", "price", "text", "299")}
            {field("Prep Time (min)", "prepTime", "number", "20")}
            {!isMobile && field("Rating (0–5)", "rating", "number", "4.5")}
          </div>
          {isMobile && field("Rating (0–5)", "rating", "number", "4.5")}
          {field("Description", "desc", "text", "A short description")}

          {[["Ingredients", "ingredients", "Paneer, spices, cream..."], ["Pairing Suggestion", "pairing", "Pairs well with..."]].map(([lbl, key, ph]) => (
            <div key={key}>
              <label style={{ fontSize: "11px", color: GRAY, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>{lbl}</label>
              <textarea value={form[key] ?? ""} onChange={e => set(key, e.target.value)} rows={2} placeholder={ph}
                style={{ ...inputBase, resize: "vertical", fontFamily: "inherit" }} />
            </div>
          ))}

          {field("Image URL", "img", "text", "https://...")}

          {/* Spice */}
          <div>
            <label style={{ fontSize: "11px", color: GRAY, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>Spice Level</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {SPICE_LABELS.map((lbl, i) => (
                <button key={i} onClick={() => set("spice", i)} style={{
                  flex: 1, padding: isMobile ? "8px 2px" : "6px 4px", borderRadius: "8px",
                  fontSize: isMobile ? "10px" : "11px", fontWeight: "600",
                  border: `1.5px solid ${form.spice === i ? SPICE_COLORS[i] : "#e5e5e3"}`,
                  background: form.spice === i ? (i === 0 ? "#f5f5f3" : SPICE_COLORS[i] + "18") : "#fff",
                  color: form.spice === i ? SPICE_COLORS[i] : GRAY, cursor: "pointer",
                }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px",
            background: "#fafaf8", borderRadius: "10px", padding: "14px 16px",
            border: "1px solid #f0ece8",
          }}>
            {toggleField("Vegetarian", "veg")}
            {toggleField("Vegan", "vegan")}
            {toggleField("Chef's Special", "chef")}
            {toggleField("Signature", "signature")}
            {toggleField("Featured", "featured")}
            {toggleField("Available", "available")}
          </div>

          {/* Variants */}
          {[
            { label: "Variants", key: "variants", inputState: variantInput, setInput: setVariantInput, ph: "e.g. Half" },
            { label: "Add-ons", key: "addons", inputState: addonInput, setInput: setAddonInput, ph: "e.g. Extra Cheese" },
          ].map(({ label, key, inputState, setInput, ph }) => (
            <div key={key}>
              <label style={{ fontSize: "11px", color: GRAY, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>{label}</label>
              {form[key].map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "#1a1a1a" }}>{v.label}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: ORANGE }}>₹{v.price}</span>
                  <button onClick={() => set(key, form[key].filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "16px" }}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px" }}>
                <input placeholder={ph} value={inputState.label}
                  onChange={e => setInput(p => ({ ...p, label: e.target.value }))}
                  style={{ flex: 2, padding: "8px 10px", fontSize: "12px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }} />
                <input placeholder="Price" value={inputState.price}
                  onChange={e => setInput(p => ({ ...p, price: e.target.value }))}
                  style={{ flex: 1, padding: "8px 10px", fontSize: "12px", border: "1px solid #e5e5e3", borderRadius: "8px", outline: "none" }} />
                <button
                  onClick={() => {
                    if (inputState.label && inputState.price) {
                      set(key, [...form[key], { ...inputState }]);
                      setInput({ label: "", price: "" });
                    }
                  }}
                  style={{ padding: "8px 12px", background: ORANGE_L, color: ORANGE, border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}>
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: isMobile ? "13px" : "11px", background: "#f5f5f3", color: "#555",
            border: "none", borderRadius: "10px", fontSize: "14px", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{
            flex: 2, padding: isMobile ? "13px" : "11px", background: ORANGE, color: "#fff",
            border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700",
            cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── DELETE CONFIRM ─────────────────────────── */
function DeleteConfirm({ item, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    try {
      const r = await fetch(`${API}/api/menu/${item._id}`, { method: "DELETE", credentials: "include" });
      if (r.ok) { onConfirm(item._id); onClose(); }
      else alert("Failed to delete.");
    } finally { setDeleting(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "14px", padding: "28px", maxWidth: "360px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <i className="ti ti-trash" style={{ fontSize: "22px", color: RED }} />
        </div>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px" }}>Delete Item?</h3>
        <p style={{ fontSize: "13px", color: GRAY, margin: "0 0 24px" }}>
          "<strong>{item.name}</strong>" will be permanently removed from the menu.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#f5f5f3", border: "none", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
          <button onClick={confirm} disabled={deleting} style={{ flex: 1, padding: "10px", background: RED, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────── */
export default function MenuPage() {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterVeg, setFilterVeg]   = useState("All");
  const [sortBy, setSortBy]         = useState("name");
  const [modalItem, setModalItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [view, setView]             = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch(`${API}/api/menu`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setItems(Array.isArray(data) ? data : data.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(items.map(m => m.category).filter(Boolean)))];

  const filtered = items
    .filter(m => {
      if (search && !m.name?.toLowerCase().includes(search.toLowerCase()) &&
          !m.category?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat !== "All" && m.category !== filterCat) return false;
      if (filterStatus === "Available" && !m.available) return false;
      if (filterStatus === "Unavailable" && m.available) return false;
      if (filterVeg === "Veg" && !m.veg) return false;
      if (filterVeg === "Non-Veg" && m.veg) return false;
      if (filterVeg === "Vegan" && !m.vegan) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name")   return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "price")  return Number(a.price) - Number(b.price);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const stats = {
    total: items.length,
    available: items.filter(m => m.available).length,
    veg: items.filter(m => m.veg).length,
    chef: items.filter(m => m.chef).length,
    featured: items.filter(m => m.featured).length,
    signature: items.filter(m => m.signature).length,
  };

  const toggleAvailable = async (item) => {
    setTogglingId(item._id);
    try {
      const r = await fetch(`${API}/api/menu/${item._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...item, available: !item.available }),
      });
      if (r.ok) setItems(prev => prev.map(m => m._id === item._id ? { ...m, available: !m.available } : m));
    } finally { setTogglingId(null); }
  };

  const handleSave = (saved) => {
    setItems(prev => {
      const exists = prev.find(m => m._id === saved._id);
      return exists ? prev.map(m => m._id === saved._id ? saved : m) : [saved, ...prev];
    });
  };

  const handleDelete = (id) => setItems(prev => prev.filter(m => m._id !== id));

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE, animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading menu…</p>
      </div>
    </div>
  );

  const selectStyle = {
    padding: "8px 28px 8px 10px", fontSize: "12px", fontWeight: "500",
    border: "1px solid #f0ece8", borderRadius: "10px", outline: "none",
    background: "#fff", color: "#1a1a1a", cursor: "pointer",
    appearance: "none", WebkitAppearance: "none", width: "100%",
  };

  const pad = isMobile ? "16px" : "28px 32px";

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ padding: pad, maxWidth: "1400px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>Menu</h1>
            <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>
              {stats.available} of {stats.total} items live
            </p>
          </div>
          <button
            onClick={() => setModalItem(false)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: ORANGE, color: "#fff", border: "none",
              borderRadius: "10px", padding: isMobile ? "10px 14px" : "10px 18px",
              fontSize: "14px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            <i className="ti ti-plus" aria-hidden />
            {isMobile ? "Add" : "Add Item"}
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)",
          gap: "10px",
          marginBottom: "20px",
        }}>
          <MiniStat label="Total Items"   value={stats.total} />
          <MiniStat label="Available"     value={stats.available}              color={GREEN} />
          <MiniStat label="Unavailable"   value={stats.total - stats.available} color={RED} />
          <MiniStat label="Veg"           value={stats.veg}                    color={GREEN} />
          <MiniStat label="Chef's Special" value={stats.chef}                  color={ORANGE} />
          <MiniStat label="Featured"      value={stats.featured}               color="#7c3aed" />
        </div>

        {/* ── Category Pills (scrollable on mobile) ── */}
        <div style={{
          display: "flex", gap: "8px", marginBottom: "16px",
          overflowX: isMobile ? "auto" : "visible",
          flexWrap: isMobile ? "nowrap" : "wrap",
          paddingBottom: isMobile ? "4px" : 0,
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
              border: `1.5px solid ${filterCat === cat ? ORANGE : "#e5e5e3"}`,
              background: filterCat === cat ? ORANGE_L : "#fff",
              color: filterCat === cat ? ORANGE : "#555",
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* ── Main Card ── */}
        <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: isMobile ? "14px" : "20px" }}>

          {/* Search row */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <i className="ti ti-search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: GRAY, pointerEvents: "none" }} aria-hidden />
              <input
                type="text"
                placeholder="Search dishes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "9px 10px 9px 32px", fontSize: "13px",
                  border: "1px solid #f0ece8", borderRadius: "10px", outline: "none",
                  background: "#fafaf8", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Mobile: filter toggle button */}
            {isMobile ? (
              <button
                onClick={() => setShowFilters(v => !v)}
                style={{
                  padding: "9px 12px", border: `1px solid ${showFilters ? ORANGE : "#f0ece8"}`,
                  borderRadius: "10px", background: showFilters ? ORANGE_L : "#fff",
                  color: showFilters ? ORANGE : GRAY, cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", gap: "4px", fontSize: "13px",
                }}
              >
                <i className="ti ti-adjustments-horizontal" aria-hidden /> Filters
              </button>
            ) : (
              /* Desktop: inline filters */
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {[
                  { val: filterStatus, set: setFilterStatus, opts: ["All", "Available", "Unavailable"] },
                  { val: filterVeg,    set: setFilterVeg,    opts: ["All", "Veg", "Non-Veg", "Vegan"] },
                  { val: sortBy,       set: setSortBy,        opts: [["name","Name A–Z"],["price","Price ↑"],["rating","Rating ↓"],["newest","Newest"]] },
                ].map(({ val, set: setFn, opts }, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <select value={val} onChange={e => setFn(e.target.value)} style={{ ...selectStyle, width: "auto", paddingRight: "28px" }}>
                      {opts.map(o => Array.isArray(o)
                        ? <option key={o[0]} value={o[0]}>{o[1]}</option>
                        : <option key={o}>{o}</option>
                      )}
                    </select>
                    <i className="ti ti-chevron-down" style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: GRAY, pointerEvents: "none" }} aria-hidden />
                  </div>
                ))}

                {/* View toggle — desktop only */}
                <div style={{ display: "flex", border: "1px solid #f0ece8", borderRadius: "10px", overflow: "hidden" }}>
                  {[["table", "ti-layout-list"], ["grid", "ti-layout-grid"]].map(([v, icon]) => (
                    <button key={v} onClick={() => setView(v)} style={{
                      padding: "7px 12px", border: "none", cursor: "pointer",
                      background: view === v ? ORANGE_L : "#fff",
                      color: view === v ? ORANGE : GRAY,
                    }}>
                      <i className={`ti ${icon}`} style={{ fontSize: "15px" }} aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile filter panel */}
          {isMobile && showFilters && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "14px", background: "#fafaf8", borderRadius: "10px", marginBottom: "12px", border: "1px solid #f0ece8" }}>
              {[
                { label: "Status", val: filterStatus, set: setFilterStatus, opts: ["All", "Available", "Unavailable"] },
                { label: "Diet",   val: filterVeg,    set: setFilterVeg,    opts: ["All", "Veg", "Non-Veg", "Vegan"] },
                { label: "Sort",   val: sortBy,       set: setSortBy,       opts: [["name","Name A–Z"],["price","Price ↑"],["rating","Rating ↓"],["newest","Newest"]] },
              ].map(({ label, val, set: setFn, opts }) => (
                <div key={label} style={{ position: "relative" }}>
                  <label style={{ fontSize: "10px", color: GRAY, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>{label}</label>
                  <select value={val} onChange={e => setFn(e.target.value)} style={selectStyle}>
                    {opts.map(o => Array.isArray(o)
                      ? <option key={o[0]} value={o[0]}>{o[1]}</option>
                      : <option key={o}>{o}</option>
                    )}
                  </select>
                  <i className="ti ti-chevron-down" style={{ position: "absolute", right: "8px", bottom: "10px", fontSize: "12px", color: GRAY, pointerEvents: "none" }} aria-hidden />
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: "12px", color: GRAY, margin: "0 0 14px" }}>
            Showing {filtered.length} of {items.length} items
          </p>

          {/* ── TABLE VIEW (desktop only) ── */}
          {!isMobile && view === "table" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                    {["Item", "Category", "Price", "Spice", "Tags", "Available", "Actions"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px", color: GRAY, fontSize: "14px" }}>
                      <div>🍽️</div><p style={{ marginTop: "8px" }}>No items found</p>
                    </td></tr>
                  ) : filtered.map((m) => (
                    <tr key={m._id} style={{ borderBottom: "1px solid #fafaf8" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafaf8"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <MenuImage src={m.img} name={m.name} size={40} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{m.name}</p>
                            <p style={{ fontSize: "11px", color: GRAY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{m.desc}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ fontSize: "12px", color: "#555", background: "#f5f5f3", padding: "3px 10px", borderRadius: "20px" }}>{m.category}</span>
                      </td>
                      <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a" }}>{m.price ? `₹${m.price}` : "—"}</span>
                        {m.variants?.length > 0 && <span style={{ fontSize: "10px", color: GRAY, display: "block" }}>+{m.variants.length} variant{m.variants.length !== 1 ? "s" : ""}</span>}
                      </td>
                      <td style={{ padding: "12px 12px" }}><SpiceBar level={m.spice || 0} /></td>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: m.veg ? "#EAF3DE" : "#FCEBEB", color: m.veg ? "#3B6D11" : "#A32D2D", fontWeight: "600" }}>{m.veg ? "Veg" : "Non-Veg"}</span>
                          {m.vegan     && <Badge label="Vegan"     bg="#e8f4fd"  color="#185FA5" />}
                          {m.chef      && <Badge label="Chef's"    bg={ORANGE_L} color={ORANGE} />}
                          {m.signature && <Badge label="Signature" bg="#f5f0ff"  color="#7c3aed" />}
                          {m.featured  && <Badge label="Featured"  bg="#FFF8E1"  color="#BA7517" />}
                        </div>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <Toggle checked={m.available} onChange={() => toggleAvailable(m)} disabled={togglingId === m._id} />
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => setModalItem(m)} style={{ width: "30px", height: "30px", borderRadius: "8px", background: ORANGE_L, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Edit">
                            <i className="ti ti-edit" style={{ fontSize: "14px", color: ORANGE }} aria-hidden />
                          </button>
                          <button onClick={() => setDeleteItem(m)} style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#FCEBEB", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete">
                            <i className="ti ti-trash" style={{ fontSize: "14px", color: RED }} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── GRID VIEW (always on mobile, togglable on desktop) ── */}
          {(isMobile || view === "grid") && (
            filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: GRAY }}>
                <div style={{ fontSize: "32px" }}>🍽️</div>
                <p style={{ marginTop: "8px", fontSize: "14px" }}>No items found</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))",
                gap: isMobile ? "10px" : "16px",
              }}>
                {filtered.map((m) => (
                  <div key={m._id} style={{ border: "1px solid #f0ece8", borderRadius: "14px", overflow: "hidden", background: "#fff" }}>
                    {/* Image */}
                    <div style={{ width: "100%", height: isMobile ? "120px" : "140px", background: ORANGE_L, overflow: "hidden", position: "relative" }}>
                      {m.img ? (
                        <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>🍽️</div>
                      )}
                      {!m.available && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#fff", background: "rgba(0,0,0,0.5)", padding: "4px 12px", borderRadius: "20px" }}>Unavailable</span>
                        </div>
                      )}
                      <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {m.chef      && <Badge label="Chef's"    bg={ORANGE}    color="#fff" />}
                        {m.featured  && <Badge label="Featured"  bg="#7c3aed"   color="#fff" />}
                        {m.signature && <Badge label="Signature" bg="#1a1a1a"   color="#fff" />}
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: isMobile ? "12px" : "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                          <span style={{ fontSize: "11px", color: "#555", background: "#f5f5f3", padding: "2px 8px", borderRadius: "20px" }}>{m.category}</span>
                        </div>
                        <span style={{ fontSize: "15px", fontWeight: "800", color: ORANGE, marginLeft: "8px", whiteSpace: "nowrap" }}>{m.price ? `₹${m.price}` : "—"}</span>
                      </div>

                      {m.desc && (
                        <p style={{ fontSize: "12px", color: GRAY, margin: "8px 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{m.desc}</p>
                      )}

                      <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                        {m.rating > 0 && <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: "600" }}>★ {m.rating}</span>}
                        {m.prepTime > 0 && <span style={{ fontSize: "12px", color: GRAY }}><i className="ti ti-clock" style={{ marginRight: "3px" }} aria-hidden />{m.prepTime}m</span>}
                      </div>

                      <SpiceBar level={m.spice || 0} />

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                        <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: m.veg ? "#EAF3DE" : "#FCEBEB", color: m.veg ? "#3B6D11" : "#A32D2D", fontWeight: "600" }}>
                          {m.veg ? "Veg" : "Non-Veg"}
                        </span>
                        {m.vegan && <Badge label="Vegan" bg="#e8f4fd" color="#185FA5" />}
                        {m.variants?.length > 0 && <span style={{ fontSize: "10px", color: GRAY, marginLeft: "auto" }}>{m.variants.length} variant{m.variants.length !== 1 ? "s" : ""}</span>}
                      </div>

                      {/* Footer */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f0ece8" }}>
                        <Toggle checked={m.available} onChange={() => toggleAvailable(m)} disabled={togglingId === m._id} />
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => setModalItem(m)} style={{ width: isMobile ? "36px" : "30px", height: isMobile ? "36px" : "30px", borderRadius: "8px", background: ORANGE_L, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="ti ti-edit" style={{ fontSize: isMobile ? "16px" : "14px", color: ORANGE }} aria-hidden />
                          </button>
                          <button onClick={() => setDeleteItem(m)} style={{ width: isMobile ? "36px" : "30px", height: isMobile ? "36px" : "30px", borderRadius: "8px", background: "#FCEBEB", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="ti ti-trash" style={{ fontSize: isMobile ? "16px" : "14px", color: RED }} aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "16px", marginTop: "24px", borderTop: "1px solid #f0ece8", fontSize: "12px", color: GRAY, flexWrap: "wrap", gap: "6px" }}>
          <span>© 2026 Noir Kitchen. All rights reserved.</span>
          <span>Made with for Noir Kitchen</span>
        </div>
      </div>

      {/* Modals */}
      {modalItem !== null && (
        <ItemModal item={modalItem === false ? null : modalItem} onClose={() => setModalItem(null)} onSave={handleSave} isMobile={isMobile} />
      )}
      {deleteItem && (
        <DeleteConfirm item={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}