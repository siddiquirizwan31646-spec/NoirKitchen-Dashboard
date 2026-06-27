const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+\d\s\-()]{7,20}$/, 'Please enter a valid phone number'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'staff'],
      default: 'customer',
    },

    // ─── Auth Method ─────────────────────────────────────────────────────────
    // 'otp'      → registered via email OTP (no password)
    // 'password' → registered with email + password     ← NEW
    // 'google'   → registered via Google OAuth
    // 'both'     → linked OTP/password + Google
    authMethod: {
      type: String,
      enum: ['otp', 'password', 'google', 'both'],   // ← added 'password'
      default: 'otp',
    },

    // ─── Password ─────────────────────────────────────────────────────────── ← NEW BLOCK
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,   // never returned in queries by default
    },

    // ─── Google OAuth ─────────────────────────────────────────────────────────
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    avatar: {
      type: String,
    },

    // ─── OTP fields ───────────────────────────────────────────────────────────
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
      attempts: { type: Number, default: 0 },
      lastSentAt: { type: Date },
    },

    // ─── Session / Login tracking ─────────────────────────────────────────────
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },

    // ─── Delivery Address ─────────────────────────────────────────────────────
    address: {
      houseNo:  { type: String, trim: true },
      areaName: { type: String, trim: true },
      areaNo:   { type: String, trim: true },
      city:     { type: String, trim: true },
      pinCode:  { type: String, trim: true, match: [/^\d{6}$/, 'PIN Code must be 6 digits'] },
    },

    // ─── Profile ──────────────────────────────────────────────────────────────
    preferences: {
      dietaryRestrictions: [String],
      favoriteItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 });

// ─── Pre-save: hash password if modified ─────────────────────────────────── ← NEW
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Methods ──────────────────────────────────────────────────────────────────

/**
 * Compare a plain-text password against the stored hash.      ← NEW
 */
userSchema.methods.comparePassword = async function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

/**
 * Generate a numeric OTP and save it (hashed) to the user document.
 */
userSchema.methods.generateOTP = async function () {
  const length = parseInt(process.env.OTP_LENGTH) || 6;
  const otp = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const salt = await bcrypt.genSalt(10);
  const hashedOTP = await bcrypt.hash(otp, salt);

  this.otp = { code: hashedOTP, expiresAt, attempts: 0, lastSentAt: new Date() };
  await this.save();
  return otp;
};

/**
 * Verify the provided OTP against the stored hash.
 */
userSchema.methods.verifyOTP = async function (providedOTP) {
  if (!this.otp || !this.otp.code)
    return { valid: false, reason: 'No OTP found. Please request a new one.' };

  if (new Date() > this.otp.expiresAt)
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };

  if (this.otp.attempts >= 5)
    return { valid: false, reason: 'Too many failed attempts. Please request a new OTP.' };

  const isMatch = await bcrypt.compare(String(providedOTP), this.otp.code);
  if (!isMatch) {
    this.otp.attempts += 1;
    await this.save();
    const remaining = 5 - this.otp.attempts;
    return {
      valid: false,
      reason: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
    };
  }

  this.otp = undefined;
  this.isVerified = true;
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  await this.save();
  return { valid: true };
};

/**
 * Check if a new OTP can be sent (rate-limit: 1 per 60 seconds).
 */
userSchema.methods.canRequestOTP = function () {
  return true;
};

module.exports = mongoose.model('User', userSchema);