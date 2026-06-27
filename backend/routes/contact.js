const express        = require("express");
const router         = express.Router();
const ContactMessage = require("../models/ContactMessage");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ message: "Name, email and message are required" });

    const now   = new Date();
    const count = await ContactMessage.countDocuments();
    const msg   = await ContactMessage.create({
      name, email, subject, message,
      date:  now.toLocaleDateString("en-IN"),
      time:  now.toLocaleTimeString("en-IN"),
      count: count + 1,
    });
    res.status(201).json({ message: "Message received", msg });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;