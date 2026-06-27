// routes/deliveryRoutes.js
const express = require("express");
const Delivery = require("../models/Delivery");

const router = express.Router();

router.get("/", async (req, res) => {
  const deliveries = await Delivery.find()
    .populate("order")
    .populate("agent")
    .sort({ createdAt: -1 });
  res.json(deliveries);
});

router.post("/", async (req, res) => {
  try {
    const delivery = await Delivery.create(req.body);
    res.status(201).json(delivery);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id/assign", async (req, res) => {
  const delivery = await Delivery.findByIdAndUpdate(
    req.params.id,
    { agent: req.body.agentId, status: "Assigned", assignedAt: new Date() },
    { new: true }
  ).populate("agent");
  if (!delivery) return res.status(404).json({ message: "Delivery not found" });
  res.json(delivery);
});

router.patch("/:id/status", async (req, res) => {
  const update = { status: req.body.status };
  if (req.body.status === "Delivered") update.deliveredAt = new Date();
  if (req.body.status === "Picked Up") update.pickedAt = new Date();

  const delivery = await Delivery.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!delivery) return res.status(404).json({ message: "Delivery not found" });
  res.json(delivery);
});

module.exports = router;