import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/* ─── colour tokens ─── */
const ORANGE = "#E07B39";
const ORANGE_L = "#fdf3ed";
const GRAY = "#888";
const GREEN = "#63992E";
const RED = "#E24B4A";

/* ─── default boxes ─── */
const DEFAULT_BOXES = [
  { id: "box1", label: "Hero Section",     content: "", imageUrl: "", emoji: "", icon: "" },
  { id: "box2", label: "About Us",         content: "", imageUrl: "", emoji: "", icon: "" },
  { id: "box3", label: "Special Offer",    content: "", imageUrl: "", emoji: "", icon: "" },
  { id: "box4", label: "Footer Message",   content: "", imageUrl: "", emoji: "", icon: "" },
  { id: "box5", label: "Announcement Bar", content: "", imageUrl: "", emoji: "", icon: "" },
];

/* ─── emoji picker data ─── */
const EMOJIS = [
  "🍽️","🍕","🍔","🌮","🥗","🍜","🍣","🥩","🍷","☕",
  "🎉","⭐","🔥","❤️","✨","🏆","👨‍🍳","🌟","💫","🎊",
  "🥂","🍾","🎁","🌹","💎","🙌","👌","😋","🤤","🍰",
];

/* ─── tabler icon list ─── */
const ICONS = [
  "ti-star","ti-heart","ti-flame","ti-trophy","ti-crown",
  "ti-award","ti-gift","ti-sparkles","ti-chef-hat","ti-pizza",
  "ti-salad","ti-bowl","ti-cup","ti-tools-kitchen","ti-discount",
  "ti-clock","ti-map-pin","ti-phone","ti-mail","ti-brand-instagram",
];

/* ─── upload image to imgBB ─── */
async function uploadToImgBB(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
    method: "POST", body: fd,
  });
  const data = await res.json();
  if (data.success) return data.data.url;
  throw new Error("ImgBB upload failed");
}

/* ─── paste image from clipboard ─── */
async function uploadFromClipboard(e) {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      return await uploadToImgBB(file);
    }
  }
  return null;
}

/* ─── toast ─── */
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
      whiteSpace: "nowrap",
      maxWidth: "calc(100vw - 32px)",
    }}>
      <i className={`ti ${type === "error" ? "ti-x" : "ti-check"}`}
        style={{ color: type === "error" ? "#ffaaaa" : GREEN, flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{msg}</span>
    </div>
  );
}

/* ─── SINGLE BOX EDITOR ─── */
function BoxEditor({ box, index, onChange, onSave, saving, defaultOpen }) {
  const [open, setOpen]           = useState(defaultOpen ?? false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showIcon, setShowIcon]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const textRef = useRef();

  /* paste screenshot into image field */
  const handlePaste = async (e) => {
    const url = await uploadFromClipboard(e);
    if (url) onChange(box.id, "imageUrl", url);
  };

  /* file input upload */
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToImgBB(file);
      onChange(box.id, "imageUrl", url);
    } catch {
      alert("Image upload failed. Check your VITE_IMGBB_API_KEY.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const insertEmoji = (em) => {
    const el = textRef.current;
    if (!el) { onChange(box.id, "content", box.content + em); setShowEmoji(false); return; }
    const s = el.selectionStart, e2 = el.selectionEnd;
    const next = box.content.slice(0, s) + em + box.content.slice(e2);
    onChange(box.id, "content", next);
    setShowEmoji(false);
    setTimeout(() => { el.selectionStart = el.selectionEnd = s + em.length; el.focus(); }, 0);
  };

  const selectIcon = (ic) => {
    onChange(box.id, "icon", box.icon === ic ? "" : ic);
    setShowIcon(false);
  };

  const hasFill = box.content || box.emoji || box.imageUrl || box.icon;

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${open ? ORANGE : "#f0ece8"}`,
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: open ? "0 4px 20px rgba(224,123,57,0.10)" : "0 2px 8px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s, border-color 0.2s",
    }}>

      {/* ── accordion header ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", background: open ? ORANGE_L : "#fff",
          padding: "16px 18px",
          border: "none", borderBottom: open ? "1px solid #f0ece8" : "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", transition: "background 0.2s",
          gap: "12px",
          /* min touch target */
          minHeight: "56px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
          <div style={{
            width: "32px", height: "32px", background: open ? ORANGE : "#f0ece8",
            borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: "800", color: open ? "#fff" : "#999",
            flexShrink: 0, transition: "background 0.2s, color 0.2s",
          }}>
            {index + 1}
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a", display: "block" }}>
              {box.label}
            </span>
            {!open && hasFill && (
              <span style={{ fontSize: "11px", color: GRAY, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                {box.content || (box.emoji ? `${box.emoji} emoji set` : box.imageUrl ? "Image set" : `Icon: ${box.icon}`)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {hasFill && (
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: GREEN, display: "inline-block",
            }} />
          )}
          <i className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"}`}
            style={{ fontSize: "16px", color: GRAY }} />
        </div>
      </button>

      {/* ── expandable body ── */}
      {open && (
        <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* text content */}
          <div>
            <label style={labelStyle}>Text Content</label>
            <div style={{ position: "relative" }}>
              <textarea
                ref={textRef}
                value={box.content}
                onChange={(e) => onChange(box.id, "content", e.target.value)}
                placeholder="Write anything — tagline, description, offer text…"
                rows={4}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 12px 44px 12px", fontSize: "15px",
                  border: "1.5px solid #f0ece8", borderRadius: "12px",
                  outline: "none", resize: "vertical", fontFamily: "inherit",
                  color: "#1a1a1a", lineHeight: 1.6,
                  transition: "border-color 0.2s",
                  /* larger touch area */
                  WebkitAppearance: "none",
                }}
                onFocus={(e) => e.target.style.borderColor = ORANGE}
                onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
              />
              {/* emoji + icon buttons */}
              <div style={{ position: "absolute", bottom: "10px", left: "10px", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => { setShowEmoji(!showEmoji); setShowIcon(false); }}
                  title="Insert emoji"
                  style={inlineBtn}
                >
                  😊 <span style={{ fontSize: "11px", fontWeight: "700", color: "#555" }}>Emoji</span>
                </button>
                <button
                  onClick={() => { setShowIcon(!showIcon); setShowEmoji(false); }}
                  title="Pick icon"
                  style={inlineBtn}
                >
                  <i className="ti ti-icons" style={{ fontSize: "14px", color: ORANGE }} />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: ORANGE }}>Icon</span>
                </button>
              </div>
            </div>

            {/* emoji picker */}
            {showEmoji && (
              <div style={pickerBox}>
                <p style={pickerLabel}>Tap to insert</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {EMOJIS.map((em) => (
                    <button key={em} onClick={() => insertEmoji(em)} style={emojiBtn}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* icon picker */}
            {showIcon && (
              <div style={pickerBox}>
                <p style={pickerLabel}>
                  Saved as class — use <code style={{ background: "#f5f5f3", padding: "1px 4px", borderRadius: "4px" }}>{`<i class="ti {icon}">`}</code>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => selectIcon(ic)}
                      title={ic}
                      style={{
                        background: box.icon === ic ? ORANGE_L : "#f5f5f3",
                        border: `1.5px solid ${box.icon === ic ? ORANGE : "transparent"}`,
                        borderRadius: "8px", padding: "9px 10px", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                        minWidth: "52px",
                      }}
                    >
                      <i className={`ti ${ic}`} style={{ fontSize: "20px", color: box.icon === ic ? ORANGE : "#555" }} />
                      <span style={{ fontSize: "9px", color: GRAY, textAlign: "center", lineHeight: 1.2 }}>
                        {ic.replace("ti-", "")}
                      </span>
                    </button>
                  ))}
                </div>
                {box.icon && (
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: GRAY }}>Selected:</span>
                    <code style={{ fontSize: "11px", background: ORANGE_L, color: ORANGE, padding: "3px 8px", borderRadius: "6px" }}>{box.icon}</code>
                    <button onClick={() => onChange(box.id, "icon", "")} style={{ background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "12px", padding: "4px 0" }}>
                      <i className="ti ti-x" /> Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* standalone emoji */}
          <div>
            <label style={labelStyle}>Standalone Emoji</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="text"
                value={box.emoji}
                onChange={(e) => onChange(box.id, "emoji", e.target.value)}
                placeholder="Paste or type emoji e.g. 🔥"
                style={{
                  flex: 1, padding: "12px 14px", fontSize: "22px",
                  border: "1.5px solid #f0ece8", borderRadius: "12px", outline: "none",
                  transition: "border-color 0.2s", WebkitAppearance: "none",
                }}
                onFocus={(e) => e.target.style.borderColor = ORANGE}
                onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
              />
              {box.emoji && (
                <button onClick={() => onChange(box.id, "emoji", "")} style={clearBtn}>
                  <i className="ti ti-x" />
                </button>
              )}
            </div>
          </div>

          {/* image upload */}
          <div>
            <label style={labelStyle}>
              Image <span style={{ fontWeight: "400", textTransform: "none", letterSpacing: 0, color: GRAY }}>— paste or upload</span>
            </label>

            {/* current image or upload prompt */}
            {box.imageUrl ? (
              <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden" }}>
                <img
                  src={box.imageUrl}
                  alt="box preview"
                  style={{ width: "100%", maxHeight: "200px", objectFit: "cover", display: "block" }}
                />
                <button
                  onClick={() => onChange(box.id, "imageUrl", "")}
                  style={{
                    position: "absolute", top: "8px", right: "8px",
                    background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
                    borderRadius: "8px", padding: "7px 12px", cursor: "pointer",
                    fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  <i className="ti ti-trash" /> Remove
                </button>
              </div>
            ) : (
              /* paste zone — desktop only fallback */
              <div
                onPaste={handlePaste}
                style={{
                  border: "2px dashed #e5e5e3",
                  borderRadius: "12px", padding: "20px",
                  background: "#fafaf8", textAlign: "center",
                }}
              >
                <i className="ti ti-photo-up" style={{ fontSize: "28px", color: "#ccc" }} />
                <p style={{ fontSize: "12px", color: GRAY, margin: "6px 0 0", lineHeight: 1.5 }}>
                  <strong style={{ color: "#555" }}>Paste screenshot</strong> (Ctrl+V / ⌘V)<br />
                  or use the buttons below
                </p>
              </div>
            )}

            {/* URL input */}
            <input
              type="url"
              inputMode="url"
              value={box.imageUrl}
              onChange={(e) => onChange(box.id, "imageUrl", e.target.value)}
              placeholder="Or paste image URL…"
              style={{
                width: "100%", boxSizing: "border-box", marginTop: "10px",
                padding: "11px 13px", fontSize: "13px",
                border: "1.5px solid #f0ece8", borderRadius: "10px", outline: "none",
                color: "#555", transition: "border-color 0.2s", WebkitAppearance: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = ORANGE}
              onBlur={(e) => e.target.style.borderColor = "#f0ece8"}
            />

            {/* file upload — big tap target on mobile */}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              style={{
                marginTop: "10px", width: "100%", padding: "14px",
                background: "#f5f5f3", color: "#555", border: "1.5px solid #f0ece8",
                borderRadius: "12px", fontSize: "14px", fontWeight: "600",
                cursor: uploading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                opacity: uploading ? 0.7 : 1,
                /* touch */
                minHeight: "48px",
              }}
            >
              <i className={`ti ${uploading ? "ti-loader-2" : "ti-upload"}`} style={{ fontSize: "16px" }} />
              {uploading ? "Uploading…" : "Upload from Device / Camera"}
            </button>
          </div>

          {/* live preview */}
          {hasFill && (
            <div style={{ borderTop: "1px dashed #f0ece8", paddingTop: "14px" }}>
              <p style={{ fontSize: "11px", fontWeight: "700", color: GRAY, textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 10px" }}>Preview</p>
              <div style={{
                background: "#fafaf8", border: "1px solid #f0ece8",
                borderRadius: "12px", padding: "16px",
                display: "flex", alignItems: "flex-start", gap: "12px",
              }}>
                {box.imageUrl && (
                  <img src={box.imageUrl} alt="" style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    {box.emoji && <span style={{ fontSize: "22px" }}>{box.emoji}</span>}
                    {box.icon && <i className={`ti ${box.icon}`} style={{ fontSize: "20px", color: ORANGE }} />}
                  </div>
                  {box.content && (
                    <p style={{ fontSize: "13px", color: "#1a1a1a", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, wordBreak: "break-word" }}>
                      {box.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* save button — full width at bottom of card */}
          <button
            onClick={() => onSave(box)}
            disabled={saving}
            style={{
              background: ORANGE, color: "#fff", border: "none",
              borderRadius: "12px", padding: "15px",
              fontSize: "15px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 4px 14px rgba(224,123,57,0.25)",
              minHeight: "50px",
            }}
          >
            <i className="ti ti-device-floppy" style={{ fontSize: "18px" }} />
            {saving ? "Saving…" : `Save ${box.label}`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── shared micro styles ─── */
const labelStyle = {
  fontSize: "11px", fontWeight: "700", color: GRAY,
  textTransform: "uppercase", letterSpacing: "0.6px",
  display: "block", marginBottom: "8px",
};
const inlineBtn = {
  background: "#f5f5f3", border: "none", borderRadius: "8px",
  padding: "6px 10px", cursor: "pointer", fontSize: "14px",
  display: "flex", alignItems: "center", gap: "4px",
  minHeight: "36px",
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
  minWidth: "44px", minHeight: "44px",
};

/* ─── MAIN PAGE ─── */
export default function WebsiteContent() {
  const [boxes, setBoxes]           = useState(DEFAULT_BOXES);
  const [loading, setLoading]       = useState(true);
  const [savingId, setSavingId]     = useState(null);
  const [toast, setToast]           = useState({ msg: "", type: "ok" });
  const [saveAllBusy, setSaveAllBusy] = useState(false);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "ok" }), 3000);
  };

  /* fetch saved content */
  useEffect(() => {
    fetch(`${API}/api/webcontent`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && Array.isArray(data.boxes) && data.boxes.length) setBoxes(data.boxes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (id, field, value) =>
    setBoxes((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));

  const saveBox = async (box) => {
    setSavingId(box.id);
    try {
      const updated = boxes.map((b) => (b.id === box.id ? box : b));
      const r = await fetch(`${API}/api/webcontent`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ boxes: updated }),
      });
      if (!r.ok) throw new Error();
      showToast(`"${box.label}" saved ✓`);
    } catch {
      showToast("Save failed — check connection", "error");
    } finally {
      setSavingId(null);
    }
  };

  const saveAll = async () => {
    setSaveAllBusy(true);
    try {
      const r = await fetch(`${API}/api/webcontent`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ boxes }),
      });
      if (!r.ok) throw new Error();
      showToast("All boxes saved ✓");
    } catch {
      showToast("Save failed — check connection", "error");
    } finally {
      setSaveAllBusy(false);
    }
  };

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          border: `3px solid ${ORANGE_L}`, borderTopColor: ORANGE,
          animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
        }} />
        <p style={{ color: GRAY, fontSize: "14px" }}>Loading content…</p>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, background: "#fafaf8", minHeight: "100vh", overflowY: "auto" }}>
      <style>{CSS}</style>

      <div style={{ padding: "clamp(16px, 4vw, 28px) clamp(16px, 4vw, 32px)", maxWidth: "780px", margin: "0 auto" }}>

        {/* ── header ── */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: "12px",
            flexWrap: "wrap",
          }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>
                Website Content
              </h1>
              <p style={{ fontSize: "13px", color: GRAY, margin: 0, lineHeight: 1.5 }}>
                Edit live content blocks. Tap a section to expand and edit.
              </p>
            </div>
            <button
              onClick={saveAll}
              disabled={saveAllBusy}
              style={{
                background: ORANGE, color: "#fff", border: "none",
                borderRadius: "12px", padding: "12px 20px",
                fontSize: "14px", fontWeight: "700", cursor: saveAllBusy ? "not-allowed" : "pointer",
                opacity: saveAllBusy ? 0.75 : 1,
                display: "flex", alignItems: "center", gap: "8px",
                boxShadow: "0 4px 14px rgba(224,123,57,0.3)",
                minHeight: "48px", flexShrink: 0,
              }}
            >
              <i className="ti ti-device-floppy" style={{ fontSize: "16px" }} />
              {saveAllBusy ? "Saving…" : "Save All"}
            </button>
          </div>

          {/* progress pills */}
          <div style={{ display: "flex", gap: "6px", marginTop: "16px", flexWrap: "wrap" }}>
            {boxes.map((b) => {
              const filled = !!(b.content || b.emoji || b.imageUrl || b.icon);
              return (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  background: filled ? "#f0fce8" : "#f5f5f3",
                  border: `1px solid ${filled ? "#b6e08a" : "#e5e5e3"}`,
                  borderRadius: "99px", padding: "4px 10px",
                  fontSize: "11px", fontWeight: "600",
                  color: filled ? GREEN : GRAY,
                }}>
                  <i className={`ti ${filled ? "ti-circle-check" : "ti-circle"}`} style={{ fontSize: "12px" }} />
                  {b.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── accordion list ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {boxes.map((box, i) => (
            <BoxEditor
              key={box.id}
              box={box}
              index={i}
              onChange={handleChange}
              onSave={saveBox}
              saving={savingId === box.id}
            />
          ))}
        </div>

        {/* footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px",
          paddingTop: "16px", marginTop: "16px", borderTop: "1px solid #f0ece8",
          fontSize: "11px", color: "#ccc",
        }}>
          <span>© 2026 Noir Kitchen. All rights reserved.</span>
          <span>Made with ♥ for Noir Kitchen</span>
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}

/* ─── global CSS ─── */
const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  * { -webkit-tap-highlight-color: transparent; }
  textarea, input { font-size: 16px !important; } /* prevent iOS zoom */
  button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
`;