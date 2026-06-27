const express = require("express");
const router  = express.Router();
const Cart    = require("../models/Cart");
const { protect } = require("../middleware/auth");

/* ── Get cart ──────────────────────────────────────────── */
router.get("/", protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate("items.menuItemId");
    if (!cart) cart = { items: [] };
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Add / update item ─────────────────────────────────── */
router.post("/", protect, async (req, res) => {
  try {
    const { menuItemId, name, img, price, variant, addons, qty, note } = req.body;
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

    const idx = cart.items.findIndex(
      (i) => i.menuItemId.toString() === menuItemId && i.variant === variant
    );
    if (idx > -1) {
      cart.items[idx].qty += qty || 1;
    } else {
      cart.items.push({ menuItemId, name, img, price, variant, addons, qty: qty || 1, note });
    }
    await cart.save();
    res.json({ message: "Cart updated", cart });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ── Remove item ───────────────────────────────────────── */
router.delete("/:itemId", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
    await cart.save();
    res.json({ message: "Item removed", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Clear cart ────────────────────────────────────────── */
router.delete("/", protect, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user._id });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;