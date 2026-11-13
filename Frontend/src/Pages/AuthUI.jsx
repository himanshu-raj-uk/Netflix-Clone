import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CircleAlert, Eye, EyeOff } from "lucide-react";

/* ---------------- helpers ---------------- */

export const getMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

export const isRouteNotFound = (error) => {
  if (error?.response?.status !== 404) return false;
  const message = error.response?.data?.message;
  return !message || /route|endpoint|cannot\s+(get|post|put|delete)/i.test(message);
};

export const normalizeEmail = (value = "") => value.trim().toLowerCase();

export const isEmail = (value = "") => /^\S+@\S+\.\S+$/.test(value);

export const fieldFromMessage = (message = "", rules = {}) =>
  Object.keys(rules).find((key) => rules[key].test(message)) || "form";

export const authFlow = {
  save: (data) => sessionStorage.setItem("authFlow", JSON.stringify(data)),
  get: () => {
    try {
      return JSON.parse(sessionStorage.getItem("authFlow")) || null;
    } catch {
      return null;
    }
  },
  clear: () => sessionStorage.removeItem("authFlow"),
};

export const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`;
};

/* ---------------- styles ---------------- */

const AUTH_CSS = `
.auth-input { color-scheme: dark; }
.auth-input:-webkit-autofill,
.auth-input:-webkit-autofill:hover,
.auth-input:-webkit-autofill:focus {
  -webkit-text-fill-color: #fff;
  caret-color: #fff;
  box-shadow: 0 0 0 1000px #111827 inset;
  transition: background-color 600000s 0s, color 600000s 0s;
}
`;

const fieldClass = (hasError, compact) =>
  `auth-input ${compact ? "h-10" : "h-12"} w-full rounded-xl border bg-[#111827]/70 py-2 pl-11 pr-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 hover:border-[#8B5CF6]/50 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/25 disabled:cursor-not-allowed disabled:opacity-60 ${
    hasError
      ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20"
      : "border-white/10"
  }`;

export const primaryBtn =
  "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#8B5CF6] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#7C3AED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export const linkBtn =
  "font-semibold text-[#22D3EE] transition-colors hover:text-[#8B5CF6] hover:underline underline-offset-4";

/* ---------------- layout ---------------- */

export function AuthLayout({ children, wide = false }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080B14] px-4 py-8 text-white sm:px-6">
      <style>{AUTH_CSS}</style>

      {/* Cinematic Backdrop Image with soft opacity */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm scale-105 transition-transform duration-1000"
        style={{
          backgroundImage:
            "url('https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg')",
        }}
      />

      {/* Layered cinematic overlays (Midnight gradient + Violet/Cyan spotlights) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2)_0%,transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.15)_0%,transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,11,20,0.92),rgba(8,11,20,0.7),rgba(8,11,20,0.92)),linear-gradient(to_top,#080B14_0%,transparent_60%,rgba(8,11,20,0.8)_100%)]"
      />

      {/* Brand logo top left */}
      <Link
        to="/"
        aria-label="Netflix home"
        className="absolute left-5 top-5 z-20 transition-all duration-300 hover:scale-105 sm:left-8 sm:top-7"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
          alt="Netflix"
          className="w-24 sm:w-32 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
        />
      </Link>

      {/* Main Glassmorphic Auth Card */}
      <section
        className={`relative z-10 w-full rounded-2xl border border-white/10 bg-[#111827]/85 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(139,92,246,0.15)] backdrop-blur-2xl ${
          wide
            ? "mt-12 max-w-[540px] px-6 py-6 sm:mt-10 sm:px-8 sm:py-7"
            : "mt-14 max-w-[420px] px-6 py-8 sm:mt-12 sm:px-8 sm:py-9"
        }`}
      >
        {children}
      </section>
    </main>
  );
}

export function BackLink({ to, children = "Back to sign in" }) {
  return (
    <Link
      to={to}
      className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-[#22D3EE]"
    >
      <ArrowLeft size={15} />
      {children}
    </Link>
  );
}

export function Heading({ eyebrow, title, text, compact = false }) {
  return (
    <div className={compact ? "mb-4" : "mb-6"}>
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.25em] text-[#22D3EE] ${
          compact ? "mb-1" : "mb-2"
        }`}
      >
        {eyebrow}
      </p>
      <h1 className={`font-black tracking-tight text-white ${compact ? "text-2xl" : "text-2xl sm:text-3xl"}`}>
        {title}
      </h1>
      {text && (
        <p className={`break-words text-sm text-slate-400 ${compact ? "mt-1 leading-5" : "mt-2 leading-6"}`}>
          {text}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium leading-5 text-red-300"
    >
      <CircleAlert size={16} className="shrink-0 text-red-400" />
      <span>{message}</span>
    </p>
  );
}

export function InfoBox({ message }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-xl border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3.5 py-2.5 text-xs font-medium text-[#22D3EE]">
      {message}
    </p>
  );
}

/* ---------------- inputs ---------------- */

export function Field({
  id,
  label,
  icon: Icon,
  error,
  right,
  compact = false,
  className = "",
  ...inputProps
}) {
  return (
    <div className="group">
      <label
        htmlFor={id}
        className={`block text-xs font-semibold tracking-wide text-slate-300 transition-colors group-focus-within:text-[#22D3EE] ${
          compact ? "mb-1" : "mb-1.5"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#8B5CF6]"
        />
        <input
          id={id}
          name={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${fieldClass(Boolean(error), compact)} ${right ? "pr-12" : ""} ${className}`}
          {...inputProps}
        />
        {right}
      </div>
      <div className={compact ? "min-h-[18px] pt-1" : "min-h-[20px] pt-1.5"}>
        {error && (
          <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-xs leading-5 text-red-400">
            <CircleAlert size={14} className="mt-[3px] shrink-0" />
            <span className="break-words">{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function PasswordToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:text-[#22D3EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

/* ---------------- 6-digit OTP boxes ---------------- */

export function OtpInput({ value, onChange, disabled, error }) {
  const refs = useRef([]);

  const focusBox = (i) => refs.current[Math.max(0, Math.min(5, i))]?.focus();

  useEffect(() => {
    if (!value && !disabled) focusBox(0);
  }, [value, disabled]);

  const handleInput = (i, e) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    onChange((value.slice(0, i) + digit + value.slice(i + 1)).slice(0, 6));
    focusBox(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    focusBox(pasted.length);
  };

  return (
    <div>
      <div role="group" aria-label="6-digit verification code" className="flex justify-between gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            value={value[i] || ""}
            disabled={disabled}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={Boolean(error)}
            onChange={(e) => handleInput(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onMouseDown={(e) => {
              if (i > value.length) {
                e.preventDefault();
                focusBox(value.length);
              }
            }}
            onFocus={(e) => e.target.select()}
            className={`auth-input relative h-11 w-0 min-w-0 max-w-[3rem] flex-1 rounded-lg border bg-[#111827] p-0 text-center text-lg font-bold text-white caret-[#22D3EE] outline-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
              error
                ? "border-red-500"
                : value[i]
                ? "border-[#8B5CF6] text-[#22D3EE]"
                : "border-white/15 focus:border-[#8B5CF6]"
            }`}
          />
        ))}
      </div>

      <div className="min-h-[20px] pt-2">
        {error && (
          <p role="alert" className="flex items-start gap-1.5 text-xs leading-5 text-red-400">
            <CircleAlert size={14} className="mt-[3px] shrink-0" />
            <span className="break-words">{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}
