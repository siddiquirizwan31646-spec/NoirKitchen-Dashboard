const express = require("express");
const router  = express.Router();
const Review  = require("../models/Review");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json({ message: "Review submitted", review });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

router.patch("/:id/helpful", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpful: 1 } },
      { new: true }
    );
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete review" });
  }
});

module.exports = router;