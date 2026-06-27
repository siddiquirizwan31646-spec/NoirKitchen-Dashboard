import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "siddiquirizwan31646@gmail.com";
const CUSTOMER_SITE = "https://noirkitchen.in";
const ORANGE = "#E07B39";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userRaw = params.get("user");
    const err = params.get("error");

    if (err === "not_admin") {
      setError("Access denied. Your Google account is not an admin.");
      setTimeout(() => { window.location.href = CUSTOMER_SITE; }, 2500);
      return;
    }

    if (err === "google") {
      setError("Google login failed. Please try again.");
      setTimeout(() => navigate("/login"), 2500);
      return;
    }

    if (!token || !userRaw) {
      setError("Login failed. Missing credentials.");
      setTimeout(() => navigate("/login"), 2500);
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));

      // Extra safety: only allow the admin email
      if (user.email !== ADMIN_EMAIL || user.role !== "admin") {
        setError("Access denied. Redirecting...");
        setTimeout(() => { window.location.href = CUSTOMER_SITE; }, 2500);
        return;
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(user));
      navigate("/admin", { replace: true });
    } catch {
      setError("Login failed. Please try again.");
      setTimeout(() => navigate("/login"), 2500);
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #fdf3ed 0%, #fafaf8 60%)",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        {error ? (
          <>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: "#FCEBEB", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 16px",
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: "24px", color: "#A32D2D" }} />
            </div>
            <p style={{ color: "#A32D2D", fontSize: "14px", fontWeight: "600" }}>{error}</p>
          </>
        ) : (
          <>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              border: `3px solid #fdf3ed`, borderTopColor: ORANGE,
              animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: "#888", fontSize: "14px" }}>Signing you in…</p>
          </>
        )}
      </div>
    </div>
  );
}