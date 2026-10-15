import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import * as AuthAPI from "../Redux/AuthAPI";
import {
  AuthLayout,
  BackLink,
  Field,
  FormError,
  Heading,
  PasswordToggle,
  authFlow,
  getMessage,
  primaryBtn,
} from "./AuthUI";

const EMPTY_ERRORS = { password: "", confirmPassword: "", form: "" };

export default function ResetPassword() {
  const navigate = useNavigate();
  const flow = authFlow.get(); // { mode: "reset", email, token, verified }

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Only reachable after the reset OTP was verified
  if (!flow?.token || flow.mode !== "reset") return <Navigate to="/forgot-password" replace />;
  if (!flow.verified) return <Navigate to="/verify-otp" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const { password, confirmPassword } = formData;

    const next = { ...EMPTY_ERRORS };
    if (!password) next.password = "Please enter a new password.";
    else if (password.length < 6 || password.length > 20)
      next.password = "Password must be 6 to 20 characters.";
    if (confirmPassword !== password) next.confirmPassword = "Passwords do not match.";
    if (next.password || next.confirmPassword) return setErrors(next);

    setLoading(true);
    setErrors(EMPTY_ERRORS);

    try {
      await AuthAPI.resetPassword(password, flow.token);
      authFlow.clear();
      navigate("/login", {
        replace: true,
        state: { message: "Password reset successfully. Please sign in." },
      });
    } catch (error) {
      const message = getMessage(error, "Unable to reset your password. Please try again.");

      // Reset session expired -> start over
      if (error.response?.status === 401 || /token|expired/i.test(message)) {
        authFlow.clear();
        return navigate("/forgot-password", { replace: true });
      }

      if (/password/i.test(message)) setErrors({ ...EMPTY_ERRORS, password: message });
      else setErrors({ ...EMPTY_ERRORS, form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <BackLink to="/login" />

      <Heading eyebrow="Almost done" title="New Password" text="Choose a new password for your account." />

      <form onSubmit={handleSubmit} noValidate>
        <Field
          id="password"
          label="New password"
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Create a new password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          error={errors.password}
          right={<PasswordToggle show={showPassword} onToggle={() => setShowPassword((p) => !p)} />}
        />
        <Field
          id="confirmPassword"
          label="Confirm password"
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
          error={errors.confirmPassword}
        />

        <FormError message={errors.form} />

        <button type="submit" disabled={loading} className={`${primaryBtn} mt-4`}>
          {loading ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              Saving...
            </>
          ) : (
            "Reset password"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}