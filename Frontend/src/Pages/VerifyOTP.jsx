import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import * as AuthAPI from "../Redux/AuthAPI";
import {
  AuthLayout,
  BackLink,
  Heading,
  InfoBox,
  OtpInput,
  authFlow,
  getMessage,
  maskEmail,
  primaryBtn,
} from "./AuthUI";

const OTP_TTL_MS = 5 * 60 * 1000; 

function formatTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const flow = authFlow.get();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  const [expiresAt] = useState(() => {
    if (!flow?.token) return Date.now(); 
    const existing = flow.otpExpiresAt;
    if (existing && existing > Date.now()) return existing;
    const fresh = Date.now() + OTP_TTL_MS;
    authFlow.save({ ...flow, otpExpiresAt: fresh });
    return fresh;
  });

  const [remainingMs, setRemainingMs] = useState(() => expiresAt - Date.now());
  const otpExpired = remainingMs <= 0;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    const tick = () => setRemainingMs(Math.max(0, expiresAt - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!flow?.token) return <Navigate to="/login" replace />;

  const isReset = flow.mode === "reset";

  const verify = async (code) => {
    if (loading || otpExpired) return;
    if (code.length !== 6) return setError("Enter the 6-digit code.");

    setLoading(true);
    setError("");
    setInfo("");

    try {
      const response = await AuthAPI.verifyOTP({
        otp: code,
        token: flow.token,
      });
      const data = response.data?.data || {};

      if (isReset) {
        if (!data.resetVerified) {
          setOtp("");
          return setError("Invalid reset code. Please try again.");
        }
        authFlow.save({ ...flow, verified: true });
        navigate("/reset-password", { replace: true });
      } else {
        authFlow.clear();
        navigate("/login", {
          replace: true,
          state: { message: "Email verified. Please sign in." },
        });
      }
    } catch (err) {
      setOtp("");
      setError(getMessage(err, "Invalid or expired code."));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value) => {
    if (otpExpired) return;
    setOtp(value);
    setError("");
    if (value.length === 6) verify(value);
  };

  const handleResend = () => {
    if (cooldown > 0 || loading) return;
    navigate("/resend-otp");
  };

  return (
    <AuthLayout>
      <BackLink to="/" replace>
        Back to home
      </BackLink>

      <Heading
        eyebrow={isReset ? "Reset password" : "Verify email"}
        title="Enter code"
        text={`We sent a 6-digit code to ${maskEmail(flow.email)}. It expires in 5 minutes.`}
      />
      <InfoBox message={info} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify(otp);
        }}
        noValidate
      >
        <OtpInput
          value={otp}
          onChange={handleChange}
          disabled={loading || otpExpired}
          error={error}
        />

        <p className="mt-2 text-xs text-slate-400">
          {otpExpired ? (
            <span className="text-red-400">Code expired. Please resend.</span>
          ) : (
            <>
              Code expires in{" "}
              <span className="font-medium text-slate-200">
                {formatTime(remainingMs)}
              </span>
            </>
          )}
        </p>

        <button
          type="submit"
          disabled={loading || otp.length !== 6 || otpExpired}
          className={`${primaryBtn} mt-3`}
        >
          {loading ? (
            <>
              <LoaderCircle size={18} className="animate-spin text-[#22D3EE]" />
              Verifying...
            </>
          ) : isReset ? (
            "Verify code"
          ) : (
            "Verify & continue"
          )}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="font-medium text-slate-300 transition-colors hover:text-[#22D3EE] hover:underline underline-offset-4 disabled:cursor-not-allowed disabled:text-slate-600 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
        <button
          type="button"
          onClick={() => {
            authFlow.clear();
            navigate("/login");
          }}
          className="font-medium text-slate-400 transition-colors hover:text-white hover:underline underline-offset-4"
        >
          Back to sign in
        </button>
      </div>
    </AuthLayout>
  );
}
