const express = require("express");
const router  = express.Router();
const Order   = require("../models/Order");
const DeliveryAgent  = require("../models/DeliveryAgent");
const AssignOrder    = require("../models/AssignOrder");
const CancelledOrder = require("../models/CancelledOrder");
const { protect, adminOnly } = require("../middleware/auth");

/* ── Place order (public / logged in) ─────────────────────────── */
router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ message: "Order placed", order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ── Get all orders (admin) ────────────────────────────────────── */
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = status ? { orderStatus: status } : {};
    const orders = await Order.find(filter)
      .populate("deliveryPartner")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ orders, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Get orders by customer email ──────────────────────────────── */
// NOTE: must be before /:id to avoid "my" being treated as an id
router.get("/my/:email", async (req, res) => {
  try {
    const orders = await Order.find({ email: req.params.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Mark order as seen (admin) ────────────────────────────────── */
// NOTE: must be before /:id to avoid "mark-seen" being treated as an id
router.patch("/:id/mark-seen", protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isNewOrder: false },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Marked as seen", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Update order status (admin) ───────────────────────────────── */
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { orderStatus, cancelReason } = req.body;
    const allowed = ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
    if (!allowed.includes(orderStatus))
      return res.status(400).json({ message: "Invalid status" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.orderStatus === "Cancelled")
      return res.status(400).json({ message: "Cancelled orders cannot be modified." });

    if (orderStatus === "Cancelled") {
      if (!cancelReason || !cancelReason.trim())
        return res.status(400).json({ message: "A cancellation reason is required" });

      await CancelledOrder.create({
        orderId:        order._id,
        fullName:       order.fullName,
        mobile:         order.mobile,
        phone:          order.phone,
        itemName:       order.itemName,
        quantity:       order.quantity,
        totalAmount:    order.totalAmount,
        discountAmount: order.discountAmount,
        discountType:   order.discountType,
        discountValue:  order.discountValue,
        couponCode:     order.couponCode,
        orderCreatedAt: order.createdAt,
        reason:         cancelReason.trim(),
        cancelledAt:    new Date(),
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    res.json({ message: "Status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Assign delivery partner ────────────────────────────────────── */
router.patch("/:id/assign-partner", protect, adminOnly, async (req, res) => {
  try {
    const { agentId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    order.deliveryPartner = agent._id;
    order.orderStatus = "Out for Delivery";
    await order.save();

    agent.status = "On Delivery";
    await agent.save();

    const assignOrder = await AssignOrder.create({
      order: order._id,
      agent: agent._id,
      customerDetails: {
        fullName:        order.fullName,
        mobile:          order.mobile,
        email:           order.email,
        deliveryAddress: order.deliveryAddress,
        houseNo:         order.houseNo,
        areaName:        order.areaName,
        areaNo:          order.areaNo,
        city:            order.city,
        pinCode:         order.pinCode,
      },
      deliveryPartnerDetails: {
        name:          agent.name,
        phone:         agent.phone,
        email:         agent.email,
        vehicleType:   agent.vehicleType,
        vehicleNumber: agent.vehicleNumber,
      },
      foodDetails: {
        itemName:            order.itemName,
        variant:             order.variant,
        addons:              order.addons,
        quantity:            order.quantity,
        specialInstructions: order.specialInstructions,
        baseAmount:          order.baseAmount,
        addonTotal:          order.addonTotal,
        gstAmount:           order.gstAmount,
        totalAmount:         order.totalAmount,
        paymentMethod:       order.paymentMethod,
      },
    });

    const populated = await Order.findById(order._id).populate("deliveryPartner");
    res.json({ order: populated, assignOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Get single order ──────────────────────────────────────────── */
// NOTE: kept after all specific /:id/* routes
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Delete order (admin) ──────────────────────────────────────── */
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;