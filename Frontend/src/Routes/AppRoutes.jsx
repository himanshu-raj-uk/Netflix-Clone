import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "../Pages/Home";

// Lazy-loaded pages
const loadRegister = () => import("../Pages/Register");
const loadLogin = () => import("../Pages/Login");
const loadTrailer = () => import("../Pages/Trailer");

const Register = lazy(loadRegister);
const Login = lazy(loadLogin);
const Trailer = lazy(loadTrailer);

// Future routes — enable when these pages exist
const loadVerifyOTP = () => import("../Pages/VerifyOTP");
const loadResendOtp = () => import("../Pages/ResendOTP");
const loadForgotPassword = () => import("../Pages/ForgotPassword");

const loadChangePassword = () => import("../Pages/ChangePassword");
const loadResetPassword = () => import("../Pages/ResetPassword");

const loadProfilePage = () => import("../Pages/Profile");
// const loadDashboard = () => import("../Components/Pages/Dashboard");

const loadWatchlist = () => import("../Components/Watchlist");
const loadLikelist = () => import("../Components/LikeList");

const VerifyOTP = lazy(loadVerifyOTP);
const ResendOtp = lazy(loadResendOtp);
const ForgotPassword = lazy(loadForgotPassword);

const ChangePassword = lazy(loadChangePassword);
const ResetPassword = lazy(loadResetPassword);

const ProfilePage = lazy(loadProfilePage);
// const Dashboard = lazy(loadDashboard);

const Watchlist = lazy(loadWatchlist);
const Likelist = lazy(loadLikelist);

// Future route protection — enable when required

// Only logged-in users can open these pages
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("userToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Only logged-out users can open these pages
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("userToken");

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            minWidth: "300px",
            maxWidth: "calc(100vw - 32px)",
            padding: "12px 16px",
            borderRadius: "16px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.14)",
          },
        }}
      />

      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-black">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-red-600" />
          </div>
        }
      >
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Register */}
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Login */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Change password (logged-in users only) */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Trailer */}
          <Route path="/watch/:mediaType/:id" element={<Trailer />} />

          {/* Future routes — uncomment when their pages exist */}

          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/resend-otp" element={<ResendOtp />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/likelist"
            element={
              <ProtectedRoute>
                <Likelist />
              </ProtectedRoute>
            }
          />
          {/* Unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default AppRoutes;
