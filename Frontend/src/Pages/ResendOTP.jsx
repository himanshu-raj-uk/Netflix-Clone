import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import * as AuthAPI from "../Redux/AuthAPI";
import {
  AuthLayout,
  BackLink,
  FormError,
  Heading,
  authFlow,
  getMessage,
  maskEmail,
  primaryBtn,
} from "./AuthUI";

const OTP_TTL_MS = 5 * 60 * 1000; 

export default function ResendOTP() {
  const navigate = useNavigate();
  const flow = authFlow.get(); 

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!flow?.token) return <Navigate to="/register" replace />;

  const handleResend = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await AuthAPI.resendOTP(flow.token);

      authFlow.save({ ...flow, otpExpiresAt: Date.now() + OTP_TTL_MS });

      navigate("/verify-otp", {
        replace: true,
        state: { message: "A new code has been sent to your email." },
      });
    } catch (err) {
      setError(
        getMessage(err, "Could not resend the code. Try again shortly."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <BackLink to="/" replace>
        Back to home
      </BackLink>

      <Heading
        eyebrow="Verify email"
        title="Resend code"
        text={`We will send a new 6-digit code to ${maskEmail(flow.email)}.`}
      />

      <FormError message={error} />

      <button
        type="button"
        onClick={handleResend}
        disabled={loading}
        className={`${primaryBtn} mt-3.5`}
      >
        {loading ? (
          <>
            <LoaderCircle size={18} className="animate-spin text-[#22D3EE]" />
            Sending code...
          </>
        ) : (
          "Send new code"
        )}
      </button>
    </AuthLayout>
  );
}
