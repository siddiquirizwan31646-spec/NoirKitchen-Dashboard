// models/DeliveryAgent.js
const mongoose = require("mongoose");

const deliveryAgentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  image: String,
  vehicleType: { type: String, enum: ["Bike", "Scooter", "Bicycle", "Car"], default: "Bike" },
  vehicleNumber: String,
  status: { type: String, enum: ["Available", "On Delivery", "Offline"], default: "Offline" },
  rating: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  statusLog: [
    {
      status: { type: String },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
      changedAt: { type: Date, default: Date.now },
    }
  ],

}, { timestamps: true });

module.exports = mongoose.model("DeliveryAgent", deliveryAgentSchema);