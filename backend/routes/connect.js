const express = require("express");
const router  = express.Router();
const Connect = require("../models/Connect");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const exists = await Connect.findOne({ email });
    if (exists) return res.status(409).json({ message: "Already subscribed" });
    const entry = await Connect.create({ email, name });
    res.status(201).json({ message: "Subscribed successfully", entry });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const list = await Connect.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Connect.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;