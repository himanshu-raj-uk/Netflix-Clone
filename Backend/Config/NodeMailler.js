const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_USER_NAME,
    pass: process.env.GOOGLE_USER_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html }) => {
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