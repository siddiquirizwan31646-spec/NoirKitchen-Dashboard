// routes/webcontent.js
const express = require("express");
const router  = express.Router();
const WebContent = require("../models/WebContent");
const { protect, adminOnly } = require("../middleware/auth");

/* GET /api/webcontent — public (or protect if you want) */
router.get("/", async (req, res) => {
  try {
    let doc = await WebContent.findOne();
    if (!doc) doc = { boxes: [] };
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* PUT /api/webcontent — admin only */
router.put("/", protect, adminOnly, async (req, res) => {
  try {
    const { boxes } = req.body;
    if (!Array.isArray(boxes)) return res.status(400).json({ error: "boxes must be an array" });

    let doc = await WebContent.findOne();
    if (doc) {
      doc.boxes = boxes;
      await doc.save();
    } else {
      doc = await WebContent.create({ boxes });
    }
    res.json({ success: true, doc });
  } catch (err) {
    console.error("WebContent PUT error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;