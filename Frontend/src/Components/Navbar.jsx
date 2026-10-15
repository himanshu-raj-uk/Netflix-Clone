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

// Removes any background from the search field (input, form and its first-level wrappers)
const SEARCH_NO_BG =
  "[&_input]:bg-transparent [&_form]:bg-transparent [&>*]:bg-transparent";

// Phones/tablets: bigger field, no background on it, and the suggestions list
// anchors to the full-width panel so titles/headings get the whole width.
// The list is capped to the visible screen height so it scrolls inside the panel.
const MOBILE_SEARCH =
  "[&_input]:bg-transparent [&_form]:bg-transparent [&_input]:min-h-11 [&_input]:text-base [&>*]:!static " +
  "[&_[role=listbox]]:max-h-[calc(100svh-9rem)] [&_[role=listbox]]:overflow-y-auto " +
  "[&_[role=listbox]]:bg-[#0b0b0b] [&_ul]:bg-[#0b0b0b]";

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
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-red-500 to-red-800 text-xs font-bold text-white ${className}`}
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

// 3 bars that morph into a cross (and back) with a smooth transition
function MenuIcon({ open }) {
  const bar =
    "absolute left-0 h-0.5 w-full rounded-full bg-white transition-all duration-300 ease-in-out motion-reduce:transition-none";

  return (
    <span aria-hidden className="relative block h-4 w-5">
      <span
        className={`${bar} ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0 translate-y-0 rotate-0"
          }`}
      />
      <span
        className={`${bar} top-1/2 -translate-y-1/2 ${open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
          }`}
      />
      <span
        className={`${bar} ${open
            ? "top-1/2 -translate-y-1/2 -rotate-45"
            : "top-full -translate-y-full rotate-0"
          }`}
      />
    </span>
  );
}

// Custom language dropdown: English by default, smooth open/close, works on mouse + touch + keyboard
function LanguageMenu({ language, onChange, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // anything that is not "hi" falls back to English
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
        className={`flex h-9 items-center gap-1 rounded-md border bg-black/40 px-2 text-xs font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/70 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 motion-reduce:transition-none sm:h-10 sm:gap-2 sm:px-3.5 sm:text-sm ${open ? "border-white/70" : "border-white/30"
          }`}
      >
        <Globe size={15} className="shrink-0" />
        <span className="whitespace-nowrap sm:hidden">{current === "hi" ? "हिं" : "EN"}</span>
        <span className="hidden whitespace-nowrap sm:inline">{labelOf(currentItem)}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-white/80 transition-transform duration-300 ease-in-out motion-reduce:transition-none ${open ? "rotate-180" : "rotate-0"
            }`}
        />
      </button>

      <ul
        role="listbox"
        aria-label={t?.language?.label || "Language"}
        className={`absolute right-0 top-full z-50 mt-2 min-w-[7rem] origin-top-right overflow-hidden rounded-lg border border-white/15 bg-neutral-900/95 p-1 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out motion-reduce:transition-none ${open
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible pointer-events-none -translate-y-2 scale-95 opacity-0"
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
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-200 ${active
                    ? "bg-red-600/25 text-white"
                    : "text-gray-200 hover:bg-white/10 hover:text-white"
                  }`}
              >
                {labelOf(item)}
                {active && <Check size={14} className="text-red-400" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// true on screens >= 1024px (wide search bar), false on phones/tablets (3-bar menu)
function useIsDesktop() {
  const query = "(min-width: 1024px)";
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
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

  // mobileOpen drives the animation, panelMounted keeps the panel in the DOM
  // long enough for the closing animation to finish
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const navRef = useRef(null);

  // true only while the mobile search field is focused AND the user has typed something.
  // Opening the panel with the 3-bar icon never hides the language button.
  const searchWrapRef = useRef(null);
  const syncTimer = useRef(null);
  const [searchActive, setSearchActive] = useState(false);

  const syncSearchState = () => {
    const wrap = searchWrapRef.current;
    const input = wrap?.querySelector("input");
    if (!wrap || !input) {
      setSearchActive(false);
      return;
    }
    const focusInside = wrap.contains(document.activeElement);
    setSearchActive(focusInside && input.value.trim().length > 0);
  };

  const scheduleSync = (delay = 0) => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(syncSearchState, delay);
  };

  // clear the pending timer on unmount
  useEffect(() => () => clearTimeout(syncTimer.current), []);

  // keep the profile icon + name in sync after login / profile edit / logout
  useEffect(() => {
    const sync = () => setUser(getUser());
    sync();
    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // open / close with animation
  useEffect(() => {
    if (mobileOpen) {
      setPanelMounted(true);
      return;
    }
    setSearchActive(false);
    const timer = setTimeout(() => setPanelMounted(false), 300);
    return () => clearTimeout(timer);
  }, [mobileOpen]);

  // close the mobile search when changing page or switching to desktop
  useEffect(() => setMobileOpen(false), [location.pathname, isDesktop]);

  // close when tapping outside or pressing Escape
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
      className={`fixed inset-x-0 top-0 z-50 w-full px-3 transition-all duration-500 ease-in-out motion-reduce:transition-none sm:px-6 lg:px-10 2xl:px-14 ${scrolled
          ? "bg-black/25 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
          : "bg-gradient-to-b from-black/60 via-black/20 to-transparent backdrop-blur-0"
        }`}
    >
      {/* Dark blurred backdrop while the mobile search is open, hides the banner behind the results */}
      {!isDesktop && panelMounted && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[100svh] bg-black/90 backdrop-blur-xl transition-opacity duration-300 motion-reduce:transition-none ${mobileOpen ? "opacity-100" : "opacity-0"
            }`}
        />
      )}

      <div
        ref={navRef}
        className="relative mx-auto grid h-14 w-full max-w-[1920px] grid-cols-[auto_1fr_auto] items-center gap-2 sm:h-16 sm:gap-4 lg:gap-8"
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="Netflix Home"
          className="shrink-0 transition-transform duration-300 hover:scale-105 motion-reduce:transition-none"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
            alt="Netflix"
            className="w-[clamp(5rem,26vw,6.75rem)] sm:w-24 md:w-28 lg:w-32 xl:w-36"
          />
        </Link>

        {/* Wide search (desktop only), no background */}
        <div className="flex min-w-0 justify-center">
          {isDesktop && (
            <div className={`w-full max-w-[clamp(24rem,46vw,52rem)] ${SEARCH_NO_BG}`}>
              <NavSearch variant="desktop" />
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="col-start-3 flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 md:gap-3">
          {/* Language: only here on desktop. On phones/tablets it sits next to the search bar */}
          {isDesktop && <LanguageMenu language={language} onChange={changeLanguage} t={t} />}

          {/* Profile (opens the profile page) or Sign in. No border. */}
          {user ? (
            <Link
              to="/profile"
              aria-label="Open your profile"
              className="flex h-8 min-w-0 items-center gap-1.5 rounded-full p-0.5 pr-2 text-white transition-all duration-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:h-10 sm:gap-2.5 sm:pr-3"
            >
              <Avatar user={user} className="h-7 w-7 sm:h-9 sm:w-9" />
              <span className="max-w-[5.5rem] truncate text-xs font-semibold sm:max-w-[8rem] sm:text-sm md:max-w-[9rem]">
                {firstName}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-red-600 px-3 text-xs font-semibold text-white transition-all duration-300 hover:bg-red-700 sm:h-10 sm:px-5 sm:text-sm"
            >
              {t.navbar.signIn}
            </Link>
          )}

          {/* 3-bar menu -> cross (phones + tablets) */}
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close search" : "Open search"}
              aria-expanded={mobileOpen}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:h-10 sm:w-10"
            >
              <MenuIcon open={mobileOpen} />
            </button>
          )}
        </div>

        {/* Search panel (phones + tablets) */}
        {!isDesktop && panelMounted && (
          <div
            className={`absolute inset-x-0 top-full mx-auto mt-1 flex w-full items-center gap-2 rounded-xl border border-white/15 bg-[#0b0b0b]/95 p-2 backdrop-blur-xl transition-all duration-300 ease-out motion-reduce:transition-none sm:max-w-2xl sm:p-3 ${mobileOpen
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-2 scale-95 opacity-0"
              }`}
          >
            <div
              ref={searchWrapRef}
              className={`min-w-0 flex-1 ${MOBILE_SEARCH}`}
              onFocus={() => scheduleSync(0)}
              onInput={() => scheduleSync(0)}
              onClick={() => scheduleSync(0)}
              onBlur={() => scheduleSync(200)}
            >
              <NavSearch variant="mobile" onDone={() => setMobileOpen(false)} />
            </div>

            {/* Hidden only while the user is typing in the search field */}
            {!searchActive && (
              <LanguageMenu language={language} onChange={changeLanguage} t={t} />
            )}
          </div>
        )}
      </div>
    </nav>
  );
}