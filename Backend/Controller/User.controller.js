const bcrypt = require("bcrypt");
const User = require("../Model/UserModel");
const PendingUser = require("../Model/PendingUser");
const jwt = require("jsonwebtoken");
const ApiError = require("../Utilities/ApiError");
const sendEmail = require("../Config/NodeMailler");
const cloudinary = require("../Config/Cloudinary");
const upload = require("../MiddleWare/upload");
const emailTemplate = require("../Template/EmailTemplate");

const {
  forgotPasswordService,
  verifyOTPService,
  resetPasswordService,
  resendOTPService,
} = require("../MiddleWare/AllServices");

const { AccessToken, RefreshToken } = require("../Config/Token");

// USER REGISTER

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) throw new ApiError(400, "Email is already registered");

    const existingPhone = await User.findOne({ phone });
    if (existingPhone)
      throw new ApiError(400, "Mobile number is already registered");

    const hashPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashOtp = await bcrypt.hash(otp, 10);

    await PendingUser.deleteOne({
      $or: [{ email: normalizedEmail }, { phone }],
    });

    const pendingUser = await PendingUser.create({
      name,
      email: normalizedEmail,
      password: hashPassword,
      phone,
      otp: hashOtp,
      otpExpire: new Date(Date.now() + 5 * 60 * 1000),
    });

    const token = jwt.sign(
      { id: pendingUser._id.toString(), type: "verify-email", role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    // Respond immediately — don't make the user wait on the email round-trip
    res.status(201).json({
      status: true,
      message: "OTP sent successfully.",
      verificationToken: token,
      data: { email: pendingUser.email },
    });

    sendEmail({
      to: pendingUser.email,
      subject: "Your Netflix Clone verification code",
      html: emailTemplate({
        heading: `Hello ${pendingUser.name},`,
        message: `
      <p style="margin:0 0 24px; color:#cbd5e1; font-size:16px; line-height:28px;">
        Thanks for signing up. Use the code below to verify your email address and finish creating your account.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 24px;">
        <tr>
          <td align="center" bgcolor="#111827" style="padding:2px; background:#111827; border-radius:14px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td align="center" style="padding:28px 20px; border-radius:12px; background:#0B1120;">

                  <p style="margin:0 0 14px; font-size:11px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#22D3EE;">
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
        This code expires in <strong style="color:#e2e8f0;">5 minutes</strong>.
      </p>

      <p style="margin:0; color:#64748b; font-size:13px; line-height:22px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `,
      }),
    }).catch((emailError) => {
      console.error("OTP EMAIL ERROR (background):", emailError.message);
    });
  } catch (err) {
    next(err);
  }
};

// USER LOGIN

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      throw new ApiError(404, "Email not found");
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been blocked");
    }
    if (!user.password) {
      throw new ApiError(
        400,
        "This account uses Google sign-in. Please continue with Google.",
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError(401, "Password is wrong");
    }

    const accessToken = AccessToken(user);
    const refreshToken = RefreshToken(user);

    user.refreshToken = refreshToken;

    await user.save();

    res.status(200).json({
      status: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          address: user.address,
          phone: user.phone,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// USER VERIFY OTP

const verifyOTP = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      throw new ApiError(401, "Verification token is required.");
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const { otp } = req.body;

    const user = await verifyOTPService(token, String(otp));

    let message;

    if (user.resetVerified) {
      message = "Reset OTP verified successfully.";
    } else {
      message =
        user.role === "admin"
          ? "Admin account verified successfully."
          : "User account verified successfully.";
    }

    res.status(200).json({
      status: true,
      message,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        resetVerified: user.resetVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// USER RESEND OTP

const ResendOtp = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      throw new ApiError(401, "Verification token required");
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    await resendOTPService(token, "user");

    res.status(200).json({
      status: true,
      message: "OTP resent successfully.",
    });
  } catch (err) {
    next(err);
  }
};

// USER FORGOT PASSWORD

const forgotPasswords = async (req, res, next) => {
  try {
    const token = await forgotPasswordService(req.body.email, "user");

    res.status(200).json({
      status: true,
      message: "OTP sent successfully.",
      token,
    });
  } catch (err) {
    next(err);
  }
};

// USER RESET PASSWORD

const resetPasswords = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      throw new ApiError(401, "Reset token required");
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    await resetPasswordService(token, req.body.password, "user");

    res.status(200).json({
      status: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    next(err);
  }
};

// USER CHANGE PASSWORD

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const matched = await bcrypt.compare(currentPassword, user.password);

    if (!matched) {
      return res.status(401).json({
        status: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// USER PROFILE

const profile = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Please login first.");
    }

    const user = req.user.toObject();

    delete user.password;
    delete user.otp;
    delete user.refreshToken;

    res.status(200).json({
      status: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// USER UPDATE PROFILE

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new ApiError(404, "User not found"));

    const { name, email, phone, address, removeImage } = req.body;

    let addr;
    try {
      addr = typeof address === "string" ? JSON.parse(address) : address || {};
    } catch {
      return next(new ApiError(400, "Invalid address data"));
    }

    const clean = {
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      address: {
        fullName: addr.fullName?.trim(),
        houseNo: addr.houseNo?.trim(),
        area: addr.area?.trim(),
        city: addr.city?.trim(),
        state: addr.state?.trim(),
        country: addr.country?.trim(),
        pincode: addr.pincode?.trim(),
      },
    };

    // required checks
    if (!clean.name || clean.name.length < 2)
      return next(new ApiError(400, "Name must be at least 2 characters"));
    if (!clean.email || !/^\S+@\S+\.\S+$/.test(clean.email))
      return next(new ApiError(400, "Valid email is required"));
    if (user.authProvider !== "google" && !/^\d{10}$/.test(clean.phone || ""))
      return next(new ApiError(400, "Phone must be 10 digits"));
    for (const key of [
      "fullName",
      "houseNo",
      "area",
      "city",
      "state",
      "country",
    ]) {
      if (!clean.address[key])
        return next(new ApiError(400, `Address ${key} is required`));
    }
    if (!/^\d{6}$/.test(clean.address.pincode || ""))
      return next(new ApiError(400, "Pincode must be 6 digits"));

    // google users can't change email
    if (user.authProvider === "google") clean.email = user.email;

    user.name = clean.name;
    user.email = clean.email;
    if (clean.phone) user.phone = clean.phone;
    user.address = clean.address;

    console.log("FILE RECEIVED:", req.file);

    console.log("REMOVE IMAGE:", removeImage);

    // image: replace or remove
    if (req.file || removeImage === "true") {
      if (user.profileImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(user.profileImage.public_id);
        } catch (error) {
          console.error("OLD IMAGE DELETE ERROR:", error.message);
        }
      }

      user.profileImage = { url: "", public_id: "" };
    }

    if (req.file) {
      user.profileImage = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }
    await user.save();

    const updatedUser = await User.findById(user._id).select(
      "-password -otp -refreshToken",
    );

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "value";
      return next(new ApiError(409, `This ${field} is already in use`));
    }
    next(error);
  }
};

// USER LOGOUT

const logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;

    await req.user.save();

    res.status(200).json({
      status: true,
      message: "Logout successful",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  ResendOtp,
  forgotPasswords,
  resetPasswords,
  changePassword,
  profile,
  updateProfile,
  logout,
};
