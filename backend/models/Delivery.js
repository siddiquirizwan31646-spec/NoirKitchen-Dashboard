// models/Delivery.js
const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryAgent" },
  deliveryAddress: { type: String, required: true },
  status: {
    type: String,
    enum: ["Unassigned", "Assigned", "Picked Up", "Out for Delivery", "Delivered", "Failed"],
    default: "Unassigned",
  },
  assignedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  estimatedTime: Number, // minutes
  deliveryFee: { type: Number, default: 0 },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model("Delivery", deliverySchema);