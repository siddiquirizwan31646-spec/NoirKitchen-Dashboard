export default function ComingSoon({ title = "Coming Soon" }) {
  const isPayment      = title.toLowerCase().includes("payment");
  const isReservation  = title.toLowerCase().includes("reservation");
  const isInventory    = title.toLowerCase().includes("inventory");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fafaf8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff",
        border: "1px solid #f0ece8",
        borderRadius: "20px",
        padding: "60px 48px",
        maxWidth: "500px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>

        {/* Icon */}
        <div style={{
          width: "72px", height: "72px", borderRadius: "20px",
          background: "#fdf3ed", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 24px",
        }}>
          {isPayment ? (
            <i className="ti ti-credit-card" style={{ fontSize: "32px", color: "#E07B39" }} />
          ) : isReservation ? (
            <i className="ti ti-calendar-event" style={{ fontSize: "32px", color: "#E07B39" }} />
          ) : isInventory ? (
            <i className="ti ti-package" style={{ fontSize: "32px", color: "#E07B39" }} />
          ) : (
            <i className="ti ti-tools" style={{ fontSize: "32px", color: "#E07B39" }} />
          )}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "22px", fontWeight: "700", color: "#1a1a1a",
          margin: "0 0 10px",
        }}>
          {title}
        </h1>

        {/* Message */}
        {isPayment ? (
          <>
            <p style={{ fontSize: "14px", color: "#888", lineHeight: "1.6", margin: "0 0 24px" }}>
              All payments are handled via <strong style={{ color: "#1a1a1a" }}>Cash on Delivery (COD)</strong> only.
            </p>
            <div style={{
              background: "#fdf3ed", border: "1px solid #f5dcc8",
              borderRadius: "12px", padding: "16px 20px",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <i className="ti ti-cash" style={{ fontSize: "24px", color: "#E07B39", flexShrink: 0 }} />
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#1a1a1a" }}>
                  Cash on Delivery
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                  Currency: Indian Rupees (₹)
                </p>
              </div>
            </div>
          </>
        ) : (
          <p style={{ fontSize: "14px", color: "#888", lineHeight: "1.6", margin: "0 0 24px" }}>
            This section is currently under development and will be available soon.
            We're working hard to bring you the best experience.
          </p>
        )}

        {/* Coming Soon badge */}
        {!isPayment && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "#fdf3ed", border: "1px solid #f5dcc8",
            borderRadius: "30px", padding: "8px 20px",
            fontSize: "13px", fontWeight: "600", color: "#E07B39",
            marginTop: "8px",
          }}>
            <i className="ti ti-clock" style={{ fontSize: "15px" }} />
            Coming Soon
          </div>
        )}

      </div>
    </div>
  );
}