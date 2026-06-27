const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, default: "" },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    icon: { type: String, default: "" },     
    emoji: { type: String, default: "" },       
    imageUrl: { type: String, default: "" },   
    link: { type: String, default: "" },        
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date, default: null },  
    priority: { type: Number, default: 0 },      
  },
  { timestamps: true, collection: "Notification" }
);

module.exports = mongoose.model("Notification", notificationSchema);