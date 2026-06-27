require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const app = express();
app.set('trust proxy', 1);

const connectDB = require("./db");
require("./middleware/passport");

const authRoutes          = require("./routes/auth");
const userRoutes          = require("./routes/users");
const orderRoutes         = require("./routes/orders");
const menuRoutes          = require("./routes/menu");
const cartRoutes          = require("./routes/cart");
const chefRoutes          = require("./routes/chefs");
const reviewRoutes        = require("./routes/reviews");
const contactRoutes       = require("./routes/contact");
const momentRoutes        = require("./routes/moments");
const connectRoutes       = require("./routes/connect");
const notificationRoutes  = require("./routes/notificationRoutes");
const contentRoutes       = require("./routes/content");
const deliveryAgentRoutes = require("./routes/deliveryAgentRoutes");
const assignOrderRoutes   = require("./routes/assignOrderRoutes");
const deliveryRoutes      = require("./routes/deliveryRoutes");
const couponRoutes        = require("./routes/coupons");

const { protect }      = require("./middleware/auth");
const { errorHandler } = require("./middleware/errorHandler");

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allows Vercel frontend + localhost dev. Add any extra origins to the array.
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,          // e.g. https://noir-kitchen-dashboard.vercel.app
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

connectDB();

// ── Public routes ─────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/menu",     menuRoutes);
app.use("/api/cart",     cartRoutes);
app.use("/api/webcontent", require("./routes/webcontent")); // public — needed by main site

// ── Customer routes ───────────────────────────────────────────────────────────
app.use("/api/orders",     protect, orderRoutes);
app.use("/api/reviews",    protect, reviewRoutes);
app.use("/api/contact",    protect, contactRoutes);
app.use("/api/deliveries", protect, deliveryRoutes);
app.use("/api/payments",   protect, require("./routes/payments"));

// ── Admin routes ──────────────────────────────────────────────────────────────
app.use("/api/users",           protect, requireAdmin, userRoutes);
app.use("/api/chefs",           protect, requireAdmin, chefRoutes);
app.use("/api/moments",         protect, requireAdmin, momentRoutes);
app.use("/api/content",         protect, requireAdmin, contentRoutes);
app.use("/api/delivery-agents", protect, requireAdmin, deliveryAgentRoutes);
app.use("/api/assign-orders",   protect, requireAdmin, assignOrderRoutes);
app.use("/api/connect",         protect, requireAdmin, connectRoutes);
app.use("/api/coupons",         protect, requireAdmin, couponRoutes);
app.use("/api",                 protect, requireAdmin, notificationRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));