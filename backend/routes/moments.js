const express = require("express");
const router  = express.Router();
const Moment  = require("../models/Moments");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const moments = await Moment.find({ active: true }).sort({ order: 1 });
    res.json(moments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const moments = await Moment.find().sort({ order: 1 });
    res.json(moments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const moment = await Moment.create(req.body);
    res.status(201).json({ message: "Moment added", moment });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const moment = await Moment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!moment) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated", moment });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Moment.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;