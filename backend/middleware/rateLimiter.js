const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: "Too many OTP requests, please wait a minute." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, please try again later." },
});

module.exports = { otpLimiter, authLimiter };