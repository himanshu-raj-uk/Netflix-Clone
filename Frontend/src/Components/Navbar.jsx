import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, ChevronDown, Globe, UserRound } from "lucide-react";
import { useLanguage } from "../Context/LanguageContext";
import { translations } from "../Data/Translations";
import { getUser } from "../Library/UserStore";
import NavSearch from "./Navesearch";

const LANGUAGES = [
  { code: "en", key: "english", fallback: "English" },
  { code: "hi", key: "hindi", fallback: "हिन्दी" },
];

const SEARCH_NO_BG =
  "[&_input]:bg-transparent [&_form]:bg-transparent [&>*]:bg-transparent";

const MOBILE_SEARCH =
  "[&_input]:bg-transparent [&_form]:bg-transparent [&_input]:min-h-10 [&_input]:text-base [&>*]:!static " +
  "[&_[role=listbox]]:max-h-[calc(100svh-9rem)] [&_[role=listbox]]:overflow-y-auto " +
  "[&_[role=listbox]]:bg-[#111827] [&_ul]:bg-[#111827]";

const initials = (name) => {
  const p = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "";
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
};

function Avatar({ user, className = "" }) {
  const src =
    typeof user?.profileImage === "string"
      ? user.profileImage
      : user?.profileImage?.url || "";

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#8B5CF6] text-xs font-bold text-white ${className}`}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : initials(user?.name) ? (
        initials(user?.name)
      ) : (
        <UserRound size={16} />
      )}
    </span>
  );
}

function MenuIcon({ open }) {
  const bar =
    "absolute left-0 h-0.5 w-full rounded-full bg-white transition-all duration-300 ease-in-out motion-reduce:transition-none";

  return (
    <span aria-hidden className="relative block h-4 w-5">
      <span
        className={`${bar} ${
          open ? "top-1/2 -translate-y-1/2 rotate-45 bg-[#22D3EE]" : "top-0 translate-y-0 rotate-0"
        }`}
      />
      <span
        className={`${bar} top-1/2 -translate-y-1/2 ${
          open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
        }`}
      />
      <span
        className={`${bar} ${
          open
            ? "top-1/2 -translate-y-1/2 -rotate-45 bg-[#8B5CF6]"
            : "top-full -translate-y-full rotate-0"
        }`}
      />
    </span>
  );
}

function LanguageMenu({ language, onChange, t, align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = language === "hi" ? "hi" : "en";
  const labelOf = (item) => t?.language?.[item.key] || item.fallback;
  const currentItem = LANGUAGES.find((l) => l.code === current);

  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (code) => {
    if (code !== current) onChange(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t?.language?.label || "Language"}
        className={`flex h-9 items-center gap-1.5 rounded-md border border-white/15 bg-[#111827]/80 px-2.5 text-xs font-medium text-slate-200 transition-colors duration-200 hover:border-white/30 hover:text-white sm:h-9.5 sm:gap-2 sm:px-3 sm:text-sm ${
          open ? "border-[#8B5CF6] text-white" : ""
        }`}
      >
        <Globe size={14} className="shrink-0 text-[#22D3EE]" />
        <span className="whitespace-nowrap sm:hidden">{current === "hi" ? "हिं" : "EN"}</span>
        <span className="hidden whitespace-nowrap sm:inline">{labelOf(currentItem)}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-white" : "rotate-0"
          }`}
        />
      </button>

      <ul
        role="listbox"
        aria-label={t?.language?.label || "Language"}
        className={`absolute ${
          align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
        } top-full z-50 mt-1.5 min-w-[7.5rem] overflow-hidden rounded-lg border border-white/10 bg-[#111827] p-1 shadow-xl transition-all duration-200 ease-out ${
          open
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {LANGUAGES.map((item) => {
          const active = item.code === current;

          return (
            <li key={item.code} role="option" aria-selected={active}>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => choose(item.code)}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs sm:text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#8B5CF6]/20 text-[#22D3EE] font-semibold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {labelOf(item)}
                {active && <Check size={14} className="text-[#22D3EE]" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function useIsDesktop() {
  const query = "(min-width: 1024px)";
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return matches;
}

export default function Navbar() {
  const { language, changeLanguage } = useLanguage();
  const t = translations[language] || translations.en;
  const location = useLocation();
  const isDesktop = useIsDesktop();

  const [user, setUser] = useState(getUser());
  const [scrolled, setScrolled] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let timer;
    if (mobileOpen) {
      timer = setTimeout(() => setPanelMounted(true), 0);
    } else {
      timer = setTimeout(() => setPanelMounted(false), 250);
    }
    return () => clearTimeout(timer);
  }, [mobileOpen]);

  const prevPathname = useRef(location.pathname);
  const prevIsDesktop = useRef(isDesktop);
  useEffect(() => {
    if (prevPathname.current !== location.pathname || prevIsDesktop.current !== isDesktop) {
      prevPathname.current = location.pathname;
      prevIsDesktop.current = isDesktop;
      const timeout = setTimeout(() => setMobileOpen(false), 0);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname, isDesktop]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMobileOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const firstName = String(user?.name || "").trim().split(/\s+/)[0] || "Account";

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 w-full px-3 transition-colors duration-300 ease-in-out sm:px-6 lg:px-10 2xl:px-14 ${
        scrolled
          ? "bg-[#080B14]/95 backdrop-blur-md"
          : "bg-gradient-to-b from-[#080B14]/90 via-[#080B14]/30 to-transparent"
      }`}
    >
      {!isDesktop && panelMounted && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[100svh] bg-[#080B14]/90 backdrop-blur-xl transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      <div
        ref={navRef}
        className="relative mx-auto grid h-14 w-full max-w-[1920px] grid-cols-[auto_1fr_auto] items-center gap-2.5 sm:h-16 sm:gap-4 lg:gap-8"
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-5">
          <Link
            to="/"
            aria-label="Netflix Home"
            className="flex shrink-0 items-center transition-transform duration-200 hover:scale-105"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
              alt="Netflix"
              className="w-[clamp(5rem,20vw,6.5rem)] sm:w-24 md:w-28 lg:w-30"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-1 xl:flex">
            {user && (
              <>
                <Link
                  to="/watchlist"
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                    location.pathname === "/watchlist"
                      ? "text-[#22D3EE]"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Watchlist
                </Link>
                <Link
                  to="/likelist"
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                    location.pathname === "/likelist"
                      ? "text-[#22D3EE]"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Liked
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Wide Search (Desktop only) */}
        <div className="flex min-w-0 justify-center">
          {isDesktop && (
            <div className={`w-full max-w-[clamp(20rem,38vw,42rem)] ${SEARCH_NO_BG}`}>
              <NavSearch variant="desktop" />
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="col-start-3 flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          {isDesktop && <LanguageMenu language={language} onChange={changeLanguage} t={t} />}

          {/* Profile / Sign In */}
          {user ? (
            <Link
              to="/profile"
              aria-label="Open your profile"
              className="flex h-8 min-w-0 items-center gap-1.5 rounded-full p-0.5 pr-2 text-white transition-colors hover:bg-white/10 sm:h-9 sm:gap-2 sm:pr-3"
            >
              <Avatar user={user} className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="max-w-[5.5rem] truncate text-xs font-medium text-slate-200 sm:max-w-[8rem] sm:text-sm">
                {firstName}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-[#8B5CF6] px-3.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#7C3AED] active:scale-95 sm:h-9 sm:px-4.5 sm:text-sm"
            >
              {t.navbar.signIn}
            </Link>
          )}

          {/* Mobile search & drawer trigger */}
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close search" : "Open search"}
              aria-expanded={mobileOpen}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 sm:h-9 sm:w-9"
            >
              <MenuIcon open={mobileOpen} />
            </button>
          )}
        </div>

        {/* Mobile Search and Filter Dropdown Drawer */}
        {!isDesktop && panelMounted && (
          <div
            className={`absolute inset-x-0 top-full mx-auto mt-1 flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-[#111827]/95 p-2.5 shadow-xl backdrop-blur-xl transition-all duration-200 ease-out sm:max-w-2xl sm:p-3.5 ${
              mobileOpen
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-2 scale-95 opacity-0"
            }`}
          >
            {/* Search Input: full width */}
            <div className={`w-full ${MOBILE_SEARCH}`}>
              <NavSearch variant="mobile" onDone={() => setMobileOpen(false)} />
            </div>

            {/* Bottom Row: Language Menu replacing Home button + User Links / Sign In */}
            <div className="flex items-center justify-between border-t border-white/10 px-1 pt-2 text-xs text-slate-300">
              <LanguageMenu language={language} onChange={changeLanguage} t={t} align="left" />

              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    to="/watchlist"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-2 py-1 transition hover:text-[#22D3EE]"
                  >
                    Watchlist
                  </Link>
                  <Link
                    to="/likelist"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-2 py-1 transition hover:text-[#22D3EE]"
                  >
                    Liked
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-2 py-1 transition hover:text-[#8B5CF6]"
                  >
                    Profile
                  </Link>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-1 font-semibold text-[#8B5CF6] transition hover:text-[#22D3EE]"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
