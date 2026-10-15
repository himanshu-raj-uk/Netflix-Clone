import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CircleAlert, Eye, EyeOff } from "lucide-react";

/* ---------------- helpers ---------------- */

export const getMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

// True when the 404 comes from a missing backend route (not from "user not found")
export const isRouteNotFound = (error) => {
  if (error?.response?.status !== 404) return false;
  const message = error.response?.data?.message;
  return !message || /route|endpoint|cannot\s+(get|post|put|delete)/i.test(message);
};

export const normalizeEmail = (value = "") => value.trim().toLowerCase();

export const isEmail = (value = "") => /^\S+@\S+\.\S+$/.test(value);

// Finds which field a server message belongs to. rules = { email: /email/i, ... }
export const fieldFromMessage = (message = "", rules = {}) =>
  Object.keys(rules).find((key) => rules[key].test(message)) || "form";

// Keeps the verification / reset token between pages (cleared when the tab closes)
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

// Keeps browser autofill from painting fields white / blue
const AUTH_CSS = `
.auth-input { color-scheme: dark; }
.auth-input:-webkit-autofill,
.auth-input:-webkit-autofill:hover,
.auth-input:-webkit-autofill:focus {
  -webkit-text-fill-color: #fff;
  caret-color: #fff;
  box-shadow: 0 0 0 1000px transparent inset;
  transition: background-color 600000s 0s, color 600000s 0s;
}
`;

const fieldClass = (hasError, compact) =>
  `auth-input ${compact ? "h-10" : "h-12"} w-full rounded-lg border bg-transparent py-2 pl-11 pr-4 text-sm text-white outline-none transition-colors duration-200 placeholder:text-gray-500 hover:border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
    hasError ? "border-red-500" : "border-white/25"
  }`;

export const primaryBtn =
  "flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70";

export const linkBtn = "font-semibold text-white transition-colors hover:text-red-400 hover:underline";

/* ---------------- layout ---------------- */

export function AuthLayout({ children, wide = false }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-4 text-white sm:px-6">
      <style>{AUTH_CSS}</style>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg')",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.88),rgba(0,0,0,0.5),rgba(0,0,0,0.85)),linear-gradient(to_top,#000_0%,transparent_55%,rgba(0,0,0,0.75)_100%)]"
      />

      <Link
        to="/"
        aria-label="Netflix home"
        className="absolute left-4 top-4 z-20 transition-opacity hover:opacity-80 sm:left-8 sm:top-6"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
          alt="Netflix"
          className="w-24 sm:w-32"
        />
      </Link>

      <section
        className={`relative z-10 w-full rounded-xl border border-white/10 bg-black/60 shadow-2xl shadow-black/50 backdrop-blur-md ${
          wide
            ? "mt-12 max-w-[520px] px-5 py-5 sm:mt-8 sm:px-7 sm:py-6"
            : "mt-14 max-w-[400px] px-5 py-7 sm:mt-10 sm:px-8 sm:py-8"
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
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-red-400"
    >
      <ArrowLeft size={16} />
      {children}
    </Link>
  );
}

export function Heading({ eyebrow, title, text, compact = false }) {
  return (
    <div className={compact ? "mb-3" : "mb-6"}>
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.3em] text-red-500 ${
          compact ? "mb-1" : "mb-2"
        }`}
      >
        {eyebrow}
      </p>
      <h1 className={`font-extrabold tracking-tight ${compact ? "text-2xl" : "text-2xl sm:text-3xl"}`}>
        {title}
      </h1>
      {text && (
        <p className={`break-words text-sm text-gray-400 ${compact ? "mt-1 leading-5" : "mt-2 leading-6"}`}>
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
      className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm leading-6 text-red-300"
    >
      {message}
    </p>
  );
}

export function InfoBox({ message }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
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
        className={`block text-sm font-medium text-gray-300 group-focus-within:text-red-400 ${
          compact ? "mb-1" : "mb-1.5"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500"
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
      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

/* ---------------- 6-digit OTP boxes ---------------- */

export function OtpInput({ value, onChange, disabled, error }) {
  const refs = useRef([]);

  const focusBox = (i) => refs.current[Math.max(0, Math.min(5, i))]?.focus();

  // Focus the first box on mount and again whenever the code is cleared (e.g. after a wrong code)
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
              // clicking a box past the filled ones lands on the first empty box (no gaps)
              if (i > value.length) {
                e.preventDefault();
                focusBox(value.length);
              }
            }}
            onFocus={(e) => e.target.select()}
            className={`auth-input relative h-12 w-0 min-w-0 max-w-[3rem] flex-1 rounded-lg border bg-transparent p-0 text-center text-xl font-bold text-white caret-red-500 outline-none transition-all duration-200 ease-out hover:z-10 hover:-translate-y-0.5 hover:scale-105 hover:border-red-500 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-600/30 focus:z-10 focus:-translate-y-0.5 focus:scale-105 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none ${
              error ? "border-red-500" : value[i] ? "border-red-500/70 bg-red-500/10" : "border-white/25"
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