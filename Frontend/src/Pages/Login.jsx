import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoaderCircle, Mail, LockKeyhole } from "lucide-react";
import * as AuthAPI from "../Redux/AuthAPI";
import {
  AuthLayout,
  Field,
  FormError,
  Heading,
  InfoBox,
  PasswordToggle,
  fieldFromMessage,
  getMessage,
  isEmail,
  linkBtn,
  normalizeEmail,
  primaryBtn,
} from "./AuthUI";

const EMPTY_ERRORS = { email: "", password: "", form: "" };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const info = location.state?.message || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    const email = normalizeEmail(formData.email);
    const { password } = formData;

    const next = { ...EMPTY_ERRORS };

    if (!email) next.email = "Please enter your email address.";
    else if (!isEmail(email)) next.email = "Enter a valid email address.";

    if (!password) next.password = "Please enter your password.";

    if (next.email || next.password) {
      setErrors(next);
      return;
    }

    setLoading(true);
    setErrors(EMPTY_ERRORS);

    try {
      const response = await AuthAPI.loginUser({ email, password });
      const result = response.data?.data || {};
      const { accessToken, refreshToken } = result;

      if (!accessToken) {
        setErrors({
          ...EMPTY_ERRORS,
          form: "Login failed. Please try again.",
        });
        return;
      }

      const userData =
        result.user ||
        result.userData ||
        result.profile ||
        result;

      localStorage.setItem("userToken", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Always save the user, even when the server sends no name.
      // The Navbar and Profile page build the name from the email.
      const profile = { ...userData };
      delete profile.accessToken;
      delete profile.refreshToken;
      localStorage.setItem(
        "user",
        JSON.stringify({ ...profile, email: profile.email || email })
      );

      window.dispatchEvent(new Event("auth-changed"));

      navigate("/", { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const message = getMessage(
        error,
        "Unable to sign in. Please try again."
      );

      if (status === 404) {
        setErrors({
          ...EMPTY_ERRORS,
          email: "No account found with this email. Please sign up.",
        });
      } else if (status === 401) {
        setErrors({
          ...EMPTY_ERRORS,
          password: "Incorrect email or password.",
        });
      } else {
        const field = fieldFromMessage(message, {
          email: /email/i,
          password: /password/i,
        });

        setErrors({ ...EMPTY_ERRORS, [field]: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Heading
        eyebrow="Welcome back"
        title="Sign In"
        text="Sign in to continue watching your favorite movies and shows."
      />

      <InfoBox message={info} />

      <form onSubmit={handleLogin} noValidate>
        <Field
          id="email"
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          error={errors.email}
        />

        <Field
          id="password"
          label="Password"
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          error={errors.password}
          right={
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword((p) => !p)}
            />
          }
        />

        <div className="-mt-1 mb-1 text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-gray-300 transition-colors hover:text-red-400 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <FormError message={errors.form} />

        <button
          type="submit"
          disabled={loading}
          className={`${primaryBtn} mt-4`}
        >
          {loading ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        New to Netflix?
        <Link to="/register" className={`ml-1 ${linkBtn}`}>
          Sign up now
        </Link>
      </p>
    </AuthLayout>
  );
}