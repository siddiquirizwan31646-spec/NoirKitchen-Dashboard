import { useState, useEffect, useRef } from "react";

const API       = import.meta.env.VITE_API_URL || "http://localhost:5000";
const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const ORANGE   = "#E07B39";
const ORANGE_L = "#fdf3ed";
const RED      = "#E24B4A";
const GREEN    = "#63992E";
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
const CATEGORIES = ["chef", "waiter", "manager", "bartender", "host", "kitchen"];

const CATEGORY_COLORS = {
  chef:      { bg: ORANGE_L,   text: ORANGE },
  waiter:    { bg: "#e8f4fd",  text: "#185FA5" },
  manager:   { bg: "#e8fdf0",  text: "#0F6E56" },
  bartender: { bg: "#f3e8fd",  text: "#6B21A8" },
  host:      { bg: "#FFF8E1",  text: "#BA7517" },
  kitchen:   { bg: "#EAF3DE",  text: "#3B6D11" },
};

const CATEGORY_ICONS = {
  chef: "ti-chef-hat", waiter: "ti-glass", manager: "ti-briefcase",
  bartender: "ti-bottle", host: "ti-star", kitchen: "ti-tools-kitchen-2",
};

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

/* ── ImgBB upload helper ── */
async function uploadToImgBB(file) {
  const fd = new FormData();
  fd.append("image", file);
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: fd });
  const data = await r.json();
  if (!data.success) throw new Error("ImgBB upload failed");
  return data.data.url;
}

/* ── Image Picker ── */
function ImagePicker({ value, onChange }) {
  const [mode, setMode]         = useState("url");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]   = useState(value || "");
  const fileRef = useRef();

  const handleUrl = (e) => { setPreview(e.target.value); onChange(e.target.value); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToImgBB(file);
      setPreview(url); onChange(url);
    } catch { alert("Image upload failed. Check your IMGBB_API_KEY."); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        {["url", "device"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "7px 16px", fontSize: "13px", borderRadius: "8px", cursor: "pointer",
            border: "1px solid #f0ece8", fontWeight: "600",
            background: mode === m ? ORANGE : "#fff",
            color: mode === m ? "#fff" : GRAY,
          }}>
            {m === "url" ? "🔗 URL" : "📁 Device"}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <input
          type="text"
          placeholder="Paste image URL…"
          value={preview}
          onChange={handleUrl}
          style={{ width: "100%", padding: "11px 12px", fontSize: "14px", border: "1px solid #f0ece8", borderRadius: "8px", outline: "none", boxSizing: "border-box" }}
        />
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: "2px dashed #f0ece8", borderRadius: "8px", padding: "24px 20px", textAlign: "center", cursor: "pointer", background: "#fafaf8" }}
        >
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          {uploading ? (
            <p style={{ fontSize: "14px", color: ORANGE, margin: 0 }}>Uploading…</p>
          ) : (
            <>
              <i className="ti ti-upload" style={{ fontSize: "26px", color: GRAY }} />
              <p style={{ fontSize: "13px", color: GRAY, margin: "8px 0 0" }}>Tap to select from your device</p>
            </>
          )}
        </div>
      )}

      {preview && (
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={preview} alt="preview"
            style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover", border: "1px solid #f0ece8" }}
            onError={e => e.target.style.display = "none"} />
          <span style={{ fontSize: "12px", color: GREEN }}>✓ Image ready</span>
          <button onClick={() => { setPreview(""); onChange(""); }}
            style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "13px", marginLeft: "auto" }}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Add / Edit Modal — bottom sheet on mobile ── */
function ChefModal({ chef, onClose, onSave, isMobile }) {
  const [form, setForm] = useState(chef || {
    name: "", role: "", tagline: "", story: "", image: "", experience: "", category: "chef",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.role || !form.tagline || !form.story || !form.image)
      return alert("Please fill all required fields including an image.");
    setSaving(true);
    try {
      const method = chef ? "PUT" : "POST";
      const url    = chef ? `${API}/api/chefs/${chef._id}` : `${API}/api/chefs`;
      const r = await fetch(url, authOpts({
  method,
  body: JSON.stringify({ ...form, experience: Number(form.experience) || 0 }),
}));
      if (r.ok) { const data = await r.json(); onSave(data.chef || data); }
      else alert("Failed to save.");
    } finally { setSaving(false); }
  };

  const sheetStyle = isMobile ? {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  } : {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
  };

  const panelStyle = isMobile ? {
    background: "#fff", borderRadius: "20px 20px 0 0", padding: "8px 20px 32px",
    width: "100%", maxHeight: "92vh", overflowY: "auto",
  } : {
    background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px",
    maxHeight: "90vh", overflowY: "auto",
  };

  const inputStyle = {
    width: "100%", padding: "11px 12px", fontSize: "14px",
    border: "1px solid #f0ece8", borderRadius: "8px", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={sheetStyle} onClick={onClose}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        {/* drag handle (mobile) */}
        {isMobile && <div style={{ width: "36px", height: "4px", background: "#e5e5e3", borderRadius: "2px", margin: "0 auto 16px" }} />}

        <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 20px" }}>
          {chef ? "Edit Staff Member" : "Add Staff Member"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { key: "name",       label: "Name *",                type: "text"   },
            { key: "role",       label: "Role *",                type: "text"   },
            { key: "tagline",    label: "Tagline *",             type: "text"   },
            { key: "experience", label: "Experience (years)",    type: "number" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px", fontWeight: "600" }}>
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key] || ""}
                onChange={e => set(f.key, e.target.value)}
                style={inputStyle}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px", fontWeight: "600" }}>Story *</label>
            <textarea
              value={form.story || ""}
              onChange={e => set("story", e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px", fontWeight: "600" }}>Category</label>
            <select
              value={form.category || "chef"}
              onChange={e => set("category", e.target.value)}
              style={{ ...inputStyle, background: "#fff", cursor: "pointer" }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px", fontWeight: "600" }}>
              Image * <span style={{ color: GRAY, fontWeight: "400", textTransform: "none" }}>(URL or upload)</span>
            </label>
            <ImagePicker value={form.image} onChange={v => set("image", v)} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px", marginTop: "22px" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, padding: "13px", background: ORANGE, color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : chef ? "Save Changes" : "Add Staff"}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "13px", background: "#f5f5f3", color: "#555", border: "none", borderRadius: "10px", fontSize: "14px", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop: Chef Table Row ── */
function ChefRow({ chef, onDelete, onEdit }) {
  const [open, setOpen] = useState(false);
  const cat    = CATEGORY_COLORS[chef.category] || { bg: "#f5f5f5", text: "#555" };
  const joined = new Date(chef.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <tr
        onClick={(e) => { if (e.defaultPrevented) return; setOpen(o => !o); }}
        style={{ borderBottom: open ? "none" : "1px solid #fafaf8", cursor: "pointer", background: open ? "#fffaf7" : "#fff" }}
      >
        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {chef.image ? (
              <img src={chef.image} alt={chef.name} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: ORANGE_L, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: ORANGE, flexShrink: 0 }}>
                {chef.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: 0, whiteSpace: "nowrap" }}>{chef.name}</p>
              <p style={{ fontSize: "11px", color: GRAY, margin: 0, whiteSpace: "nowrap" }}>{chef.role}</p>
            </div>
          </div>
        </td>
        <td style={{ padding: "12px 10px", fontSize: "12px", color: "#555", verticalAlign: "middle", maxWidth: "220px" }}>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chef.tagline}</div>
        </td>
        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
          <Badge label={chef.category} bg={cat.bg} text={cat.text} />
        </td>
        <td style={{ padding: "12px 10px", verticalAlign: "middle", fontWeight: "600", color: "#1a1a1a" }}>
          {chef.experience ? `${chef.experience} yr${chef.experience !== 1 ? "s" : ""}` : "—"}
        </td>
        <td style={{ padding: "12px 10px", color: GRAY, fontSize: "12px", whiteSpace: "nowrap", verticalAlign: "middle" }}>
          {joined}
        </td>
        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(chef); }}
              style={{ background: "none", border: "none", color: ORANGE, cursor: "pointer", fontSize: "14px", padding: 0 }} title="Edit">
              <i className="ti ti-edit" />
            </button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(chef._id); }}
              style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "14px", padding: 0 }} title="Delete">
              <i className="ti ti-trash" />
            </button>
            <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: "14px", color: GRAY }} />
          </div>
        </td>
      </tr>

      {open && (
        <tr style={{ borderBottom: "1px solid #fafaf8", background: "#fffaf7" }}>
          <td colSpan={6} style={{ padding: "0 12px 16px 12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "14px", paddingTop: "10px", alignItems: "start" }}>
              <img src={chef.image} alt={chef.name}
                style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover", border: "1px solid #f0ece8" }}
                onError={e => e.target.style.display = "none"} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px", padding: "12px 14px" }}>
                  <p style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px", fontWeight: "600" }}>Profile</p>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 2px" }}>{chef.name}</p>
                  <p style={{ fontSize: "12px", color: ORANGE, margin: "0 0 2px" }}>{chef.role}</p>
                  <p style={{ fontSize: "11px", color: GRAY, margin: "0 0 2px" }}>
                    {chef.experience ? `${chef.experience} years experience` : "Experience not listed"}
                  </p>
                  <p style={{ fontSize: "11px", color: GRAY, margin: 0, fontStyle: "italic" }}>"{chef.tagline}"</p>
                </div>
                <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px", padding: "12px 14px" }}>
                  <p style={{ fontSize: "11px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px", fontWeight: "600" }}>Story</p>
                  <p style={{ fontSize: "12px", color: "#555", margin: 0, lineHeight: "1.7" }}>{chef.story}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Mobile: Staff Card ── */
function StaffCard({ chef, onDelete, onEdit }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_COLORS[chef.category] || { bg: "#f5f5f5", text: "#555" };

  return (
    <div style={{
      background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px",
      overflow: "hidden", transition: "box-shadow 0.15s",
    }}>
      {/* Main row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }}
      >
        {/* Avatar */}
        {chef.image ? (
          <img src={chef.image} alt={chef.name}
            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #f0ece8" }} />
        ) : (
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: ORANGE_L, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "700", color: ORANGE, flexShrink: 0 }}>
            {chef.name?.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a" }}>{chef.name}</span>
            <Badge label={chef.category} bg={cat.bg} text={cat.text} />
          </div>
          <p style={{ fontSize: "12px", color: ORANGE, margin: "0 0 2px", fontWeight: "600" }}>{chef.role}</p>
          <p style={{ fontSize: "11px", color: GRAY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {chef.tagline}
          </p>
        </div>

        {/* Expand chevron */}
        <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: "16px", color: GRAY, flexShrink: 0 }} />
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: "1px solid #f5f5f3", padding: "14px 16px", background: "#fffaf7" }}>
          {/* Story */}
          {chef.story && (
            <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ fontSize: "10px", color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px", fontWeight: "600" }}>Story</p>
              <p style={{ fontSize: "13px", color: "#555", margin: 0, lineHeight: "1.6" }}>{chef.story}</p>
            </div>
          )}

          {/* Meta row */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
            {chef.experience > 0 && (
              <div style={{ background: ORANGE_L, borderRadius: "8px", padding: "8px 12px", flex: 1, textAlign: "center" }}>
                <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 2px" }}>Experience</p>
                <p style={{ fontSize: "15px", fontWeight: "700", color: ORANGE, margin: 0 }}>
                  {chef.experience} yr{chef.experience !== 1 ? "s" : ""}
                </p>
              </div>
            )}
            <div style={{ background: "#fafaf8", borderRadius: "8px", padding: "8px 12px", flex: 1, textAlign: "center", border: "1px solid #f0ece8" }}>
              <p style={{ fontSize: "10px", color: GRAY, margin: "0 0 2px" }}>Added</p>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: 0 }}>
                {new Date(chef.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(chef); }}
              style={{
                flex: 1, padding: "11px", background: ORANGE_L, color: ORANGE,
                border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <i className="ti ti-edit" /> Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(chef._id); }}
              style={{
                flex: 1, padding: "11px", background: "#FCEBEB", color: "#A32D2D",
                border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <i className="ti ti-trash" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function AllChefs() {
  const isMobile = useIsMobile();

  const [chefs, setChefs]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [page, setPage]                     = useState(1);
  const [modal, setModal]                   = useState(null);
  const [showSearch, setShowSearch]         = useState(false);

  useEffect(() => {
    fetch(`${API}/api/chefs`, authOpts())
      .then(r => r.ok ? r.json() : [])
      .then(data => setChefs(Array.isArray(data) ? data : data.chefs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search, categoryFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    const r = await fetch(`${API}/api/chefs/${id}`, authOpts({ method: "DELETE" }));
    if (r.ok) setChefs(prev => prev.filter(c => c._id !== id));
  };

  const handleSave = (saved) => {
    setChefs(prev => {
      const exists = prev.find(c => c._id === saved._id);
      return exists ? prev.map(c => c._id === saved._id ? saved : c) : [saved, ...prev];
    });
    setModal(null);
  };

  const filtered = chefs
    .filter(c => categoryFilter === "All" || c.category === categoryFilter)
    .filter(c => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return c.name?.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q) || c.tagline?.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageChefs  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statCards = [
  { key: "All",       label: "Total",      value: chefs.length, icon: "ti-users", bg: ORANGE_L, color: ORANGE },
  { key: "chef",       label: "Chefs",      value: chefs.filter(c => c.category === "chef").length, icon: "ti-chef-hat", bg: ORANGE_L, color: ORANGE },
  { key: "waiter",     label: "Waiters",    value: chefs.filter(c => c.category === "waiter").length, icon: "ti-glass", bg: "#e8f4fd", color: "#185FA5" },
  { key: "manager",    label: "Managers",   value: chefs.filter(c => c.category === "manager").length, icon: "ti-briefcase", bg: "#e8fdf0", color: "#0F6E56" },
  { key: "bartender",  label: "Bartenders", value: chefs.filter(c => c.category === "bartender").length, icon: "ti-bottle", bg: "#f3e8fd", color: "#6B21A8" },
  { key: "host",       label: "Hosts",      value: chefs.filter(c => c.category === "host").length, icon: "ti-star", bg: "#FFF8E1", color: "#BA7517" },
  { key: "kitchen",    label: "Kitchen",    value: chefs.filter(c => c.category === "kitchen").length, icon: "ti-tools-kitchen-2", bg: "#EAF3DE", color: "#3B6D11" },
];

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE, animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading staff…</p>
      </div>
    </div>
  );

  const pad = isMobile ? "16px" : "28px 32px";

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ padding: pad, maxWidth: "1400px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: isMobile ? "14px" : "20px" }}>
          <button onClick={() => window.location.href = "/admin"}
            style={{ background: "none", border: "none", color: GRAY, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
            <i className="ti ti-arrow-left" /> Back to Dashboard
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div>
              <h1 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 2px" }}>Staff & Chefs</h1>
              <p style={{ fontSize: "13px", color: GRAY, margin: 0 }}>
                {filtered.length} member{filtered.length !== 1 ? "s" : ""}
                {categoryFilter !== "All" && ` · ${categoryFilter}`}
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* Mobile: search icon toggle */}
              {isMobile && (
                <button
                  onClick={() => setShowSearch(s => !s)}
                  style={{
                    width: "40px", height: "40px", background: showSearch ? ORANGE : "#fff",
                    border: "1px solid #f0ece8", borderRadius: "10px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: showSearch ? "#fff" : GRAY, fontSize: "16px",
                  }}
                >
                  <i className="ti ti-search" />
                </button>
              )}
              <button
                onClick={() => setModal("add")}
                style={{
                  padding: isMobile ? "10px 14px" : "10px 18px",
                  background: ORANGE, color: "#fff", border: "none", borderRadius: "10px",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <i className="ti ti-plus" />
                {isMobile ? "Add" : "Add Staff"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Search (mobile: toggleable, desktop: always) ── */}
        {(!isMobile || showSearch) && (
          <div style={{ marginBottom: "14px" }}>
            <input
              type="text"
              placeholder="Search by name, role, or tagline…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus={isMobile}
              style={{
                width: "100%", padding: isMobile ? "12px 14px" : "10px 14px",
                fontSize: "14px", border: "1px solid #f0ece8", borderRadius: "10px",
                outline: "none", background: "#fff", boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* ── Summary stats ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(auto-fit, minmax(120px, 1fr))",
          gap: isMobile ? "8px" : "14px",
          marginBottom: isMobile ? "14px" : "24px",
          overflowX: isMobile ? "auto" : "visible",
        }}>
          {statCards.map((s, i) => (
  <div
    key={i}
    onClick={() => setCategoryFilter(s.key)}
    style={{
      background: "#fff", border: `1px solid ${categoryFilter === s.key ? ORANGE : "#f0ece8"}`,
                borderRadius: "12px", padding: isMobile ? "10px 8px" : "14px 16px",
                cursor: "pointer", transition: "border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start", gap: isMobile ? "4px" : "8px", marginBottom: isMobile ? "4px" : "8px" }}>
                <span style={{ width: isMobile ? "28px" : "30px", height: isMobile ? "28px" : "30px", borderRadius: "8px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: isMobile ? "13px" : "15px", color: s.color }} />
                </span>
                <span style={{ fontSize: "10px", color: GRAY, textAlign: isMobile ? "center" : "left" }}>{s.label}</span>
              </div>
              <p style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: "700", color: "#1a1a1a", margin: 0, textAlign: isMobile ? "center" : "left" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Mobile: Category pill filter strip ── */}
        {isMobile && (
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "14px", scrollbarWidth: "none" }}>
            <style>{`::-webkit-scrollbar{display:none}`}</style>
            {["All", ...CATEGORIES].map(c => {
              const active = categoryFilter === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  style={{
                    flexShrink: 0, padding: "7px 14px", borderRadius: "20px", border: "none",
                    background: active ? ORANGE : "#fff", color: active ? "#fff" : "#555",
                    fontSize: "12px", fontWeight: "600", cursor: "pointer",
                    boxShadow: active ? "none" : "0 0 0 1px #f0ece8",
                  }}
                >
                  {c === "All" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Desktop: category dropdown filter ── */}
        {!isMobile && (
          <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: "10px 14px", fontSize: "13px", border: "1px solid #f0ece8", borderRadius: "10px", outline: "none", background: "#fff", cursor: "pointer" }}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        )}

        {/* ── Desktop: Table ── */}
        {!isMobile && (
          <div style={{ background: "#fff", border: "1px solid #f0ece8", borderRadius: "14px", padding: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8" }}>
                    {["Staff Member", "Tagline", "Category", "Experience", "Added", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px", color: GRAY, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageChefs.map(chef => (
                    <ChefRow key={chef._id} chef={chef} onDelete={handleDelete} onEdit={c => setModal(c)} />
                  ))}
                  {pageChefs.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: GRAY }}>
                        No staff members match your filters
                      </td>
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

        {/* ── Mobile: Card list ── */}
        {isMobile && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pageChefs.map(chef => (
                <StaffCard key={chef._id} chef={chef} onDelete={handleDelete} onEdit={c => setModal(c)} />
              ))}
              {pageChefs.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: GRAY }}>
                  <i className="ti ti-users-off" style={{ fontSize: "36px", display: "block", marginBottom: "8px", color: "#ddd" }} />
                  No staff members match your filters
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "16px", padding: "12px 0" }}>
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                  disabled={page === 1}
                  style={{ flex: 1, padding: "12px", fontSize: "14px", borderRadius: "10px", border: "1px solid #f0ece8", background: "#fff", color: page === 1 ? "#ccc" : "#1a1a1a", cursor: page === 1 ? "default" : "pointer", fontWeight: "600" }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: "13px", color: GRAY, whiteSpace: "nowrap" }}>{page} / {totalPages}</span>
                <button
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                  disabled={page === totalPages}
                  style={{ flex: 1, padding: "12px", fontSize: "14px", borderRadius: "10px", border: "1px solid #f0ece8", background: "#fff", color: page === totalPages ? "#ccc" : "#1a1a1a", cursor: page === totalPages ? "default" : "pointer", fontWeight: "600" }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        <p style={{ fontSize: "12px", color: GRAY, textAlign: "center", marginTop: "14px" }}>
          <i className="ti ti-info-circle" style={{ marginRight: "4px" }} />
          {isMobile ? "Tap any card to expand details" : "Click any row to expand full details"} · Images via ImgBB are stored permanently
        </p>

      </div>

      {modal && (
        <ChefModal
          chef={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}