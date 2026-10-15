const jwt = require("jsonwebtoken");

const verificationToken = (user, type) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      type,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "10m",
    }
  );
};

const AccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

const RefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = {
  verificationToken,
  AccessToken,
  RefreshToken,
};