    const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");

/* ─── helpers ─────────────────────────────────────────────────────── */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);


router.get(
  "/",
  asyncHandler(async (req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  })
);

/* ─── GET /api/coupons/:id ─────────────────────────────────────────
   Single coupon by ID.
──────────────────────────────────────────────────────────────────── */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  })
);

/* ─── POST /api/coupons ────────────────────────────────────────────
   Create a new coupon.
   Body: { code, discountType, discountValue, minOrderAmount,
           maxDiscount, usageLimit, expiryDate }
──────────────────────────────────────────────────────────────────── */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      expiryDate,
    } = req.body;

    /* basic validation */
    if (!code || !discountValue || !expiryDate) {
      return res.status(400).json({
        message: "code, discountValue, and expiryDate are required.",
      });
    }

    /* duplicate-code check (gives a friendlier message than Mongo's E11000) */
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        message: `Coupon code "${code.toUpperCase()}" is already in use.`,
      });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount: maxDiscount || 0,
      usageLimit: usageLimit || 0,
      expiryDate,
    });

    res.status(201).json(coupon);
  })
);

/* ─── PATCH /api/coupons/:id ───────────────────────────────────────
   Partial update — used by the admin to toggle isActive, etc.
──────────────────────────────────────────────────────────────────── */
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  })
);

/* ─── POST /api/coupons/validate ───────────────────────────────────
   Customer-facing: validate & return discount for a given order total.
   Body: { code, orderTotal }
   Returns: { valid, discountAmount, message }
──────────────────────────────────────────────────────────────────── */
router.post(
  "/validate",
  asyncHandler(async (req, res) => {
    const { code, orderTotal } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, message: "No coupon code provided." });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ valid: false, message: "Coupon not found." });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ valid: false, message: "This coupon is inactive." });
    }
    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ valid: false, message: "This coupon has expired." });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ valid: false, message: "This coupon has reached its usage limit." });
    }
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}.`,
      });
    }

    /* calculate discount */
    let discountAmount = 0;
    if (coupon.discountType === "Percentage") {
      discountAmount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      // Flat
      discountAmount = coupon.discountValue;
    }

    // never discount more than the order total
    discountAmount = Math.min(discountAmount, orderTotal);

    res.json({
      valid: true,
      discountAmount: Math.round(discountAmount * 100) / 100,
      couponId: coupon._id,
      message: `Coupon applied! You save ₹${discountAmount.toFixed(2)}.`,
    });
  })
);

/* ─── POST /api/coupons/redeem ─────────────────────────────────────
   Call this when an order is PLACED to increment usedCount.
   Body: { code }
──────────────────────────────────────────────────────────────────── */
router.post(
  "/redeem",
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    const coupon = await Coupon.findOneAndUpdate(
      { code: code?.toUpperCase() },
      { $inc: { usedCount: 1 } },
      { new: true }
    );
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon redeemed", usedCount: coupon.usedCount });
  })
);

/* ─── DELETE /api/coupons/:id ──────────────────────────────────────
   Permanently remove a coupon.
──────────────────────────────────────────────────────────────────── */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted" });
  })
);

module.exports = router;