import { NavLink, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard",          icon: "ti-layout-dashboard",  path: "/admin" },
  { label: "Orders",             icon: "ti-shopping-bag",      path: "/admin/orders" },
  { label: "Staff & Roles",      icon: "ti-user-cog",          path: "/admin/staff" },
  { label: "Customer Message",   icon: "ti-message-circle",    path: "/admin/customerMessage" },
  { label: "Menu Management",    icon: "ti-tools-kitchen-2",   path: "/admin/menuManagement" },
  { label: "Customers",          icon: "ti-users",             path: "/admin/customers" },
  { label: "Delivery",           icon: "ti-bike",              path: "/admin/delivery" },
  { label: "Coupons & Offers",   icon: "ti-tag",               path: "/admin/coupon&Discounts" },
  { label: "Reviews",            icon: "ti-star",              path: "/admin/reviews" },
  { label: "Connected Customers",icon: "ti-users",             path: "/admin/Connectedcustomers" },
  { label: "Payments",           icon: "ti-credit-card",       path: "/admin/payments" },
  { label: "Reports",            icon: "ti-chart-bar",         path: "/admin/reports" },
  { label: "Website Content",    icon: "ti-file-text",         path: "/admin/Webcontent" },
  { label: "Notifications",      icon: "ti-bell",              path: "/admin/notifications", notifKey: true },
];

export default function AdminNavbar({
  notificationCount = 0,
  collapsed, setCollapsed,
  hidden, setHidden,
  isMobile,
}) {
  const navigate = useNavigate();

  const handleNavClick = () => { if (isMobile) setHidden(true); };

  const sidebarWidth  = isMobile ? "260px" : collapsed ? "64px" : "240px";
  const translateX    = hidden ? "-100%" : "0";

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && !hidden && (
        <div
          onClick={() => setHidden(true)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(20,12,4,0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 99,
          }}
        />
      )}

      {/* Floating unhide tab — desktop only, shown when hidden */}
      {!isMobile && hidden && (
        <button
          onClick={() => setHidden(false)}
          style={{
            position: "fixed",
            top: "50%", left: 0,
            transform: "translateY(-50%)",
            zIndex: 101,
            background: "#E07B39",
            border: "none",
            borderRadius: "0 10px 10px 0",
            width: "28px", height: "52px",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "2px 0 12px rgba(224,123,57,0.35)",
          }}
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <i className="ti ti-chevron-right" style={{ fontSize: "16px", color: "#fff" }} />
        </button>
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: sidebarWidth,
          height: "100vh",
          background: "#fff",
          borderRight: "1px solid #f0ece8",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.22s ease, transform 0.25s ease",
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          overflowY: "auto",
          overflowX: "hidden",
          flexShrink: 0,
          zIndex: 100,
          transform: `translateX(${translateX})`,
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: collapsed && !isMobile ? "20px 14px" : "20px 20px",
            borderBottom: "1px solid #f0ece8",
            cursor: "pointer",
            flexShrink: 0,
          }}
          onClick={() => { navigate("/admin"); handleNavClick(); }}
        >
          <img
            src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png"
            alt="Noir Kitchen"
            style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
          {(!collapsed || isMobile) && (
            <span style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
              NOIR <span style={{ color: "#E07B39" }}>KITCHEN</span>
            </span>
          )}

          {/* Desktop: collapse toggle */}
          {!isMobile && (
            <button
              onClick={(e) => { e.stopPropagation(); setCollapsed(p => !p); }}
              style={{
                marginLeft: collapsed ? "auto" : "4px",
                background: "none", border: "none",
                cursor: "pointer", color: "#aaa", padding: "4px",
                display: "flex", alignItems: "center", flexShrink: 0,
              }}
              title={collapsed ? "Expand" : "Collapse"}
            >
              <i className={`ti ${collapsed ? "ti-chevron-right" : "ti-chevron-left"}`} style={{ fontSize: "16px" }} />
            </button>
          )}

          {/* Desktop: hide button */}
          {!isMobile && !collapsed && (
            <button
              onClick={(e) => { e.stopPropagation(); setHidden(true); }}
              style={{
                marginLeft: "auto",
                background: "none", border: "none",
                cursor: "pointer", color: "#ccc", padding: "4px",
                display: "flex", alignItems: "center", flexShrink: 0,
              }}
              title="Hide sidebar"
            >
              <i className="ti ti-layout-sidebar-left-collapse" style={{ fontSize: "16px" }} />
            </button>
          )}

          {/* Mobile: close button */}
          {isMobile && (
            <button
              onClick={(e) => { e.stopPropagation(); setHidden(true); }}
              style={{
                marginLeft: "auto",
                background: "none", border: "none",
                cursor: "pointer", color: "#888", padding: "4px",
                display: "flex", alignItems: "center",
              }}
              aria-label="Close sidebar"
            >
              <i className="ti ti-x" style={{ fontSize: "18px" }} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map(({ label, icon, path, badge, notifKey }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/admin"}
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: collapsed && !isMobile ? "10px 20px" : "10px 18px",
                margin: "2px 8px",
                borderRadius: "10px",
                textDecoration: "none",
                color: isActive ? "#fff" : "#555",
                background: isActive ? "#E07B39" : "transparent",
                fontSize: "13.5px",
                fontWeight: isActive ? "600" : "400",
                transition: "background 0.15s, color 0.15s",
                position: "relative",
                whiteSpace: "nowrap",
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.style.background.includes("E07B39")) {
                  e.currentTarget.style.background = "#fdf3ed";
                  e.currentTarget.style.color = "#E07B39";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.style.background.includes("E07B39")) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#555";
                }
              }}
            >
              <i className={`ti ${icon}`} style={{ fontSize: "18px", flexShrink: 0 }} aria-hidden="true" />
              {(!collapsed || isMobile) && (
                <>
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span style={{
                      fontSize: "10px", background: "#f0ece8", color: "#999",
                      padding: "2px 6px", borderRadius: "20px", fontWeight: "500",
                    }}>{badge}</span>
                  )}
                  {notifKey && notificationCount > 0 && (
                    <span style={{
                      fontSize: "11px", background: "#E07B39", color: "#fff",
                      padding: "2px 6px", borderRadius: "20px", fontWeight: "600",
                      minWidth: "20px", textAlign: "center",
                    }}>{notificationCount}</span>
                  )}
                </>
              )}
              {collapsed && !isMobile && notifKey && notificationCount > 0 && (
                <span style={{
                  position: "absolute", top: "6px", right: "6px",
                  width: "8px", height: "8px", borderRadius: "50%", background: "#E07B39",
                }} />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom branding card */}
        {(!collapsed || isMobile) && (
          <div style={{
            margin: "12px", borderRadius: "14px", overflow: "hidden",
            background: "#fdf3ed", padding: "14px", flexShrink: 0,
          }}>
            <p style={{
              fontSize: "11px", fontWeight: "700", color: "#E07B39",
              margin: "0 0 4px", letterSpacing: "0.5px", textTransform: "uppercase",
            }}>Elevated Taste</p>
            <p style={{ fontSize: "11px", color: "#888", margin: "0 0 10px" }}>Timeless Experience</p>
            <img
              src="/img.png"
              alt="Noir Kitchen dish"
              style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "10px" }}
            />
          </div>
        )}
      </aside>
    </>
  );
}