const User = require("../Model/UserModel");
const PendingUser = require("../Model/PendingUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ApiError = require("../Utilities/ApiError");
const emailTemplate = require("../Template/EmailTemplate");
const { verificationToken, AccessToken } = require("../Config/Token");
const sendEmail = require("../Config/NodeMailler");

const OTP_VALID_MINUTES = 5;
const BCRYPT_ROUNDS = 10;

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashValue = (value) => bcrypt.hash(value, BCRYPT_ROUNDS);

// Accepts "Bearer <token>" or a bare token
const cleanToken = (token) =>
  typeof token === "string" ? token.replace(/^Bearer\s+/i, "").trim() : token;

const otpExpiry = () => new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);

const otpEmailBody = (otp, intro) => `
  <p style="margin:0 0 24px; color:#cbd5e1; font-size:16px; line-height:28px;">
    ${intro}
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 24px;">
    <tr>
      <td align="center" bgcolor="#111827" style="padding:2px; background:#111827; border-radius:14px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td align="center" style="padding:28px 20px; border-radius:12px; background:#0B1120;">

              <p style="margin:0 0 14px; font-size:11px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; background:linear-gradient(90deg, #8B5CF6, #22D3EE); -webkit-background-clip:text; background-clip:text; color:#22D3EE;">
                Your Verification Code
              </p>

              <div style="color:#f8fafc; font-size:36px; font-weight:800; letter-spacing:12px; font-family:'Courier New',Courier,monospace; padding-left:12px;">
                ${otp}
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 6px; color:#94a3b8; font-size:14px; line-height:24px;">
    This code expires in <strong style="color:#e2e8f0;">${OTP_VALID_MINUTES} minutes</strong>.
  </p>

  <p style="margin:0; color:#64748b; font-size:13px; line-height:22px;">
    If you didn't request this, you can safely ignore this email.
  </p>
`;

// USER REFRESH TOKEN

const refreshTokenService = async (token) => {
  if (!token) {
    throw new ApiError(401, "Refresh token is required.");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.REFRESH_JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token has expired.");
    }

    throw new ApiError(401, "Invalid refresh token.");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (!user.refreshToken) {
    throw new ApiError(401, "Please login again.");
  }

  if (user.refreshToken !== token) {
    throw new ApiError(401, "Invalid refresh token.");
  }

  return AccessToken(user);
};

// USER FORGOT PASSWORD

const forgotPasswordService = async (email, role) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    role,
  });

  if (!user) {
    const pending = await PendingUser.findOne({ email: normalizedEmail });

    if (pending) {
      throw new ApiError(
        403,
        "Your email is not verified yet. Please sign up again to get a new code.",
      );
    }

    throw new ApiError(404, "User not found.");
  }

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Please verify your email before resetting your password.",
    );
  }

  const otp = generateOTP();

  user.otp = await hashValue(otp);
  user.otpExpire = otpExpiry();
  user.resetVerified = false; // every new request must verify its own OTP

  await user.save();

  const token = verificationToken(user, "reset-password");

  await sendEmail({
    to: user.email,
    subject: "Password Reset OTP - Netflix Clone",
    html: emailTemplate({
      heading: `Hello ${user.name}`,
      message: otpEmailBody(
        otp,
        "We received a request to reset your password. Your OTP is:",
      ),
    }),
  });

  return token;
};

// USER VERIFY OTP (sign-up and password reset)

const verifyOTPService = async (token, otp) => {
  token = cleanToken(token);

  if (!token) {
    throw new ApiError(401, "Verification token is required.");
  }

  if (!otp) {
    throw new ApiError(400, "OTP is required.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "verify-email" && decoded.type !== "reset-password") {
      throw new ApiError(401, "Invalid verification token.");
    }

    const enteredOtp = String(otp).trim();

    // ---- Sign-up verification ----
    if (decoded.type === "verify-email") {
      const pendingUser = await PendingUser.findById(decoded.id);

      if (!pendingUser) {
        throw new ApiError(404, "Registration session not found.");
      }

      if (!pendingUser.otp) {
        throw new ApiError(400, "OTP has already been used.");
      }

      if (
        !pendingUser.otpExpire ||
        pendingUser.otpExpire.getTime() < Date.now()
      ) {
        throw new ApiError(400, "OTP has expired.");
      }

      const matched = await bcrypt.compare(enteredOtp, pendingUser.otp);

      if (!matched) {
        throw new ApiError(400, "Invalid OTP.");
      }

      const existingEmail = await User.findOne({ email: pendingUser.email });

      if (existingEmail) {
        await PendingUser.deleteOne({ _id: pendingUser._id });
        throw new ApiError(400, "Email is already registered.");
      }

      const existingPhone = await User.findOne({ phone: pendingUser.phone });

      if (existingPhone) {
        await PendingUser.deleteOne({ _id: pendingUser._id });
        throw new ApiError(400, "Mobile number is already registered.");
      }

      // password is already bcrypt-hashed in `register`; stored as-is
      const user = await User.create({
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        phone: pendingUser.phone,
        isVerified: true,
        role: "user",
      });

      await PendingUser.deleteOne({ _id: pendingUser._id });

      return await User.findById(user._id).select(
        "-password -otp -refreshToken",
      );
    }

    // ---- Password reset verification ----
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (user.role !== decoded.role) {
      throw new ApiError(403, "Invalid user role.");
    }

    if (!user.otp) {
      throw new ApiError(400, "OTP has already been used.");
    }

    if (!user.otpExpire || user.otpExpire.getTime() < Date.now()) {
      throw new ApiError(400, "OTP has expired.");
    }

    const matched = await bcrypt.compare(enteredOtp, user.otp);

    if (!matched) {
      throw new ApiError(400, "Invalid OTP.");
    }

    user.resetVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;

    await user.save();

    return await User.findById(user._id).select("-password -otp -refreshToken");
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Verification token expired.");
    }

    if (err.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid verification token.");
    }

    throw err;
  }
};

// USER RESEND OTP (sign-up and password reset)

const resendOTPService = async (token) => {
  token = cleanToken(token);

  if (!token) {
    throw new ApiError(401, "Verification token is required.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const otp = generateOTP();
    const hashedOtp = await hashValue(otp);

    // ---- Sign-up ----
    if (decoded.type === "verify-email") {
      const pendingUser = await PendingUser.findById(decoded.id);

      if (!pendingUser) {
        throw new ApiError(
          404,
          "Registration session not found. Please register again.",
        );
      }

      pendingUser.otp = hashedOtp;
      pendingUser.otpExpire = otpExpiry();

      await pendingUser.save();

      try {
        await sendEmail({
          to: pendingUser.email,
          subject: "Your New OTP - Netflix Clone",
          html: emailTemplate({
            heading: `Hello ${pendingUser.name}`,
            message: otpEmailBody(otp, "Your new OTP is:"),
          }),
        });
      } catch (mailErr) {
        console.error("Email send error on resend OTP:", mailErr.message);
        throw new ApiError(
          503,
          "Unable to send OTP email right now. Please try again shortly.",
        );
      }

      return true;
    }

    // ---- Password reset ----
    if (decoded.type === "reset-password") {
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new ApiError(404, "User not found.");
      }

      user.otp = hashedOtp;
      user.otpExpire = otpExpiry();
      user.resetVerified = false;

      await user.save();

      try {
        await sendEmail({
          to: user.email,
          subject: "Password Reset OTP - Netflix Clone",
          html: emailTemplate({
            heading: `Hello ${user.name}`,
            message: otpEmailBody(otp, "Your new password reset OTP is:"),
          }),
        });
      } catch (mailErr) {
        console.error("Email send error on reset OTP:", mailErr.message);
        throw new ApiError(
          503,
          "Unable to send reset OTP email right now. Please try again shortly.",
        );
      }

      return true;
    }

    throw new ApiError(401, "Invalid verification token.");
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Verification token expired.");
    }

    if (err.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid verification token.");
    }

    throw err;
  }
};

// USER RESET PASSWORD

const resetPasswordService = async (token, password) => {
  token = cleanToken(token);

  if (!token) {
    throw new ApiError(401, "Reset password token is required.");
  }

  if (!password) {
    throw new ApiError(400, "Password is required.");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Reset password token has expired.");
    }

    throw new ApiError(401, "Invalid reset password token.");
  }

  if (decoded.type !== "reset-password") {
    throw new ApiError(400, "Invalid reset password token.");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (!user.resetVerified) {
    throw new ApiError(400, "Please verify OTP first.");
  }

  if (!user.password) {
    throw new ApiError(500, "User password is missing from database.");
  }

  const isSamePassword = await bcrypt.compare(password, user.password);

  if (isSamePassword) {
    throw new ApiError(
      400,
      "New password cannot be the same as the old password.",
    );
  }

  user.password = await hashValue(password);
  user.otp = null;
  user.otpExpire = null;
  user.resetVerified = false;
  user.refreshToken = "";

  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Changed Successfully",
      html: emailTemplate({
        heading: `Hello ${user.name}`,
        message: `
          Your password has been changed successfully.
          <br><br>
          If you did not perform this action, please contact support immediately.
          <br><br>
          Regards,<br>
          <b>Netflix Clone Team</b>
        `,
      }),
    });
  } catch (emailError) {
    console.log("Password change email failed:", emailError.message);
  }

  return true;
};

// USER NOTIFICATION

const createNotification = async ({ user, title, message, type }) => {
  try {
    const Notification = require("../Model/NotificationModel");

    await Notification.create({ user, title, message, type });
  } catch (err) {
    console.error("Notification Error:", err.message);
  }
};

module.exports = {
  forgotPasswordService,
  verifyOTPService,
  resendOTPService,
  resetPasswordService,
  sendEmail,
  refreshTokenService,
  createNotification,
};
