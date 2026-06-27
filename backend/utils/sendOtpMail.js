const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpMail = async (to, otp) => {
  await resend.emails.send({
    from: "Noir Kitchen <onboarding@resend.dev>",
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