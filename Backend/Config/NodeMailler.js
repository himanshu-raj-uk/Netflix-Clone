const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_USER_NAME,
    pass: process.env.GOOGLE_USER_PASSWORD,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

const sendEmail = async ({ to, subject, html }) => {
  // 1. Try Resend via HTTPS (REST API) - ideal for Render/Cloud where SMTP is blocked
  if (resend) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "Netflix Clone <onboarding@resend.dev>";
      const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
      });

      if (result?.data?.id) {
        return result.data;
      }
      console.warn("Resend email warning, trying Gmail fallback:", result?.error);
    } catch (resendError) {
      console.warn("Resend email failed, trying Gmail fallback:", resendError.message);
    }
  }

  // 2. Fallback to Gmail SMTP via Nodemailer
  try {
    const info = await transporter.sendMail({
      from: `"Netflix Clone" <${process.env.GOOGLE_USER_NAME}>`,
      to,
      subject,
      html,
    });

    return info;
  } catch (error) {
    console.error("Gmail email sending failed:", error.message);
    throw error;
  }
};

module.exports = sendEmail;