import { Suspense, lazy } from "react";
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

const loadVerifyOTP = () => import("../Pages/VerifyOTP");
const loadResendOtp = () => import("../Pages/ResendOTP");
const loadForgotPassword = () => import("../Pages/ForgotPassword");

const loadChangePassword = () => import("../Pages/ChangePassword");
const loadResetPassword = () => import("../Pages/ResetPassword");

const loadProfilePage = () => import("../Pages/Profile");

const loadWatchlist = () => import("../Components/Watchlist");
const loadLikelist = () => import("../Components/LikeList");

const VerifyOTP = lazy(loadVerifyOTP);
const ResendOtp = lazy(loadResendOtp);
const ForgotPassword = lazy(loadForgotPassword);

const ChangePassword = lazy(loadChangePassword);
const ResetPassword = lazy(loadResetPassword);

const ProfilePage = lazy(loadProfilePage);

const Watchlist = lazy(loadWatchlist);
const Likelist = lazy(loadLikelist);

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
            minWidth: "280px",
            maxWidth: "calc(100vw - 32px)",
            padding: "12px 18px",
            borderRadius: "16px",
            background: "#111827",
            color: "#f8fafc",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.8), 0 0 20px rgba(139, 92, 246, 0.2)",
            fontWeight: 500,
            fontSize: "14px",
          },
        }}
      />

      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#080B14]">
            <div className="relative flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8B5CF6]/30 border-t-[#22D3EE] shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#22D3EE] animate-pulse">Loading Cinema</span>
            </div>
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

          {/* Auth recovery */}
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/resend-otp" element={<ResendOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected user pages */}
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

          {/* Unknown routes fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default AppRoutes;
