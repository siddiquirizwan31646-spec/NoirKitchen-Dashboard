const express = require("express");
const router  = express.Router();
const Chef    = require("../models/Chef");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const chefs = await Chef.find(filter).sort({ createdAt: -1 });
    res.json(chefs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const chef = await Chef.findById(req.params.id);
    if (!chef) return res.status(404).json({ message: "Not found" });
    res.json(chef);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const chef = await Chef.create(req.body);
    res.status(201).json({ message: "Chef added", chef });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const chef = await Chef.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!chef) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Chef updated", chef });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Chef.findByIdAndDelete(req.params.id);
    res.json({ message: "Chef deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;