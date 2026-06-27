// routes/payments.js
const express = require("express");
const router = express.Router();
const Order  = require("../models/Order");
const { protect, adminOnly } = require("../middleware/auth");

// ─── helpers ────────────────────────────────────────────────────────────────

function derivePaymentStatus(o) {
  if (o.paymentStatus) return o.paymentStatus;
  const s = (o.orderStatus || "").toLowerCase();
  if (s === "cancelled")  return "Cancelled";
  if (s === "refunded")   return "Refunded";
  if (o.paymentMethod === "Cash" || o.paymentMethod === "COD") {
    return s === "delivered" ? "Paid" : "Pending";
  }
  // Online payments — treat as Paid unless cancelled/refunded
  return "Paid";
}

function orderToPayment(o) {
  const method = (o.paymentMethod === "Cash") ? "COD" : (o.paymentMethod || "COD");
  const discountAmount = o.discountAmount ?? o.discount ?? 0;

  return {
    _id:             o._id,
    order:           { _id: o._id },
    customerName:    o.fullName        || o.customerName  || "Unknown",
    customerPhone:   o.mobile          || o.customerPhone || "",
    customerEmail:   o.email           || o.customerEmail || "",
    transactionId:   o.transactionId   || ("T" + o._id.toString().slice(-9).toUpperCase()),
    amount:          o.totalAmount     ?? o.baseAmount    ?? 0,
    taxAmount:       o.gstAmount       ?? o.taxAmount     ?? 0,
    discountAmount:  discountAmount,
    discountApplied: o.discountApplied || (discountAmount > 0 ? o.couponCode : null) || "—",
    paymentMethod:   method,
    gatewayName:     method === "COD" ? "COD" : (o.gatewayName || "Razorpay"),
    paymentStatus:   derivePaymentStatus(o),
    orderStatus:     o.orderStatus     || "",
    refundReason:    o.refundReason    || "",
    createdAt:       o.createdAt,
    updatedAt:       o.updatedAt,
  };
}
// Precise date boundaries in IST (+05:30)
function getDateBoundaries() {
  const now = new Date();

  // Today: midnight IST → convert to UTC
  const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5h30m in ms
  const nowIST = new Date(now.getTime() + IST_OFFSET);

  const startOfTodayIST = new Date(Date.UTC(
    nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()
  ));
  const startOfToday = new Date(startOfTodayIST.getTime() - IST_OFFSET);

  // This week: last 7 days from start of today
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  // This month: 1st of current month IST
  const startOfMonthIST = new Date(Date.UTC(
    nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1
  ));
  const startOfMonth = new Date(startOfMonthIST.getTime() - IST_OFFSET);

  // This year: Jan 1st IST
  const startOfYearIST = new Date(Date.UTC(nowIST.getUTCFullYear(), 0, 1));
  const startOfYear = new Date(startOfYearIST.getTime() - IST_OFFSET);

  return { startOfToday, startOfWeek, startOfMonth, startOfYear };
}

// ─── GET /api/payments  (paginated list) ────────────────────────────────────

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      page = 1, limit = 15,
      status, method, search,
      from, to, minAmount, maxAmount,
    } = req.query;

    const filter = {};

    // Payment status → map to orderStatus logic
    if (status) {
      if (status === "Paid") {
        // Delivered COD  OR  any non-COD order that isn't cancelled/refunded
        filter.$or = [
          { orderStatus: "Delivered" },
          { paymentMethod: { $nin: ["Cash", "COD"] }, orderStatus: { $nin: ["Cancelled", "Refunded", "Failed"] } },
        ];
      } else if (status === "Pending") {
        filter.paymentMethod = { $in: ["Cash", "COD"] };
        filter.orderStatus   = { $nin: ["Delivered", "Cancelled", "Refunded", "Failed"] };
      } else if (status === "Cancelled") {
        filter.orderStatus = "Cancelled";
      } else if (status === "Refunded") {
        filter.orderStatus = "Refunded";
      } else if (status === "Failed") {
        filter.orderStatus = "Failed";
      }
    }

    if (method) {
      filter.paymentMethod = (method === "COD") ? { $in: ["Cash", "COD"] } : method;
    }

    if (search) {
      filter.$or = [
        { fullName:      { $regex: search, $options: "i" } },
        { customerName:  { $regex: search, $options: "i" } },
        { mobile:        { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        // Include the full "to" day (till 23:59:59.999)
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    if (minAmount || maxAmount) {
      filter.totalAmount = {};
      if (minAmount) filter.totalAmount.$gte = Number(minAmount);
      if (maxAmount) filter.totalAmount.$lte = Number(maxAmount);
    }

    const skip   = (Number(page) - 1) * Number(limit);
    const orders = await Order.find(filter)
  .lean()
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(Number(limit));
    const total  = await Order.countDocuments(filter);

    res.json({ payments: orders.map(orderToPayment), total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/payments/summary ──────────────────────────────────────────────

// routes/payments.js — only the summary route changes

router.get("/summary", protect, adminOnly, async (req, res) => {
  try {
    const { startOfToday, startOfWeek, startOfMonth, startOfYear } = getDateBoundaries();

    const all = await Order.find().lean();

    // ── Classify orders ──────────────────────────────────────────────────
    const paidOrders = all.filter(o => {
      const s = (o.orderStatus || "").toLowerCase();
      const isCOD = o.paymentMethod === "Cash" || o.paymentMethod === "COD";
      return isCOD ? s === "delivered" : !["cancelled", "refunded", "failed"].includes(s);
    });

    const pendingOrders = all.filter(o => {
      const s = (o.orderStatus || "").toLowerCase();
      const isCOD = o.paymentMethod === "Cash" || o.paymentMethod === "COD";
      return isCOD && !["delivered", "cancelled", "refunded", "failed"].includes(s);
    });

    const refundedOrders = all.filter(o =>
      (o.orderStatus || "").toLowerCase() === "refunded"
    );
    const failedOrders = all.filter(o =>
      (o.orderStatus || "").toLowerCase() === "failed"
    );

    // ── Revenue ──────────────────────────────────────────────────────────
    const sumAmount = (arr) =>
      arr.reduce((s, o) => s + (o.totalAmount ?? o.baseAmount ?? 0), 0);

    const inRange = (arr, from) =>
      arr.filter(o => new Date(o.createdAt) >= from);

    const totalRevenue   = sumAmount(paidOrders);
    const todayRevenue   = sumAmount(inRange(paidOrders, startOfToday));
    const weeklyRevenue  = sumAmount(inRange(paidOrders, startOfWeek));
    const monthlyRevenue = sumAmount(inRange(paidOrders, startOfMonth));
    const yearlyRevenue  = sumAmount(inRange(paidOrders, startOfYear));
    const refundedAmount = sumAmount(refundedOrders);

    // ── Total Discounts: sum discountAmount from ALL orders ──────────────
    // This is accurate because every order stores the actual rupee discount applied
    // (whether from a % coupon capped at maxDiscount, or a flat coupon)
    const totalDiscounts = all.reduce((s, o) => s + (o.discountAmount ?? 0), 0);

    // ── Net Profit ───────────────────────────────────────────────────────
    const netProfit = totalRevenue - refundedAmount - totalDiscounts;

    const avgOrderValue = paidOrders.length
      ? Math.round(totalRevenue / paidOrders.length)
      : 0;

    res.json({
      totalRevenue,
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      totalOrders:     all.length,
      avgOrderValue,
      pendingPayments: pendingOrders.length,
      failedPayments:  failedOrders.length,
      refundedAmount,
      totalDiscounts,
      netProfit,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PATCH /api/payments/:id/refund ─────────────────────────────────────────

router.patch("/:id/refund", protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus   = "Refunded";
    order.paymentStatus = "Refunded";
    order.refundReason  = reason || "";
    order.refundedAt    = new Date();
    await order.save();

    res.json({ message: "Refund processed", payment: orderToPayment(order) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;