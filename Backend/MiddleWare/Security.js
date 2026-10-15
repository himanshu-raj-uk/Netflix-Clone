const rateLimit = require("express-rate-limit");

const Login_Limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    status: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

const Register_Limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: {
    status: false,
    message:
      "Registration limit exceeded. Please wait for 1 hour before trying again.",
  },
});

module.exports = { Login_Limit, Register_Limiter };
