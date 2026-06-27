    const mongoose = require("mongoose");

const assignOrderSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryAgent", required: true },

  customerDetails: {
    fullName: String,
    mobile: String,
    email: String,
    deliveryAddress: String,
    houseNo: String,
    areaName: String,
    areaNo: String,
    city: String,
    pinCode: String,
  },

  deliveryPartnerDetails: {
    name: String,
    phone: String,
    email: String,
    vehicleType: String,
    vehicleNumber: String,
  },

  foodDetails: {
    itemName: String,
    variant: String,
    addons: String,
    quantity: Number,
    specialInstructions: String,
    baseAmount: Number,
    addonTotal: Number,
    gstAmount: Number,
    totalAmount: Number,
    paymentMethod: String,
  },

  status: {
    type: String,
    enum: ["Assigned", "Picked Up", "Out for Delivery", "Delivered", "Failed"],
    default: "Assigned",
  },

  assignedAt: { type: Date, default: Date.now },
  pickedUpAt: Date,
  deliveredAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("AssignOrder", assignOrderSchema);