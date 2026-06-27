const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// GET /api/notifications — list all, newest/highest priority first
router.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    res.json({ notifications });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ notifications: [], error: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/active — only active + not-expired (for the live site)
router.get("/notifications/active", async (req, res) => {
  try {
    const now = new Date();
    const notifications = await Notification.find({
      isActive: true,
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    res.json({ notifications });
  } catch (err) {
    console.error("getActiveNotifications error:", err);
    res.status(500).json({ notifications: [], error: "Failed to fetch notifications" });
  }
});

// POST /api/notifications — create a new notification
router.post("/notifications", async (req, res) => {
  try {
    const created = await Notification.create(req.body);
    res.status(201).json({ notification: created });
  } catch (err) {
    console.error("createNotification error:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// PUT /api/notifications/:id — update an existing notification
router.put("/notifications/:id", async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Notification not found" });
    res.json({ notification: updated });
  } catch (err) {
    console.error("updateNotification error:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// DELETE /api/notifications/:id — remove a notification
router.delete("/notifications/:id", async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

module.exports = router;