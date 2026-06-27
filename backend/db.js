const mongoose = require("mongoose");
const dns = require("dns");

// Force use of Cloudflare + Google DNS to fix ECONNREFUSED
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });
    console.log(`MongoDB connected sucessfully: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

module.exports = connectDB;