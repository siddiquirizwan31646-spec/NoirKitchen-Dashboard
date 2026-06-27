const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["Percentage", "Flat"],
      default: "Percentage",
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value must be positive"],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      // only meaningful for Percentage type — caps the rupee discount
      type: Number,
      default: 0,
    },
    usageLimit: {
      // 0 = unlimited
      type: Number,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* Virtual: derive display status */
couponSchema.virtual("status").get(function () {
  if (!this.isActive) return "Inactive";
  if (this.expiryDate && this.expiryDate < new Date()) return "Expired";
  if (this.usageLimit && this.usedCount >= this.usageLimit) return "Limit Reached";
  return "Active";
});

couponSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Coupon", couponSchema);