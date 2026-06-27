const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
      name:     { type: String },
      img:      { type: String },
      price:    { type: String },
      variant:  { type: String },
      addons:   [{ label: String, price: String }],
      qty:      { type: Number, default: 1 },
      note:     { type: String },
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);