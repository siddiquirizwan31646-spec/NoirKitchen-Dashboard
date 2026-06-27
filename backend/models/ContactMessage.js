const mongoose = require("mongoose");

const ContactMessageSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  subject: { type: String },
  message: { type: String, required: true },
  date:    { type: String },   
  time:    { type: String },   
  count:   { type: Number },   
}, { timestamps: true });

module.exports = mongoose.model("CustomerMessages", ContactMessageSchema);