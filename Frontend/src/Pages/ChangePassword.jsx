import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import * as AuthAPI from "../Redux/AuthAPI";
import {
    AuthLayout,
    BackLink,
    Field,
    FormError,
    Heading,
    InfoBox,
    PasswordToggle,
    getMessage,
    primaryBtn,
} from "./AuthUI";

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };
const EMPTY_ERRORS = { currentPassword: "", newPassword: "", confirmPassword: "", form: "" };

export default function ChangePassword() {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState(EMPTY_ERRORS);
    const [info, setInfo] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Token based: only signed-in users can open this page
    if (!localStorage.getItem("userToken")) return <Navigate to="/login" replace />;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
        setInfo("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const { currentPassword, newPassword, confirmPassword } = formData;

        // The backend requires at least 8 characters for a changed password
        const next = { ...EMPTY_ERRORS };
        if (!currentPassword) next.currentPassword = "Please enter your current password.";
        if (!newPassword) next.newPassword = "Please enter a new password.";
        else if (newPassword.length < 8) next.newPassword = "Password must be at least 8 characters.";
        else if (newPassword === currentPassword)
            next.newPassword = "New password must be different from the current one.";
        if (confirmPassword !== newPassword) next.confirmPassword = "Passwords do not match.";

        if (Object.values(next).some(Boolean)) return setErrors(next);

        setLoading(true);
        setErrors(EMPTY_ERRORS);

        try {
            await AuthAPI.changePassword(currentPassword, newPassword);
            setFormData(EMPTY_FORM);
            setInfo("Password changed successfully.");
        } catch (error) {
            const message = getMessage(error, "Unable to change your password. Please try again.");

            if (/current/i.test(message)) setErrors({ ...EMPTY_ERRORS, currentPassword: message });
            else if (/password/i.test(message)) setErrors({ ...EMPTY_ERRORS, newPassword: message });
            else setErrors({ ...EMPTY_ERRORS, form: message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <BackLink to="/">Back to home</BackLink>

            <Heading
                eyebrow="Security"
                title="Change Password"
                text="Enter your current password, then choose a new one."
            />
            <InfoBox message={info} />

            <form onSubmit={handleSubmit} noValidate>
                <Field
                    id="currentPassword"
                    label="Current password"
                    icon={LockKeyhole}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your current password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    disabled={loading}
                    error={errors.currentPassword}
                    right={<PasswordToggle show={showPassword} onToggle={() => setShowPassword((p) => !p)} />}
                />
                <Field
                    id="newPassword"
                    label="New password"
                    icon={LockKeyhole}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={loading}
                    error={errors.newPassword}
                />
                <Field
                    id="confirmPassword"
                    label="Confirm new password"
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
                            Updating...
                        </>
                    ) : (
                        "Change password"
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}