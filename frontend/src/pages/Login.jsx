import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "siddiquirizwan31646@gmail.com";
const CUSTOMER_SITE = "https://noirkitchen.in";

const ORANGE = "#E07B39";

export default function Login() {
  const [step, setStep]       = useState("email");
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError("Access denied. Redirecting to Noir Kitchen...");
      setTimeout(() => { window.location.href = CUSTOMER_SITE; }, 2000);
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to send OTP"); return; }
      setStep("otp");
    } catch {
      setError("Connection error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Invalid OTP"); return; }
      if (data.user?.email !== ADMIN_EMAIL || data.user?.role !== "admin") {
        setError("Access denied. Redirecting to Noir Kitchen...");
        setTimeout(() => { window.location.href = CUSTOMER_SITE; }, 2000);
        return;
      }
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      navigate("/admin");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google login — redirects to backend which redirects back with token
  const handleGoogleLogin = () => {
    window.location.href = `${API}/api/auth/google`;
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100vw",
      background: "linear-gradient(135deg, #fdf3ed 0%, #fafaf8 60%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff", border: "1px solid #f0ece8", borderRadius: "24px",
        padding: "48px 44px", width: "100%", maxWidth: "400px",
        boxShadow: "0 12px 48px rgba(224,123,57,0.1)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img
            src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png"
            alt="Noir Kitchen"
            style={{ width: "64px", height: "64px", borderRadius: "18px", objectFit: "cover", marginBottom: "14px" }}
          />
          <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 4px" }}>
            NOIR <span style={{ color: ORANGE }}>KITCHEN</span>
          </h1>
          <p style={{ fontSize: "12px", color: "#aaa", margin: 0, letterSpacing: "0.5px" }}>ADMIN DASHBOARD</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: ORANGE, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: "700",
          }}>1</div>
          <div style={{ flex: 1, height: "2px", background: step === "otp" ? ORANGE : "#f0ece8", transition: "background 0.3s" }} />
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: step === "otp" ? ORANGE : "#f0ece8",
            color: step === "otp" ? "#fff" : "#bbb",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: "700", transition: "all 0.3s",
          }}>2</div>
        </div>

        {/* STEP 1: Email */}
        {step === "email" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px" }}>Enter Admin Email</p>
                <p style={{ fontSize: "12px", color: "#999", margin: "0 0 16px" }}>
                  We'll send a one-time code to verify your identity.
                </p>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required autoFocus
                  style={{
                    width: "100%", padding: "12px 14px", fontSize: "14px",
                    border: "1px solid #e5e5e3", borderRadius: "10px",
                    outline: "none", boxSizing: "border-box", background: "#fafaf8",
                  }}
                  onFocus={e => e.target.style.borderColor = ORANGE}
                  onBlur={e => e.target.style.borderColor = "#e5e5e3"}
                />
              </div>
              {error && <ErrorBox message={error} />}
              <Btn disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP →"}
              </Btn>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ flex: 1, height: "1px", background: "#f0ece8" }} />
              <span style={{ fontSize: "11px", color: "#bbb", fontWeight: "500" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "#f0ece8" }} />
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: "100%", padding: "12px 16px",
                background: "#fff", border: "1px solid #e5e5e3",
                borderRadius: "10px", fontSize: "14px", fontWeight: "600",
                color: "#1a1a1a", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#d0ccc8"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e5e3"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
        )}

        {/* STEP 2: OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <p style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px" }}>Enter OTP</p>
              <p style={{ fontSize: "12px", color: "#999", margin: "0 0 16px" }}>
                6-digit code sent to <strong style={{ color: "#1a1a1a" }}>{email}</strong>
              </p>
              <input
                type="text" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" required autoFocus maxLength={6}
                style={{
                  width: "100%", padding: "14px", fontSize: "28px",
                  border: "1px solid #e5e5e3", borderRadius: "10px",
                  outline: "none", boxSizing: "border-box",
                  textAlign: "center", letterSpacing: "14px", fontWeight: "700",
                  background: "#fafaf8",
                }}
                onFocus={e => e.target.style.borderColor = ORANGE}
                onBlur={e => e.target.style.borderColor = "#e5e5e3"}
              />
            </div>
            {error && <ErrorBox message={error} />}
            <Btn disabled={loading || otp.length < 6}>
              {loading ? "Verifying..." : "Verify & Sign In →"}
            </Btn>
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setError(""); }}
              style={{
                background: "none", border: "none", color: ORANGE,
                fontSize: "13px", cursor: "pointer", fontWeight: "500",
              }}
            >
              ← Change email
            </button>
          </form>
        )}

        <p style={{ fontSize: "11px", color: "#ccc", textAlign: "center", marginTop: "28px" }}>
          Authorized access only · Noir Kitchen Admin
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{
      background: "#FCEBEB", border: "1px solid #f5c6c6", borderRadius: "10px",
      padding: "10px 14px", fontSize: "13px", color: "#A32D2D",
      display: "flex", alignItems: "center", gap: "8px",
    }}>
      <i className="ti ti-alert-circle" style={{ fontSize: "16px", flexShrink: 0 }} />
      {message}
    </div>
  );
}

function Btn({ children, disabled }) {
  return (
    <button type="submit" disabled={disabled} style={{
      width: "100%", padding: "13px",
      background: disabled ? "#f0a070" : "#E07B39",
      color: "#fff", border: "none", borderRadius: "10px",
      fontSize: "14px", fontWeight: "700",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background 0.15s",
    }}>
      {children}
    </button>
  );
}