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

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const flow = authFlow.get(); // { mode: "register" | "reset", email, token }

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Opened directly without registering / requesting a reset
  if (!flow?.token) return <Navigate to="/login" replace />;

  const isReset = flow.mode === "reset";

  const verify = async (code) => {
    if (loading) return;
    if (code.length !== 6) return setError("Enter the 6-digit code.");

    setLoading(true);
    setError("");
    setInfo("");

    try {
      const response = await AuthAPI.verifyOTP({ otp: code, token: flow.token });
      const data = response.data?.data || {};

      if (isReset) {
        if (!data.resetVerified) {
          setOtp("");
          return setError("Invalid reset code. Please try again.");
        }
        // the same token is used on the reset-password page
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
    setOtp(value);
    setError("");
    if (value.length === 6) verify(value); // submits as soon as the 6th digit is entered
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;

    try {
      await AuthAPI.resendOTP(flow.token);
      setOtp("");
      setError("");
      setInfo("A new code has been sent to your email.");
      setCooldown(30);
    } catch (err) {
      setInfo("");
      setError(getMessage(err, "Could not resend the code. Try again shortly."));
    }
  };

  return (
    <AuthLayout>
      <BackLink to={isReset ? "/forgot-password" : "/register"}>
        {isReset ? "Change email" : "Back to sign up"}
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
        <OtpInput value={otp} onChange={handleChange} disabled={loading} error={error} />

        <button type="submit" disabled={loading || otp.length !== 6} className={`${primaryBtn} mt-2`}>
          {loading ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              Verifying...
            </>
          ) : isReset ? (
            "Verify code"
          ) : (
            "Verify & continue"
          )}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-gray-300 transition-colors hover:text-red-400 hover:underline disabled:cursor-not-allowed disabled:text-gray-600 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
        <button
          type="button"
          onClick={() => {
            authFlow.clear();
            navigate("/login");
          }}
          className="text-gray-300 transition-colors hover:text-white hover:underline"
        >
          Back to sign in
        </button>
      </div>
    </AuthLayout>
  );
}