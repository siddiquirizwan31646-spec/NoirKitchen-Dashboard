const express  = require("express");
const router   = express.Router();
const MenuItem = require("../models/MenuItem");
const { protect, adminOnly } = require("../middleware/auth");

/* ── Get all menu items (public) ───────────────────────── */
router.get("/", async (req, res) => {
  try {
    const { category, veg, available } = req.query;
    const filter = {};
    if (category)  filter.category  = category;
    if (veg)       filter.veg       = veg === "true";
    if (available) filter.available = available === "true";
    const items = await MenuItem.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Get single item ───────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Create menu item (admin) ──────────────────────────── */
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ message: "Item created", item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ── Update menu item (admin) ──────────────────────────── */
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item updated", item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ── Toggle availability (admin) ───────────────────────── */
router.patch("/:id/availability", protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    item.available = !item.available;
    await item.save();
    res.json({ message: "Availability updated", available: item.available });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Delete menu item (admin) ──────────────────────────── */
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;