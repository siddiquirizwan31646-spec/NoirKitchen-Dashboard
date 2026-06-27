  const express  = require("express");
  const passport = require("passport");
  const router   = express.Router();

  const User             = require("../models/User");
  const { generateToken }= require("../utils/generateToken");
  const { sendOtpMail }  = require("../utils/sendOtpMail");
  const { protect }      = require("../middleware/auth");
  const { otpLimiter, authLimiter } = require("../middleware/rateLimiter");

  /* ── Send OTP ─────────────────────────────────────────── */
  router.post("/send-otp", otpLimiter, async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ name: name || "Guest", email, authMethod: "otp" });
      }

      const otp = await user.generateOTP();
      await sendOtpMail(email, otp);
      res.json({ message: "OTP sent to your email" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /* ── Verify OTP ───────────────────────────────────────── */
  router.post("/verify-otp", authLimiter, async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const result = await user.verifyOTP(otp);
      if (!result.valid) return res.status(400).json({ message: result.reason });

      const token = generateToken(res, user._id);
      res.json({
        message: "Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /* ── Register with password ───────────────────────────── */
  router.post("/register", authLimiter, async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password)
        return res.status(400).json({ message: "Name, email and password are required" });

      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: "Email already registered" });

      const user = await User.create({ name, email, password, phone, authMethod: "password", isVerified: true });
      const token = generateToken(res, user._id);
      res.status(201).json({
        message: "Account created",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /* ── Login with password ──────────────────────────────── */
  router.post("/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ message: "Email and password are required" });

      const user = await User.findOne({ email }).select("+password");
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const match = await user.comparePassword(password);
      if (!match) return res.status(401).json({ message: "Invalid credentials" });

      user.lastLoginAt = new Date();
      user.loginCount += 1;
      await user.save();

      const token = generateToken(res, user._id);
      res.json({
        message: "Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /* ── Google OAuth ─────────────────────────────────────── */
  router.get("/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google` }),
  (req, res) => {
    const user = req.user;

    if (user.role !== "admin") {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=not_admin`);
    }

    const token = generateToken(res, user._id);

    const userParam = encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    }));

    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&user=${userParam}`);
  }
);

  /* ── Me (persistent auth check) ──────────────────────── */
  router.get("/me", protect, (req, res) => {
    res.json({ user: req.user });
  });

  /* ── Logout ───────────────────────────────────────────── */
  router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  module.exports = router;