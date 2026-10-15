import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoaderCircle, Mail, LockKeyhole, User, Phone } from "lucide-react";
import * as AuthAPI from "../Redux/AuthAPI";
import {
  AuthLayout,
  Field,
  FormError,
  Heading,
  PasswordToggle,
  authFlow,
  fieldFromMessage,
  getMessage,
  isEmail,
  linkBtn,
  normalizeEmail,
  primaryBtn,
} from "./AuthUI";

const EMPTY_ERRORS = { name: "", email: "", phone: "", password: "", confirmPassword: "", form: "" };

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const goToOtp = (token, email, message = "") => {
    authFlow.save({ mode: "register", email, token });
    navigate("/verify-otp", { state: { message } });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    const name = formData.name.trim();
    const email = normalizeEmail(formData.email);
    const { phone, password, confirmPassword } = formData;

    // Same rules as the backend Joi registerSchema
    const next = { ...EMPTY_ERRORS };
    if (!name) next.name = "Please enter your name.";
    else if (name.length < 3) next.name = "Name must be at least 3 characters.";
    else if (name.length > 50) next.name = "Name must be 50 characters or less.";

    if (!email) next.email = "Please enter your email address.";
    else if (!isEmail(email)) next.email = "Enter a valid email address.";

    if (!/^[0-9]{10}$/.test(phone)) next.phone = "Enter a valid 10-digit mobile number.";

    if (!password) next.password = "Please create a password.";
    else if (password.length < 6 || password.length > 20)
      next.password = "Password must be 6 to 20 characters.";

    if (confirmPassword !== password) next.confirmPassword = "Passwords do not match.";

    if (Object.values(next).some(Boolean)) return setErrors(next);

    setLoading(true);
    setErrors(EMPTY_ERRORS);

    try {
      // Email is new -> backend saves the pending user and sends the OTP
      const response = await AuthAPI.registerUser({ name, email, password, phone });
      goToOtp(response.data?.verificationToken, response.data?.data?.email || email);
    } catch (error) {
      const data = error.response?.data;

      // Saved, but the OTP email failed -> continue; user can resend on the next page
      if (error.response?.status === 503 && data?.verificationToken) {
        return goToOtp(data.verificationToken, data.data?.email || email, data.message);
      }

      const message = getMessage(error, "Unable to create your account. Please try again.");
      const field = fieldFromMessage(message, {
        phone: /mobile|phone/i,
        email: /email/i,
        password: /password/i,
        name: /name/i,
      });

      if (field === "email" && /already|registered|exist/i.test(message)) {
        setErrors({ ...EMPTY_ERRORS, email: "This email is already registered. Please sign in." });
      } else if (field === "phone" && /already|registered|exist/i.test(message)) {
        setErrors({ ...EMPTY_ERRORS, phone: "This mobile number is already registered." });
      } else {
        setErrors({ ...EMPTY_ERRORS, [field]: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggle = <PasswordToggle show={showPassword} onToggle={() => setShowPassword((p) => !p)} />;

  return (
    <AuthLayout wide>
      <Heading
        compact
        eyebrow="Join us"
        title="Create Account"
        text="Sign up to start watching your favorite movies and shows."
      />

      <form onSubmit={handleRegister} noValidate>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Field
            compact
            id="name"
            label="Full name"
            icon={User}
            type="text"
            autoComplete="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            error={errors.name}
          />
          <Field
            compact
            id="phone"
            label="Mobile number"
            icon={Phone}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit number"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            error={errors.phone}
          />
        </div>

        <Field
          compact
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

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Field
            compact
            id="password"
            label="Password"
            icon={LockKeyhole}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            error={errors.password}
            right={toggle}
          />
          <Field
            compact
            id="confirmPassword"
            label="Confirm password"
            icon={LockKeyhole}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            error={errors.confirmPassword}
          />
        </div>

        <FormError message={errors.form} />

        <button type="submit" disabled={loading} className={`${primaryBtn.replace("h-12", "h-11")} mt-2`}>
          {loading ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              Creating account...
            </>
          ) : (
            "Sign Up"
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-400">
        Already have an account?
        <Link to="/login" className={`ml-1 ${linkBtn}`}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}