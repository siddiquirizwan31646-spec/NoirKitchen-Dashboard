import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/* ─── colour tokens ─── */
const ORANGE = "#E07B39";
const ORANGE_L = "#fdf3ed";
const GRAY = "#888";
const GREEN = "#63992E";
const RED = "#E24B4A";
const BLUE = "#2F7BD1";
const YELLOW = "#C99A1E";

const TYPE_STYLES = {
  info:    { color: BLUE,   bg: "#eaf2fb", icon: "ti-info-circle" },
  success: { color: GREEN,  bg: "#eef6e6", icon: "ti-circle-check" },
  warning: { color: YELLOW, bg: "#fbf3e0", icon: "ti-alert-triangle" },
  error:   { color: RED,    bg: "#fbeaea", icon: "ti-alert-circle" },
};

const EMPTY_NOTIFICATION = {
  title: "", message: "", type: "info", icon: "", emoji: "",
  imageUrl: "", link: "", isActive: true, expiryDate: "", priority: 0,
};

const EMOJIS = [
  "🍽️","🍕","🍔","🌮","🥗","🍜","🍣","🥩","🍷","☕",
  "🎉","⭐","🔥","❤️","✨","🏆","👨‍🍳","🌟","💫","🎊",
  "🥂","🍾","🎁","🌹","💎","🙌","👌","😋","🤤","🍰",
];

const ICONS = [
  "ti-star","ti-heart","ti-flame","ti-trophy","ti-crown",
  "ti-award","ti-gift","ti-sparkles","ti-bell","ti-bell-ringing",
  "ti-discount","ti-clock","ti-map-pin","ti-phone","ti-mail",
  "ti-info-circle","ti-alert-triangle","ti-circle-check","ti-alert-circle","ti-speakerphone",
];

async function uploadToImgBB(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: fd });
  const data = await res.json();
  if (data.success) return data.data.url;
  throw new Error("ImgBB upload failed");
}

async function uploadFromClipboard(e) {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (const item of items) {
    if (item.type.startsWith("image/")) return await uploadToImgBB(item.getAsFile());
  }
  return null;
}

function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ─── toast (centered, mobile-friendly) ─── */
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
      background: type === "error" ? RED : "#1a1a1a",
      color: "#fff", padding: "12px 20px", borderRadius: "12px",
      fontSize: "13px", fontWeight: "600", zIndex: 9999,
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      display: "flex", alignItems: "center", gap: "8px",
      animation: "slideUp 0.2s ease",
      whiteSpace: "nowrap", maxWidth: "calc(100vw - 32px)",
    }}>
      <i className={`ti ${type === "error" ? "ti-x" : "ti-check"}`}
        style={{ color: type === "error" ? "#ffaaaa" : GREEN, flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{msg}</span>
    </div>
  );
}

/* ─── NOTIFICATION EDITOR ─── */
function NotificationEditor({ notif, index, onChange, onSave, onDelete, saving, deleting, isNew }) {
  const [open, setOpen]           = useState(isNew);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showIcon, setShowIcon]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef();
  const textRef = useRef();

  const typeStyle = TYPE_STYLES[notif.type] || TYPE_STYLES.info;

  const handlePaste = async (e) => {
    const url = await uploadFromClipboard(e);
    if (url) onChange(notif._id, "imageUrl", url);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToImgBB(file);
      onChange(notif._id, "imageUrl", url);
    } catch {
      alert("Image upload failed. Check your VITE_IMGBB_API_KEY.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const insertEmoji = (em) => {
    const el = textRef.current;
    if (!el) { onChange(notif._id, "message", notif.message + em); setShowEmoji(false); return; }
    const s = el.selectionStart, e2 = el.selectionEnd;
    onChange(notif._id, "message", notif.message.slice(0, s) + em + notif.message.slice(e2));
    setShowEmoji(false);
    setTimeout(() => { el.selectionStart = el.selectionEnd = s + em.length; el.focus(); }, 0);
  };

  const selectIcon = (ic) => {
    onChange(notif._id, "icon", notif.icon === ic ? "" : ic);
    setShowIcon(false);
  };

  const handleDelete = () => {
    if (notif._isNew || confirmDel) {
      onDelete(notif);
      setConfirmDel(false);
    } else {
      setConfirmDel(true);
      setTimeout(() => setConfirmDel(false), 3000);
    }
  };

  const hasFill = notif.title || notif.message;

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${open ? ORANGE : "#f0ece8"}`,
      borderRadius: "16px", overflow: "hidden",
      boxShadow: open ? "0 4px 20px rgba(224,123,57,0.10)" : "0 2px 8px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s, border-color 0.2s",
    }}>

      {/* ── accordion header ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", background: open ? ORANGE_L : "#fff",
          padding: "14px 16px", border: "none",
          borderBottom: open ? "1px solid #f0ece8" : "none",
          display: "flex", alignItems: "center", gap: "10px",
          cursor: "pointer", textAlign: "left", minHeight: "58px",
          transition: "background 0.2s",
        }}
      >
        {/* type colour dot */}
        <div style={{
          width: "10px", height: "10px", borderRadius: "50%",
          background: typeStyle.color, flexShrink: 0,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {notif.title || (isNew ? "New Notification" : "Untitled")}
            </span>
            {isNew && (
              <span style={{ fontSize: "10px", fontWeight: "700", color: ORANGE,
                background: ORANGE_L, padding: "2px 7px", borderRadius: "20px", flexShrink: 0 }}>
                NEW
              </span>
            )}
            {!notif.isActive && !isNew && (
              <span style={{ fontSize: "10px", fontWeight: "700", color: GRAY,
                background: "#eee", padding: "2px 7px", borderRadius: "20px", flexShrink: 0 }}>
                OFF
              </span>
            )}
          </div>
          {!open && notif.message && (
            <span style={{ fontSize: "11px", color: GRAY, display: "block",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }}>
              {notif.message}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {hasFill && (
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: GREEN }} />
          )}
          <i className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"}`}
            style={{ fontSize: "16px", color: GRAY }} />
        </div>
      </button>

      {/* ── expandable body ── */}
      {open && (
        <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* title */}
          <div>
            <label style={L}>Title</label>
            <input
              type="text"
              value={notif.title}
              onChange={(e) => onChange(notif._id, "title", e.target.value)}
              placeholder="e.g. Flash Sale Live Now!"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = ORANGE}
              onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
            />
          </div>

          {/* type selector — scrollable row on mobile */}
          <div>
            <label style={L}>Type</label>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", WebkitOverflowScrolling: "touch" }}>
              {Object.entries(TYPE_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => onChange(notif._id, "type", key)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", flexShrink: 0,
                    background: notif.type === key ? style.bg : "#f5f5f3",
                    border: `1.5px solid ${notif.type === key ? style.color : "transparent"}`,
                    borderRadius: "10px", padding: "10px 14px", cursor: "pointer",
                    fontSize: "13px", fontWeight: "700",
                    color: notif.type === key ? style.color : "#555",
                    textTransform: "capitalize", minHeight: "44px",
                  }}
                >
                  <i className={`ti ${style.icon}`} style={{ fontSize: "16px" }} />
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* message */}
          <div>
            <label style={L}>Message</label>
            <div style={{ position: "relative" }}>
              <textarea
                ref={textRef}
                value={notif.message}
                onChange={(e) => onChange(notif._id, "message", e.target.value)}
                placeholder="Notification body text…"
                rows={4}
                style={{ ...inputStyle, resize: "vertical", paddingBottom: "44px" }}
                onFocus={(e) => e.target.style.borderColor = ORANGE}
                onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
              />
              <div style={{ position: "absolute", bottom: "10px", left: "10px", display: "flex", gap: "8px" }}>
                <button onClick={() => { setShowEmoji(!showEmoji); setShowIcon(false); }} style={inlineBtn}>
                  😊 <span style={{ fontSize: "11px", fontWeight: "700", color: "#555" }}>Emoji</span>
                </button>
                <button onClick={() => { setShowIcon(!showIcon); setShowEmoji(false); }} style={inlineBtn}>
                  <i className="ti ti-icons" style={{ fontSize: "14px", color: ORANGE }} />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: ORANGE }}>Icon</span>
                </button>
              </div>
            </div>

            {showEmoji && (
              <div style={pickerBox}>
                <p style={pickerLabel}>Tap to insert</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {EMOJIS.map((em) => (
                    <button key={em} onClick={() => insertEmoji(em)} style={emojiBtn}>{em}</button>
                  ))}
                </div>
              </div>
            )}

            {showIcon && (
              <div style={pickerBox}>
                <p style={pickerLabel}>Pick icon — saved as class name</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {ICONS.map((ic) => (
                    <button key={ic} onClick={() => selectIcon(ic)} title={ic} style={{
                      background: notif.icon === ic ? ORANGE_L : "#f5f5f3",
                      border: `1.5px solid ${notif.icon === ic ? ORANGE : "transparent"}`,
                      borderRadius: "8px", padding: "9px 10px", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                      minWidth: "52px", minHeight: "52px",
                    }}>
                      <i className={`ti ${ic}`} style={{ fontSize: "20px", color: notif.icon === ic ? ORANGE : "#555" }} />
                      <span style={{ fontSize: "9px", color: GRAY, textAlign: "center", lineHeight: 1.2 }}>
                        {ic.replace("ti-", "")}
                      </span>
                    </button>
                  ))}
                </div>
                {notif.icon && (
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <code style={{ fontSize: "11px", background: ORANGE_L, color: ORANGE, padding: "3px 8px", borderRadius: "6px" }}>{notif.icon}</code>
                    <button onClick={() => onChange(notif._id, "icon", "")} style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "12px", padding: "4px 0" }}>
                      <i className="ti ti-x" /> Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* standalone emoji */}
          <div>
            <label style={L}>Standalone Emoji</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="text"
                value={notif.emoji}
                onChange={(e) => onChange(notif._id, "emoji", e.target.value)}
                placeholder="e.g. 🔥"
                style={{ ...inputStyle, fontSize: "22px" }}
                onFocus={(e) => e.target.style.borderColor = ORANGE}
                onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
              />
              {notif.emoji && (
                <button onClick={() => onChange(notif._id, "emoji", "")} style={clearBtn}>
                  <i className="ti ti-x" />
                </button>
              )}
            </div>
          </div>

          {/* image upload */}
          <div>
            <label style={L}>Image <span style={{ fontWeight: "400", textTransform: "none", letterSpacing: 0, color: GRAY }}>— paste or upload</span></label>

            {notif.imageUrl ? (
              <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden" }}>
                <img src={notif.imageUrl} alt="preview" style={{ width: "100%", maxHeight: "180px", objectFit: "cover", display: "block" }} />
                <button
                  onClick={() => onChange(notif._id, "imageUrl", "")}
                  style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <i className="ti ti-trash" /> Remove
                </button>
              </div>
            ) : (
              <div onPaste={handlePaste} style={{ border: "2px dashed #e5e5e3", borderRadius: "12px", padding: "20px", background: "#fafaf8", textAlign: "center" }}>
                <i className="ti ti-photo-up" style={{ fontSize: "28px", color: "#ccc" }} />
                <p style={{ fontSize: "12px", color: GRAY, margin: "6px 0 0", lineHeight: 1.5 }}>
                  <strong style={{ color: "#555" }}>Paste screenshot</strong> (Ctrl+V / ⌘V)<br />or use buttons below
                </p>
              </div>
            )}

            <input
              type="url" inputMode="url"
              value={notif.imageUrl}
              onChange={(e) => onChange(notif._id, "imageUrl", e.target.value)}
              placeholder="Or paste image URL…"
              style={{ ...inputStyle, marginTop: "10px", fontSize: "13px" }}
              onFocus={(e) => e.target.style.borderColor = ORANGE}
              onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
            />

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current.click()} disabled={uploading} style={uploadBtn(uploading)}>
              <i className={`ti ${uploading ? "ti-loader-2" : "ti-upload"}`} style={{ fontSize: "16px" }} />
              {uploading ? "Uploading…" : "Upload from Device / Camera"}
            </button>
          </div>

          {/* link */}
          <div>
            <label style={L}>Link <span style={{ fontWeight: "400", textTransform: "none", letterSpacing: 0, color: GRAY }}>— optional</span></label>
            <input
              type="url" inputMode="url"
              value={notif.link}
              onChange={(e) => onChange(notif._id, "link", e.target.value)}
              placeholder="/menu or https://…"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = ORANGE}
              onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
            />
          </div>

          {/* priority + expiry — stack on mobile */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={L}>Priority</label>
              <input
                type="number" inputMode="numeric"
                value={notif.priority}
                onChange={(e) => onChange(notif._id, "priority", Number(e.target.value) || 0)}
                placeholder="0"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = ORANGE}
                onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
              />
            </div>
            <div>
              <label style={L}>Expiry <span style={{ fontWeight: "400", textTransform: "none", letterSpacing: 0 }}>— opt.</span></label>
              <input
                type="datetime-local"
                value={toInputDate(notif.expiryDate)}
                onChange={(e) => onChange(notif._id, "expiryDate", e.target.value ? new Date(e.target.value).toISOString() : "")}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = ORANGE}
                onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
              />
            </div>
          </div>

          {/* active toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafaf8", border: "1px solid #f0ece8", borderRadius: "12px", padding: "12px 16px", minHeight: "52px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>
              Active — show on live site
            </span>
            <button
              onClick={() => onChange(notif._id, "isActive", !notif.isActive)}
              style={{ width: "48px", height: "28px", borderRadius: "20px", background: notif.isActive ? GREEN : "#ddd", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
            >
              <span style={{
                position: "absolute", top: "4px",
                left: notif.isActive ? "24px" : "4px",
                width: "20px", height: "20px", borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              }} />
            </button>
          </div>

          {/* live preview */}
          <div style={{ borderTop: "1px dashed #f0ece8", paddingTop: "14px" }}>
            <p style={pickerLabel}>Preview</p>
            <div style={{ background: typeStyle.bg, border: `1px solid ${typeStyle.color}33`, borderRadius: "12px", padding: "14px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
              {notif.imageUrl ? (
                <img src={notif.imageUrl} alt="" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0, background: `${typeStyle.color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className={`ti ${notif.icon || typeStyle.icon}`} style={{ fontSize: "18px", color: typeStyle.color }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                  <strong style={{ fontSize: "14px", color: "#1a1a1a" }}>{notif.title || "Untitled notification"}</strong>
                  {notif.emoji && <span style={{ fontSize: "16px" }}>{notif.emoji}</span>}
                </div>
                {notif.message && (
                  <p style={{ fontSize: "13px", color: "#444", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{notif.message}</p>
                )}
                {notif.link && (
                  <span style={{ fontSize: "11px", color: typeStyle.color, fontWeight: "600", display: "inline-block", marginTop: "6px" }}>
                    <i className="ti ti-link" style={{ marginRight: "4px" }} />{notif.link}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* action buttons — full width, stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => onSave(notif)}
              disabled={saving}
              style={{
                background: ORANGE, color: "#fff", border: "none",
                borderRadius: "12px", padding: "15px",
                fontSize: "15px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: "0 4px 14px rgba(224,123,57,0.25)", minHeight: "50px",
              }}
            >
              <i className="ti ti-device-floppy" style={{ fontSize: "18px" }} />
              {saving ? "Saving…" : isNew ? "Create Notification" : "Save Changes"}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                background: confirmDel ? RED : "none",
                color: confirmDel ? "#fff" : RED,
                border: `1.5px solid ${confirmDel ? RED : "rgba(226,75,74,0.35)"}`,
                borderRadius: "12px", padding: "13px",
                fontSize: "14px", fontWeight: "700", cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "all 0.2s", minHeight: "48px",
              }}
            >
              <i className={`ti ${deleting ? "ti-loader-2" : "ti-trash"}`} style={{ fontSize: "16px" }} />
              {deleting ? "Deleting…" : confirmDel ? "Tap again to confirm delete" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── shared micro styles ─── */
const L = {
  fontSize: "11px", fontWeight: "700", color: GRAY,
  textTransform: "uppercase", letterSpacing: "0.6px",
  display: "block", marginBottom: "8px",
};
const inputStyle = {
  width: "100%", boxSizing: "border-box",
  padding: "12px 14px", fontSize: "15px",
  border: "1.5px solid #f0ece8", borderRadius: "12px",
  outline: "none", fontFamily: "inherit", color: "#1a1a1a",
  lineHeight: 1.5, transition: "border-color 0.2s",
  WebkitAppearance: "none",
};
const inlineBtn = {
  background: "#f5f5f3", border: "none", borderRadius: "8px",
  padding: "6px 10px", cursor: "pointer", fontSize: "14px",
  display: "flex", alignItems: "center", gap: "4px", minHeight: "36px",
};
const pickerBox = {
  marginTop: "8px", background: "#fff", border: "1px solid #f0ece8",
  borderRadius: "12px", padding: "14px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
};
const pickerLabel = {
  fontSize: "11px", color: GRAY, margin: "0 0 10px", fontWeight: "600",
};
const emojiBtn = {
  background: "none", border: "1px solid transparent", padding: "6px",
  borderRadius: "8px", cursor: "pointer", fontSize: "22px", lineHeight: 1,
  minWidth: "40px", minHeight: "40px",
};
const clearBtn = {
  background: "#fef2f2", border: "1px solid #fecaca", color: RED,
  borderRadius: "10px", cursor: "pointer", fontSize: "16px",
  padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "center",
  minWidth: "44px", minHeight: "44px", flexShrink: 0,
};
const uploadBtn = (disabled) => ({
  marginTop: "10px", width: "100%", padding: "14px",
  background: "#f5f5f3", color: "#555", border: "1.5px solid #f0ece8",
  borderRadius: "12px", fontSize: "14px", fontWeight: "600",
  cursor: disabled ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  opacity: disabled ? 0.7 : 1, minHeight: "48px",
});

/* ─── MAIN PAGE ─── */
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [savingId, setSavingId]   = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast]         = useState({ msg: "", type: "ok" });

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "ok" }), 3000);
  };

  useEffect(() => {
    fetch(`${API}/api/notifications`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.notifications) setNotifications(data.notifications); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (id, field, value) =>
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, [field]: value } : n));

  const addNew = () => {
    const tempId = `temp-${Date.now()}`;
    setNotifications((prev) => [{ ...EMPTY_NOTIFICATION, _id: tempId, _isNew: true }, ...prev]);
  };

  const saveNotification = async (notif) => {
    setSavingId(notif._id);
    try {
      const payload = { ...notif };
      delete payload._id; delete payload._isNew; delete payload.createdAt;
      delete payload.updatedAt; delete payload.__v;
      if (payload.expiryDate === "") payload.expiryDate = null;

      if (notif._isNew) {
        const r = await fetch(`${API}/api/notifications`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error();
        const data = await r.json();
        setNotifications((prev) => prev.map((n) => n._id === notif._id ? data.notification : n));
        showToast(`"${notif.title || "Notification"}" created ✓`);
      } else {
        const r = await fetch(`${API}/api/notifications/${notif._id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error();
        const data = await r.json();
        setNotifications((prev) => prev.map((n) => n._id === notif._id ? data.notification : n));
        showToast(`"${notif.title || "Notification"}" saved ✓`);
      }
    } catch {
      showToast("Save failed — check connection", "error");
    } finally {
      setSavingId(null);
    }
  };

  const deleteNotification = async (notif) => {
    if (notif._isNew) { setNotifications((prev) => prev.filter((n) => n._id !== notif._id)); return; }
    setDeletingId(notif._id);
    try {
      const r = await fetch(`${API}/api/notifications/${notif._id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error();
      setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
      showToast("Notification deleted");
    } catch {
      showToast("Delete failed — check connection", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE, animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading notifications…</p>
      </div>
    </div>
  );

  const active   = notifications.filter((n) => n.isActive && !n._isNew).length;
  const inactive = notifications.filter((n) => !n.isActive && !n._isNew).length;

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <style>{CSS}</style>

      <div style={{ padding: "clamp(16px,4vw,28px) clamp(16px,4vw,32px)", maxWidth: "780px", margin: "0 auto" }}>

        {/* header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "clamp(20px,5vw,24px)", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>
                Notifications
              </h1>
              <p style={{ fontSize: "13px", color: GRAY, margin: 0, lineHeight: 1.5 }}>
                Tap a notification to expand and edit it.
              </p>
            </div>
            <button
              onClick={addNew}
              style={{
                background: ORANGE, color: "#fff", border: "none",
                borderRadius: "12px", padding: "12px 20px",
                fontSize: "14px", fontWeight: "700", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px",
                boxShadow: "0 4px 14px rgba(224,123,57,0.3)",
                minHeight: "48px", flexShrink: 0,
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: "18px" }} />
              New
            </button>
          </div>

          {/* stats strip */}
          {notifications.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
              <Pill icon="ti-bell" color={ORANGE} label={`${notifications.length} total`} />
              <Pill icon="ti-circle-check" color={GREEN} label={`${active} active`} />
              {inactive > 0 && <Pill icon="ti-circle-off" color={GRAY} label={`${inactive} inactive`} />}
            </div>
          )}
        </div>

        {/* list */}
        {notifications.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #e5e5e3", borderRadius: "16px", padding: "48px 24px", textAlign: "center" }}>
            <i className="ti ti-bell-off" style={{ fontSize: "32px", color: "#ddd" }} />
            <p style={{ color: GRAY, fontSize: "14px", margin: "10px 0 16px" }}>No notifications yet.</p>
            <button onClick={addNew} style={{ background: ORANGE, color: "#fff", border: "none", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
              <i className="ti ti-plus" /> Create first notification
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {notifications.map((notif, i) => (
              <NotificationEditor
                key={notif._id}
                notif={notif}
                index={i}
                onChange={handleChange}
                onSave={saveNotification}
                onDelete={deleteNotification}
                saving={savingId === notif._id}
                deleting={deletingId === notif._id}
                isNew={!!notif._isNew}
              />
            ))}
          </div>
        )}

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px", paddingTop: "16px", marginTop: "16px", borderTop: "1px solid #f0ece8", fontSize: "11px", color: "#ccc" }}>
          <span>© 2026 Noir Kitchen. All rights reserved.</span>
          <span>Made with ♥ for Noir Kitchen</span>
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}

function Pill({ icon, color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#fff", border: "1px solid #f0ece8", borderRadius: "99px", padding: "5px 12px", fontSize: "12px", fontWeight: "600", color }}>
      <i className={`ti ${icon}`} style={{ fontSize: "13px" }} />
      {label}
    </div>
  );
}

/* ─── global CSS ─── */
const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  * { -webkit-tap-highlight-color: transparent; }
  textarea, input { font-size: 16px !important; }
  button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
`;