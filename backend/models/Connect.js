const mongoose = require("mongoose");

const connectSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Guest" },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

// 3rd arg pins the collection name to "Connect" (otherwise mongoose
// would pluralize/lowercase it to "connects")
module.exports = mongoose.model("Connect", connectSchema, "Connect");