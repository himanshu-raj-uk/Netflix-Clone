import { useEffect, useRef, useState } from "react";
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

/* ---------------- curated cinematic backdrops ---------------- */

const CINEMATIC_POSTERS = [
  "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg", // Stranger Things
  "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b42.jpg", // Dune: Part Two
  "https://image.tmdb.org/t/p/original/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg", // Oppenheimer
  "https://image.tmdb.org/t/p/original/gg4IBva7UC9nj0jt7NmFY9UbP10.jpg", // Spider-Man: Across the Spider-Verse
  "https://image.tmdb.org/t/p/original/vL5W4BpP9Vh1sL7HGugip2359Kc.jpg", // Avatar: The Way of Water
  "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg", // The Dark Knight
];

/* ---------------- styles ---------------- */

const AUTH_CSS = `
.auth-input { color-scheme: dark; }
.auth-input:-webkit-autofill,
.auth-input:-webkit-autofill:hover,
.auth-input:-webkit-autofill:focus {
  -webkit-text-fill-color: #fff;
  caret-color: #fff;
  box-shadow: 0 0 0 1000px #0e1422 inset;
  transition: background-color 600000s 0s, color 600000s 0s;
}
`;

const fieldClass = (hasError, compact) =>
  `auth-input ${compact ? "h-9 sm:h-10 text-xs sm:text-sm" : "h-10 sm:h-11 text-xs sm:text-sm"} w-full rounded-xl border bg-[#0b0f19]/80 py-2 pl-9 sm:pl-10 pr-4 text-white outline-none transition-all duration-200 placeholder:text-slate-500 hover:border-[#8B5CF6]/50 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/25 disabled:cursor-not-allowed disabled:opacity-60 ${
    hasError
      ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20"
      : "border-white/10"
  }`;

export const primaryBtn =
  "flex h-10 sm:h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-4 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#8B5CF6]/20 transition-all duration-200 hover:from-[#7C3AED] hover:to-[#6D28D9] hover:shadow-lg hover:shadow-[#8B5CF6]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export const linkBtn =
  "font-semibold text-[#22D3EE] transition-colors hover:text-[#8B5CF6] hover:underline underline-offset-4";

/* ---------------- layout ---------------- */

export function AuthLayout({ children, wide = false }) {
  const [posterIndex, setPosterIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPosterIndex((prev) => (prev + 1) % CINEMATIC_POSTERS.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden overflow-y-auto bg-[#070913] px-3.5 py-12 sm:px-6">
      <style>{AUTH_CSS}</style>

      {/* Crossfading Movie Poster Slideshow with Smooth Zoom */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {CINEMATIC_POSTERS.map((poster, index) => {
          const isActive = index === posterIndex;
          return (
            <div
              key={poster}
              aria-hidden="true"
              className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
                isActive
                  ? "opacity-35 scale-100 filter blur-[1px]"
                  : "opacity-0 scale-105 pointer-events-none"
              }`}
              style={{
                backgroundImage: `url('${poster}')`,
              }}
            />
          );
        })}

        {/* Ambient Dark Overlays & Glows */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#070913] via-[#070913]/65 to-[#070913]/90"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18)_0%,transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.12)_0%,transparent_50%)]"
        />
      </div>

      {/* Brand logo at top left */}
      <Link
        to="/"
        aria-label="Netflix home"
        className="absolute left-4 top-4 z-20 transition-all duration-300 hover:scale-105 sm:left-7 sm:top-6"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
          alt="Netflix"
          className="w-20 sm:w-28 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
        />
      </Link>

      {/* Medium-sized, ultra-responsive Glassmorphic Auth Card */}
      <section
        className={`relative z-10 my-auto w-full rounded-2xl border border-white/10 bg-[#0e1424]/85 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(139,92,246,0.12)] backdrop-blur-xl transition-all duration-300 ${
          wide
            ? "max-w-[94vw] sm:max-w-[460px] md:max-w-[480px] p-4 sm:p-6"
            : "max-w-[92vw] sm:max-w-[380px] md:max-w-[390px] p-5 sm:p-6"
        }`}
      >
        {children}
      </section>
    </main>
  );
}

export function BackLink({ to, replace = false, children = "Back to sign in" }) {
  return (
    <Link
      to={to}
      replace={replace}
      className="mb-3.5 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-[#22D3EE]"
    >
      <ArrowLeft size={14} />
      {children}
    </Link>
  );
}

export function Heading({ eyebrow, title, text, compact = false }) {
  return (
    <div className={compact ? "mb-3" : "mb-4 sm:mb-5"}>
      {eyebrow && (
        <p
          className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#22D3EE] ${
            compact ? "mb-0.5" : "mb-1"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h1
        className={`font-black tracking-tight text-white ${
          compact ? "text-xl sm:text-2xl" : "text-xl sm:text-2xl md:text-[26px]"
        }`}
      >
        {title}
      </h1>
      {text && (
        <p
          className={`break-words text-xs sm:text-sm text-slate-400 ${
            compact ? "mt-0.5 leading-4 sm:leading-5" : "mt-1 leading-5"
          }`}
        >
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
      className="mt-2.5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium leading-snug text-red-300"
    >
      <CircleAlert size={15} className="shrink-0 text-red-400" />
      <span>{message}</span>
    </p>
  );
}

export function InfoBox({ message }) {
  if (!message) return null;
  return (
    <p className="mb-3 rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-2 text-xs font-medium text-[#22D3EE]">
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
        className={`block text-[11px] sm:text-xs font-semibold tracking-wide text-slate-300 transition-colors group-focus-within:text-[#22D3EE] ${
          compact ? "mb-0.5" : "mb-1"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="pointer-events-none absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#8B5CF6]"
          />
        )}
        <input
          id={id}
          name={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${fieldClass(Boolean(error), compact)} ${
            Icon ? "" : "pl-3.5"
          } ${right ? "pr-10 sm:pr-11" : ""} ${className}`}
          {...inputProps}
        />
        {right}
      </div>
      <div className={compact ? "min-h-[16px] pt-0.5" : "min-h-[18px] pt-1"}>
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="flex items-start gap-1 text-[11px] leading-4 text-red-400"
          >
            <CircleAlert size={12} className="mt-[2px] shrink-0" />
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
      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:text-[#22D3EE] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8B5CF6]"
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
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
      <div
        role="group"
        aria-label="6-digit verification code"
        className="flex justify-between gap-1.5 sm:gap-2"
      >
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
            className={`auth-input relative h-10 w-9 sm:h-11 sm:w-11 max-w-[2.75rem] flex-1 rounded-xl border bg-[#0b0f19] p-0 text-center text-base sm:text-lg font-bold text-white caret-[#22D3EE] outline-none transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
              error
                ? "border-red-500"
                : value[i]
                ? "border-[#8B5CF6] text-[#22D3EE] ring-1 ring-[#8B5CF6]/30"
                : "border-white/15 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/30"
            }`}
          />
        ))}
      </div>

      <div className="min-h-[18px] pt-1.5">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-1 text-[11px] leading-4 text-red-400"
          >
            <CircleAlert size={13} className="mt-[2px] shrink-0" />
            <span className="break-words">{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}
