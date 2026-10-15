const User = require("../Model/UserModel");
const PendingUser = require("../Model/PendingUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ApiError = require("../Utilities/ApiError");
const emailTemplate = require("../Template/EmailTemplate");
const { verificationToken, AccessToken } = require("../Config/Token");
const sendEmail = require("../Config/NodeMailler");

const OTP_VALID_MINUTES = 5;

const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

// Accepts "Bearer <token>" or a bare token

const cleanToken = (token) =>
    typeof token === "string" ? token.replace(/^Bearer\s+/i, "").trim() : token;

const otpExpiry = () => new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);

const otpEmailBody = (otp, intro) => `
    <div style="text-align: center;">
      <p style="margin: 0 0 12px; font-size: 15px;">${intro}</p>

      <div style="margin: 18px 0;">
        <span style="font-size: 28px; font-weight: 700; letter-spacing: 8px;">
          ${otp}
        </span>
      </div>

      <p style="margin: 0; font-size: 14px;">
        This OTP is valid for <strong>${OTP_VALID_MINUTES} minutes</strong>.
      </p>
    </div>
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
        // Signed up but never entered the OTP -> only exists in PendingUser
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

    user.otp = await bcrypt.hash(otp, 10);
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
                "We received a request to forgot your password. Your OTP is:",
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
                throw new ApiError(400, "Email is already registered.");
            }

            const existingPhone = await User.findOne({ phone: pendingUser.phone });

            if (existingPhone) {
                throw new ApiError(400, "Mobile number is already registered.");
            }

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
        const hashedOtp = await bcrypt.hash(otp, 10);

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

            await sendEmail({
                to: pendingUser.email,
                subject: "Your New OTP - Netflix Clone",
                html: emailTemplate({
                    heading: `Hello ${pendingUser.name}`,
                    message: otpEmailBody(otp, "Your new OTP is:"),
                }),
            });

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

            await sendEmail({
                to: user.email,
                subject: "Password Reset OTP - Netflix Clone",
                html: emailTemplate({
                    heading: `Hello ${user.name}`,
                    message: otpEmailBody(otp, "Your new password reset OTP is:"),
                }),
            });

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

    user.password = await bcrypt.hash(password, 12);
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
        // Adjust this path to your Notification model
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
