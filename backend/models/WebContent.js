const mongoose = require("mongoose");

const BoxSchema = new mongoose.Schema({
  id:       { type: String, required: true },   // "box1" … "box5"
  label:    { type: String, default: "" },
  content:  { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  emoji:    { type: String, default: "" },
  icon:     { type: String, default: "" },
}, { _id: false });

const WebContentSchema = new mongoose.Schema({
  boxes: { type: [BoxSchema], default: [] },
}, {
  timestamps: true,
  collection: "WebContent",   // exact collection name in Atlas
});

module.exports = mongoose.model("WebContent", WebContentSchema);