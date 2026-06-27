const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    email:              { type: String },
    foodId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', default: null },
    itemName:           { type: String, required: true },
    variant:            { type: String, default: 'Standard' },
    addons:             { type: String, default: '' },
    quantity:           { type: Number, required: true, min: 1 },
    isNewOrder:         { type: Boolean, default: true },
    specialInstructions:{ type: String, default: '' },
    orderDateTime:      { type: Date, default: Date.now },
    paymentMethod:      { type: String, default: 'Cash' },
    baseAmount:         { type: Number, required: true },
    addonTotal:         { type: Number, default: 0 },
    gstAmount:          { type: Number, default: 0 },
    totalAmount:        { type: Number, required: true },
    discountApplied:    { type: String, default: 'None' },
    estimatedDelivery:  { type: String, default: '30–45 minutes' },
    customerId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fullName:           { type: String, required: true },
    mobile:             { type: String, required: true },
    deliveryAddress:    { type: String, required: true },
    houseNo:            { type: String },
    areaName:           { type: String },
    areaNo:             { type: String },
    city:               { type: String },
    pinCode:            { type: String },
    orderStatus:        { type: String, enum: ['Placed','Preparing','Out for Delivery','Delivered','Cancelled'], default: 'Placed' },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgent', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);