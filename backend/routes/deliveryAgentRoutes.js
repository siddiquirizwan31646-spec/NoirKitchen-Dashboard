// routes/deliveryAgentRoutes.js
const express = require("express");
const DeliveryAgent = require("../models/DeliveryAgent");

const router = express.Router();

router.get("/", async (req, res) => {
  const agents = await DeliveryAgent.find().sort({ createdAt: -1 });
  res.json(agents);
});

router.post("/", async (req, res) => {
  try {
    const agent = await DeliveryAgent.create(req.body);
    res.status(201).json(agent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const { status, orderId, ...rest } = req.body;

    // update other fields if any
    Object.assign(agent, rest);

    // if status is changing, push to log
    if (status && status !== agent.status) {
      agent.status = status;
      agent.statusLog.push({
        status,
        orderId: orderId || null,
        changedAt: new Date(),
      });
    }

    await agent.save();
    res.json(agent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
router.delete("/:id", async (req, res) => {
  await DeliveryAgent.findByIdAndDelete(req.params.id);
  res.json({ message: "Agent removed" });
});

module.exports = router;