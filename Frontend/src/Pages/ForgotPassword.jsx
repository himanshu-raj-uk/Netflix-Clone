import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoaderCircle, Mail } from "lucide-react";
import * as AuthAPI from "../Redux/AuthAPI";
import {
    AuthLayout,
    BackLink,
    Field,
    FormError,
    Heading,
    authFlow,
    getMessage,
    isEmail,
    isRouteNotFound,
    linkBtn,
    normalizeEmail,
    primaryBtn,
} from "../Pages/AuthUI";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({ email: "", form: "" });
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const value = normalizeEmail(email);

        if (!value) return setErrors({ email: "Please enter your email address.", form: "" });
        if (!isEmail(value)) return setErrors({ email: "Enter a valid email address.", form: "" });

        setLoading(true);
        setErrors({ email: "", form: "" });
        setNotFound(false);

        try {
            const response = await AuthAPI.forgotPassword(value);
            const token = response.data?.token;

            if (!token) {
                return setErrors({ email: "", form: "Could not start the reset. Please try again." });
            }

            authFlow.save({ mode: "reset", email: value, token });
            navigate("/verify-otp", { state: { message: "Reset code sent to your email." } });
        } catch (error) {
            const message = getMessage(error, "Unable to send the code. Please try again.");

            if (isRouteNotFound(error)) {
                // Backend problem, not a wrong email
                setErrors({
                    email: "",
                    form: "Password reset is not available right now (server route not found).",
                });
            } else if (error.response?.status === 404) {
                setNotFound(true);
                setErrors({ email: "No account found with this email.", form: "" });
            } else if (error.response?.status === 403) {
                // e.g. email not verified yet
                setNotFound(true);
                setErrors({ email: message, form: "" });
            } else if (/email|user|account/i.test(message)) {
                setErrors({ email: message, form: "" });
            } else {
                setErrors({ email: "", form: message });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <BackLink to="/login" />

            <Heading
                eyebrow="Account help"
                title="Forgot Password"
                text="Enter your email and we will send you a 6-digit code to reset your password."
            />

            <form onSubmit={handleSubmit} noValidate>
                <Field
                    id="email"
                    label="Email address"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({ email: "", form: "" });
                        setNotFound(false);
                    }}
                    disabled={loading}
                    error={errors.email}
                />

                {notFound && (
                    <p className="-mt-1 text-sm text-gray-400">
                        New here?
                        <Link to="/register" className={`ml-1 ${linkBtn}`}>
                            Create an account
                        </Link>
                    </p>
                )}

                <FormError message={errors.form} />

                <button type="submit" disabled={loading} className={`${primaryBtn} mt-4`}>
                    {loading ? (
                        <>
                            <LoaderCircle size={19} className="animate-spin" />
                            Sending code...
                        </>
                    ) : (
                        "Send code"
                    )}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
                Remembered it?
                <Link to="/login" className={`ml-1 ${linkBtn}`}>
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
}