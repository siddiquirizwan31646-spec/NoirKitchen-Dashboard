const express = require("express");
const router  = express.Router();
const { protect, adminOnly } = require("../middleware/auth");

// Using a simple in-memory + JSON file approach for site content
// (no extra model needed — content is one document)
const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const Content = mongoose.models.Content || mongoose.model("Content", contentSchema);

/* ── Get all content (public) ──────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const docs = await Content.find();
    const result = {};
    docs.forEach(d => { result[d.key] = d.value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Upsert content (admin) ────────────────────────────── */
router.put("/", protect, adminOnly, async (req, res) => {
  try {
    const updates = req.body;
    const ops = Object.entries(updates).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { key, value } },
        upsert: true,
      },
    }));
    await Content.bulkWrite(ops);
    res.json({ message: "Content updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Get single key ─────────────────────────────────────── */
router.get("/:key", async (req, res) => {
  try {
    const doc = await Content.findOne({ key: req.params.key });
    if (!doc) return res.status(404).json({ message: "Key not found" });
    res.json({ key: doc.key, value: doc.value });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

