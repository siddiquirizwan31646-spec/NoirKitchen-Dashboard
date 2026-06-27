import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden]       = useState(false);
  const isMobile                  = useIsMobile();

  // Auto-hide on mobile, restore on desktop
  useEffect(() => {
    if (isMobile) setHidden(true);
    else setHidden(false);
  }, [isMobile]);

  const marginLeft = isMobile
    ? 0
    : hidden
      ? 0
      : collapsed ? 64 : 240;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fafaf8" }}>
      <AdminNavbar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        hidden={hidden}
        setHidden={setHidden}
        isMobile={isMobile}
      />

      <main
        style={{
          flex: 1,
          marginLeft: `${marginLeft}px`,
          transition: "margin-left 0.22s ease",
          minHeight: "100vh",
          minWidth: 0,
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            background: "#fff",
            borderBottom: "1px solid #f0ece8",
            position: "sticky",
            top: 0,
            zIndex: 98,
          }}>
            <button
              onClick={() => setHidden(false)}
              style={{
                background: "none",
                border: "1px solid #f0ece8",
                borderRadius: "8px",
                padding: "6px 10px",
                cursor: "pointer",
                color: "#E07B39",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Open menu"
            >
              <i className="ti ti-menu-2" style={{ fontSize: "18px" }} />
            </button>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a1a" }}>
              NOIR <span style={{ color: "#E07B39" }}>KITCHEN</span>
            </span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}