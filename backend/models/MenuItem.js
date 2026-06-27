const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    { type: String, required: true },
  price:       { type: String, required: true },
  desc:        { type: String, required: true },
  ingredients: { type: String },
  img:         { type: String },
  pairing:     { type: String },

  veg:         { type: Boolean, default: true },
  vegan:       { type: Boolean, default: false },       // ← add
  spice:       { type: Number, default: 0, min: 0, max: 4 },
  chef:        { type: Boolean, default: false },
  signature:   { type: Boolean, default: false },
  featured:    { type: Boolean, default: false },       // ← add
  available:   { type: Boolean, default: true },
  images: [{ type: String }],
  prepTime:    { type: Number },                        // ← add (minutes)
  rating:      { type: Number, min: 0, max: 5 },        // ← add

  variants: [                                           // ← add
    {
      label: { type: String },
      price: { type: String }
    }
  ],

  addons: [                                             // ← add
    {
      label: { type: String },
      price: { type: String }
    }
  ]

}, { timestamps: true }); // createdAt/updatedAt already handled by timestamps

module.exports = mongoose.model("MenuItem", menuItemSchema);