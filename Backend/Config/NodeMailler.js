const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GOOGLE_USER_NAME,
    pass: process.env.GOOGLE_USER_PASSWORD,
  },
  pool: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const sendViaNodemailer = (mailOptions, retriesLeft) =>
  new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        if (retriesLeft > 0) {
          console.warn(
            `Nodemailer attempt failed (${err.message}), retrying... (${retriesLeft} left)`,
          );
          return resolve(sendViaNodemailer(mailOptions, retriesLeft - 1));
        }
        return reject(err);
      }
      resolve(info);
    });
  });

const sendViaResend = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Resend failed");
  }

  return data;
};

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"Netflix Clone" <${process.env.GOOGLE_USER_NAME}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await sendViaNodemailer(mailOptions, 2);
    console.log("Email sent via Nodemailer.");
    return info;
  } catch (nodemailerError) {
    console.error("Nodemailer failed after retries:", nodemailerError.message);
    console.log("Falling back to Resend...");

    try {
      const data = await sendViaResend({ to, subject, html });
      console.log("Email sent via Resend (fallback).");
      return data;
    } catch (resendError) {
      console.error("Resend fallback also failed:", resendError.message);
      throw resendError;
    }
  }
};

module.exports = sendEmail;
