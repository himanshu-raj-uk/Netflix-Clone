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

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      throw new ApiError(400, "Email is already registered");
    }

    const existingPhone = await User.findOne({
      phone,
    });

    if (existingPhone) {
      throw new ApiError(400, "Mobile number is already registered");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashOtp = await bcrypt.hash(otp, 10);

    await PendingUser.deleteOne({
      email: normalizedEmail,
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

    let emailSent = false;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await sendEmail({
          to: pendingUser.email,
          subject: "Welcome to Netflix Clone",
          html: emailTemplate({
            heading: `Hello ${pendingUser.name}`,
            message: `
              <div style="text-align: center;">
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6;">
                  Your registration has been received successfully.
                </p>

                <p style="margin: 0 0 10px; font-size: 15px; font-weight: 600;">
                  Your OTP is:
                </p>

                <div style="margin: 18px 0; text-align: center;">
                  <span style="
                    display: inline-block;
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: 8px;
                    line-height: 1.4;
                  ">
                    ${otp}
                  </span>
                </div>

                <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                  This OTP is valid for <strong>5 minutes</strong>.
                </p>

                <p style="margin: 22px 0 0; font-size: 14px; line-height: 1.6;">
                  Regards,<br>
                  <strong>Netflix Clone</strong>
                </p>
              </div>
            `,
          }),
        });

        emailSent = true;

        break;
      } catch (emailError) {
        console.error("OTP EMAIL ERROR:", emailError);
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!emailSent) {
      return res.status(503).json({
        status: false,
        message:
          "Registration saved, but OTP email could not be sent. Please try Resend OTP.",
        verificationToken: token,
        data: {
          email: pendingUser.email,
        },
      });
    }

    return res.status(201).json({
      status: true,
      message: "OTP sent successfully.",
      verificationToken: token,
      data: {
        email: pendingUser.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

// USER REGISTER BY GOOGLE

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      throw new ApiError(400, "Google authentication credential is required");
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is missing from server environment");

      throw new ApiError(500, "Google authentication is not configured");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new ApiError(401, "Invalid Google authentication");
    }

    const {
      sub: googleId,
      email,
      email_verified: emailVerified,
      name,
      picture,
    } = payload;

    if (!googleId || !email) {
      throw new ApiError(401, "Google account information is incomplete");
    }

    if (!emailVerified) {
      throw new ApiError(401, "Google email is not verified");
    }

    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({
      email: normalizedEmail,
    });

    if (user?.isBlocked) {
      throw new ApiError(403, "Your account has been blocked");
    }

    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email: normalizedEmail,
        googleId,
        authProvider: "google",
        isVerified: true,
        profileImage: {
          url: picture || "",
          public_id: "",
        },
      });
    } else {
      if (user.googleId && user.googleId !== googleId) {
        throw new ApiError(401, "Google account does not match this email");
      }

      user.googleId = googleId;
      user.isVerified = true;

      if (!user.authProvider) {
        user.authProvider = "google";
      }

      if (!user.name && name) {
        user.name = name;
      }

      if (picture && (!user.profileImage || !user.profileImage.url)) {
        user.profileImage = {
          url: picture,
          public_id: "",
        };
      }

      await user.save();
    }

    const accessToken = AccessToken(user);
    const refreshToken = RefreshToken(user);

    user.refreshToken = refreshToken;

    await user.save();

    const profileCompleted = Boolean(user.phone) && Boolean(user.password);

    return res.status(200).json({
      status: true,
      message: "Google sign-in successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
          profileCompleted,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err.message);

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
      throw new ApiError(404, "User not found");
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
      throw new ApiError(401, "Invalid email or password");
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
    console.log(otp, "this otp is valid for 5 min")

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
    const token = req.header("Authorization");

    if (!token) {
      throw new ApiError(401, "Verification token required");
    }

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
    for (const key of ["fullName", "houseNo", "area", "city", "state", "country"]) {
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

    // image: replace or remove
    if (req.file || removeImage === "true") {
      if (user.profileImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(user.profileImage.public_id);
        } catch (e) {
          console.log("OLD IMAGE DELETE ERROR:", e.message);
        }
      }
      user.profileImage = { url: "", public_id: "" };
    }

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "Netflix-Clone/profiles", resource_type: "image" },
            (err, r) => (err ? reject(err) : resolve(r))
          )
          .end(req.file.buffer);
      });
      user.profileImage = { url: result.secure_url, public_id: result.public_id };
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select(
      "-password -otp -refreshToken"
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
