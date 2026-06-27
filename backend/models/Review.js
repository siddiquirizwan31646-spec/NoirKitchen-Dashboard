const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      name:   { type: String, required: true, trim: true },
      email:  { type: String, required: true, trim: true, lowercase: true },
      userId: { type: String, default: null },
    },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for fast sorting by date and rating
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
