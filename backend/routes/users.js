const express = require("express");
const router  = express.Router();
const User    = require("../models/User");

/* ── Get all users (admin) ─────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const users = await User.find()
      .select("-password -otp")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments();
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -otp");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put("/me", async (req, res) => {
  try {
    const allowed = ["name", "phone", "address", "preferences"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password -otp");
    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["customer", "admin", "staff"].includes(role))
      return res.status(400).json({ message: "Invalid role" });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password -otp");
    res.json({ message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;