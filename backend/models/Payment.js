const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order:          { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  customerName:   { type: String, required: true },
  customerPhone:  String,
  customerEmail:  String,
  transactionId:  { type: String, unique: true, sparse: true },
  amount:         { type: Number, required: true },
  taxAmount:      { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ["UPI", "Card", "NetBanking", "Wallet", "COD"],
    default: "UPI",
  },
  gatewayName: {
    type: String,
    enum: ["Razorpay", "Cashfree", "PhonePe", "Stripe", "PayPal", "COD"],
    default: "Razorpay",
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Pending", "Failed", "Refunded", "Cancelled"],
    default: "Pending",
  },
  orderStatus:     String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  refundReason:    String,
  refundedAt:      Date,
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);