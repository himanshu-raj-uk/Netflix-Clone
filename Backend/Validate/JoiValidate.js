const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(20).required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  otp: Joi.string().length(6).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).max(20).required(),
});


module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema
}