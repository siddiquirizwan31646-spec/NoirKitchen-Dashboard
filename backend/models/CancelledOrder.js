const mongoose = require("mongoose");

const cancelledOrderSchema = new mongoose.Schema(
  {
    orderId:        { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

    // Snapshot of the order at the time it was cancelled
    fullName:       String,
    mobile:         String,
    phone:          String,
    itemName:       String,
    quantity:       Number,
    totalAmount:    Number,
    discountAmount: Number,
    discountType:   String,
    discountValue:  Number,
    couponCode:     String,
    orderCreatedAt: Date,   // when the original order was placed

    // Cancellation details
    reason:         { type: String, required: true },
    cancelledAt:    { type: Date, default: Date.now },
  },
  { timestamps: true } // adds createdAt/updatedAt for the cancellation record itself
);

module.exports = mongoose.model("CancelledOrder", cancelledOrderSchema, "cancelledOrder");