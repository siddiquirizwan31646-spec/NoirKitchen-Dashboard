const express = require("express");
const router = express.Router();
const AssignOrder = require("../models/AssignOrder");
const Order = require("../models/Order");
const DeliveryAgent = require("../models/DeliveryAgent");
const { protect, adminOnly } = require("../middleware/auth");
const { protectDeliveryAgent } = require("../middleware/deliveryAuth");

/* ── Admin: all assigned orders ─────────────────────────── */
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const list = await AssignOrder.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Delivery partner: his own assigned orders ──────────── */
router.get("/my", protectDeliveryAgent, async (req, res) => {
  try {
    const list = await AssignOrder.find({ agent: req.agent._id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Delivery partner controls status of his order ─────── */
router.patch("/:id/status", protectDeliveryAgent, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Assigned", "Picked Up", "Out for Delivery", "Delivered", "Failed"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const assignOrder = await AssignOrder.findById(req.params.id);
    if (!assignOrder) return res.status(404).json({ message: "Not found" });
    if (String(assignOrder.agent) !== String(req.agent._id))
      return res.status(403).json({ message: "Not your order" });

    assignOrder.status = status;
    if (status === "Picked Up") assignOrder.pickedUpAt = new Date();
    if (status === "Delivered") assignOrder.deliveredAt = new Date();
    await assignOrder.save();

    const orderStatusMap = {
      "Picked Up": "Out for Delivery",
      "Out for Delivery": "Out for Delivery",
      Delivered: "Delivered",
      Failed: "Cancelled",
    };
    if (orderStatusMap[status]) {
      await Order.findByIdAndUpdate(assignOrder.order, { orderStatus: orderStatusMap[status] });
    }

    if (status === "Delivered" || status === "Failed") {
      await DeliveryAgent.findByIdAndUpdate(assignOrder.agent, { status: "Available" });
    }

    res.json(assignOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;