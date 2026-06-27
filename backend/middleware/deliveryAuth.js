// middleware/deliveryAuth.js
const jwt = require("jsonwebtoken");
const DeliveryAgent = require("../models/DeliveryAgent");

const protectDeliveryAgent = async (req, res, next) => {
  try {
    const token = req.cookies?.deliveryToken;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const agent = await DeliveryAgent.findById(decoded.id);
    if (!agent) return res.status(401).json({ message: "Agent not found" });

    req.agent = agent;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { protectDeliveryAgent };