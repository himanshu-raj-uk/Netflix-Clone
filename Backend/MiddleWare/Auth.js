const jwt = require("jsonwebtoken");
const User = require("../Model/UserModel");
const ApiError = require("../Utilities/ApiError");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../Config/Cloudinary");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      throw new ApiError(401, "Access token is required.");
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const foundUser = await User.findById(decoded.id).select("-password");

    if (!foundUser) {
      throw new ApiError(401, "User account no longer exists. Please login again.");
    }

    if (foundUser.isBlocked) {
      throw new ApiError(403, "Your account has been blocked.");
    }

    req.user = foundUser;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Access token expired."));
    }

    if (err.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid access token."));
    }

    next(err);
  }
};

const roleAuth = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "Please login first.");
      }

      if (!roles.includes(req.user.role)) {
        throw new ApiError(
          403,
          `Access denied. Only ${roles.join(" / ")} can access this route.`,
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "all-services",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

const adminTokenAuth = (req, res, next) => {
  try {
    const token = req.header("AdminToken");

    if (!token) {
      throw new ApiError(401, "Admin token is required.");
    }

    if (token !== process.env.ADMIN_TOKEN) {
      throw new ApiError(403, "Invalid admin token.");
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  auth,
  roleAuth,
  upload,
  adminTokenAuth,
};