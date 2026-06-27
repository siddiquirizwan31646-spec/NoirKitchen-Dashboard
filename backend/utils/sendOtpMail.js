const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Noir Kitchen" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your Noir Kitchen OTP",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fdf3ed;border-radius:16px">
        <h2 style="color:#1a1a1a;margin-bottom:8px">Your verification code</h2>
        <p style="color:#555;margin-bottom:24px">Use this OTP to log in to Noir Kitchen. It expires in 10 minutes.</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#E07B39;text-align:center;padding:16px;background:#fff;border-radius:12px">
          ${otp}
        </div>
        <p style="color:#999;font-size:12px;margin-top:24px;text-align:center">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpMail };