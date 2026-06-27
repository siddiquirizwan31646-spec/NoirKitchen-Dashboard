const mongoose = require("mongoose");

const chefSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  role:       { type: String, required: true },
  tagline:    { type: String, required: true },
  story:      { type: String, required: true },
  image:      { type: String, required: true },
  experience: { type: Number },
  category:   { type: String, enum: ["chef", "waiter", "manager", "bartender", "host", "kitchen"], default: "chef" },
}, { timestamps: true });

module.exports = mongoose.model("Chef", chefSchema);