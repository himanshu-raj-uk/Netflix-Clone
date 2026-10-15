const express = require("express");
const app = express.Router();
const validate = require("../MiddleWare/Validate");
const { auth } = require("../MiddleWare/Auth");
const upload = require("../MiddleWare/upload");
const { Login_Limit, Register_Limiter } = require("../MiddleWare/Security");

const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../Validate/JoiValidate");

const {
  register,
  login,
  logout,
  changePassword,
  profile,
  updateProfile,
  verifyOTP,
  forgotPasswords,
  resetPasswords,
  ResendOtp,
} = require("../Controller/User.controller");

const {
  getMovieLists,
  addMovieToList,
  removeMovieFromList,
} = require("../Controller/MovieList.controller");



app.post("/register", validate(registerSchema), Register_Limiter, register);

app.post("/login", validate(loginSchema), Login_Limit, login);

app.post("/verify-otp", validate(verifyOtpSchema), verifyOTP);

app.post("/resend-otp", ResendOtp);

app.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswords);

app.put("/change-password", auth, changePassword);

app.post("/reset-password", validate(resetPasswordSchema), resetPasswords);

app.get("/movie-lists",auth, getMovieLists);

app.post("/:listType/:movieId",auth,addMovieToList);

app.delete("/:listType/:movieId",auth, removeMovieFromList);

app.post("/logout", auth, logout);

app.get("/profile", auth, profile);

app.put("/update-profile", auth, upload.single("profileImage"), updateProfile);

module.exports = app;
