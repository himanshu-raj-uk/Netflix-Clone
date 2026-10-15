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

export default function ResendOTP() {
  const navigate = useNavigate();
  const flow = authFlow.get(); // { mode, email, token }

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Nothing pending to resend
  if (!flow?.token) return <Navigate to="/register" replace />;

  const handleResend = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await AuthAPI.resendOTP(flow.token);
      navigate("/verify-otp", {
        replace: true,
        state: { message: "A new code has been sent to your email." },
      });
    } catch (err) {
      setError(getMessage(err, "Could not resend the code. Try again shortly."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <BackLink to="/verify-otp">Back to code entry</BackLink>

      <Heading
        eyebrow="Verify email"
        title="Resend code"
        text={`We will send a new 6-digit code to ${maskEmail(flow.email)}.`}
      />

      <FormError message={error} />

      <button type="button" onClick={handleResend} disabled={loading} className={`${primaryBtn} mt-4`}>
        {loading ? (
          <>
            <LoaderCircle size={19} className="animate-spin" />
            Sending code...
          </>
        ) : (
          "Send new code"
        )}
      </button>
    </AuthLayout>
  );
}