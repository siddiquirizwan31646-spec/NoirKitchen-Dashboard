const mongoose = require("mongoose");
const MomentSchema = new mongoose.Schema({
  src:     { type: String, required: true },
  caption: { type: String, default: "" },
  tag:     { type: String, default: "" },
  shape:   { type: String, enum: ["portrait","landscape","square","wide","tall"], default: "square" },
  order:   { type: Number, default: 0 },
  active:  { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model("Moment", MomentSchema);