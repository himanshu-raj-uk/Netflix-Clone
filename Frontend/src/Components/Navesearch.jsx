import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  X,
  LoaderCircle,
  UserRound,
  Heart,
  Bookmark,
  LockKeyhole,
  Film,
  Tv,
} from "lucide-react";
import requests, { img, searchMulti } from "../Library/Tmdb";
import { getList, getUser } from "../Library/UserStore";

const FALLBACK_TITLES = [
  "Inception",
  "Stranger Things",
  "The Dark Knight",
  "Money Heist",
  "Interstellar",
  "Breaking Bad",
  "Squid Game",
  "Dune",
  "Peaky Blinders",
  "Avengers: Endgame",
];

const ACCOUNT_LINKS = [
  { label: "My Profile", to: "/profile", icon: UserRound, words: "profile account edit name photo" },
  { label: "Liked titles", to: "/profile", icon: Heart, words: "liked likes favourites favorites" },
  { label: "My List", to: "/profile", icon: Bookmark, words: "my list watchlist saved" },
  { label: "Change Password", to: "/change-password", icon: LockKeyhole, words: "change password security" },
];

export default function NavSearch({ variant = "desktop", onDone }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = variant === "mobile";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const [titles, setTitles] = useState(FALLBACK_TITLES);
  const [idx, setIdx] = useState(0);
  const [phVisible, setPhVisible] = useState(true);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const q = query.trim();
  const ql = q.toLowerCase();

  /* Real trending titles for the animated placeholder */
  useEffect(() => {
    const controller = new AbortController();
    fetch(requests.trending, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = (d?.results || []).map((m) => m.title || m.name).filter(Boolean).slice(0, 12);
        if (list.length >= 3) setTitles(list);
      })
      .catch(() => { });
    return () => controller.abort();
  }, []);

  /* Rotate placeholder names */
  useEffect(() => {
    let swap;
    const timer = setInterval(() => {
      setPhVisible(false);
      swap = setTimeout(() => {
        setIdx((i) => (i + 1) % titles.length);
        setPhVisible(true);
      }, 250);
    }, 2800);
    return () => {
      clearInterval(timer);
      clearTimeout(swap);
    };
  }, [titles]);

  /* Focus on mobile, outside click + Escape on desktop */
  useEffect(() => {
    if (isMobile) inputRef.current?.focus();
  }, [isMobile]);

  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* Debounced TMDB search */
  useEffect(() => {
    if (q.length < 2) {
      const timer = setTimeout(() => {
        setResults([]);
        setSearching(false);
        setError("");
      }, 0);
      return () => clearTimeout(timer);
    }

    const controller = new AbortController();
    const setSearchingTimer = setTimeout(() => setSearching(true), 0);
    const searchTimer = setTimeout(async () => {
      try {
        const data = await searchMulti(q, controller.signal);
        setResults(
          data
            .filter(
              (r) =>
                r.media_type === "movie" ||
                r.media_type === "tv" ||
                (r.media_type === "person" && r.known_for?.length)
            )
            .slice(0, 10)
        );
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") setError("Search is unavailable right now. Try again.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(setSearchingTimer);
      clearTimeout(searchTimer);
      controller.abort();
    };
  }, [q]);

  /* Profile-related matches */
  const user = getUser();
  const accountMatches = useMemo(() => {
    if (!user || ql.length < 2) return [];
    const nameHit = (user.name || "").toLowerCase().includes(ql);
    return ACCOUNT_LINKS.filter(
      (l) => nameHit || l.label.toLowerCase().includes(ql) || l.words.includes(ql)
    ).slice(0, 3);
  }, [user?.name, ql]); // eslint-disable-line react-hooks/exhaustive-deps

  const listMatches = useMemo(() => {
    if (!user || ql.length < 2) return [];
    const seen = new Set();
    return [...getList("liked"), ...getList("watchlist")]
      .filter((i) => (i.title || "").toLowerCase().includes(ql))
      .filter((i) => {
        const k = `${i.mediaType}-${i.id}`;
        return seen.has(k) ? false : (seen.add(k), true);
      })
      .slice(0, 3);
  }, [user?.name, ql]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (to) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onDone?.();
    const isTargetSecondary = ["/watchlist", "/likelist", "/profile", "/change-password"].includes(to);
    navigate(to, { replace: isTargetSecondary && location.pathname !== "/" });
  };

  const watchPath = (r) => {
    if (r.media_type === "person") {
      const k = r.known_for?.[0];
      return k ? `/watch/${k.media_type || "movie"}/${k.id}` : null;
    }
    return `/watch/${r.media_type}/${r.id}`;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const first =
      (listMatches[0] && `/watch/${listMatches[0].mediaType}/${listMatches[0].id}`) ||
      results.map(watchPath).find(Boolean) ||
      accountMatches[0]?.to;
    if (first) go(first);
  };

  const showPanel = q.length >= 2 && (isMobile || open);
  const nothingFound =
    !searching && !error && !results.length && !accountMatches.length && !listMatches.length;

  const panel = (
    <div
      className={
        isMobile
          ? "mt-3 max-h-[60vh] overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-[#111827]/95 p-2 shadow-2xl backdrop-blur-xl"
          : "absolute left-0 right-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-[#111827]/95 p-2 shadow-[0_15px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(139,92,246,0.15)] backdrop-blur-2xl"
      }
    >
      {listMatches.length > 0 && (
        <Group title="In your lists">
          {listMatches.map((i) => (
            <ResultRow key={`${i.mediaType}-${i.id}`} onClick={() => go(`/watch/${i.mediaType}/${i.id}`)}>
              <Thumb src={img(i.poster, "w92")} tv={i.mediaType === "tv"} />
              <Meta title={i.title} sub={`${i.mediaType === "tv" ? "Series" : "Movie"}${i.year ? ` · ${i.year}` : ""}`} />
            </ResultRow>
          ))}
        </Group>
      )}

      {results.length > 0 && (
        <Group title="Movies & shows">
          {results.map((r) => {
            const target = watchPath(r);
            const person = r.media_type === "person";
            const year = (r.release_date || r.first_air_date || "").slice(0, 4);
            const sub = person
              ? `${r.known_for_department || "Person"} · ${r.known_for?.[0]?.title || r.known_for?.[0]?.name || ""}`
              : `${r.media_type === "tv" ? "Series" : "Movie"}${year ? ` · ${year}` : ""}`;
            return (
              <ResultRow key={`${r.media_type}-${r.id}`} onClick={() => target && go(target)}>
                <Thumb
                  src={img(person ? r.profile_path : r.poster_path, "w92")}
                  person={person}
                  tv={r.media_type === "tv"}
                />
                <Meta title={r.title || r.name} sub={sub} />
              </ResultRow>
            );
          })}
        </Group>
      )}

      {accountMatches.length > 0 && (
        <Group title="Your account">
          {accountMatches.map((l) => (
            <ResultRow key={l.label} onClick={() => go(l.to)}>
              <l.icon size={18} className="shrink-0 text-[#22D3EE]" />
              <span className="truncate text-sm font-medium">{l.label}</span>
            </ResultRow>
          ))}
        </Group>
      )}

      {error && <p className="px-3 py-4 text-sm text-[#8B5CF6]">{error}</p>}
      {searching && !results.length && !accountMatches.length && !listMatches.length && (
        <p className="px-3 py-4 text-sm text-slate-400">Searching catalog...</p>
      )}
      {nothingFound && (
        <p className="px-3 py-4 text-sm text-slate-400">
          No results for “{q}”. Try another keyword or movie title.
        </p>
      )}
    </div>
  );

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={onSubmit} role="search">
        <div className="group relative flex h-10 w-full items-center gap-2.5 rounded-xl border border-white/10 bg-[#111827]/70 px-3.5 backdrop-blur-md transition-all duration-300 hover:border-white/20 focus-within:border-[#8B5CF6] focus-within:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
          <Search size={16} className="shrink-0 text-slate-400 transition-colors group-focus-within:text-[#22D3EE]" />

          <div className="relative h-full min-w-0 flex-1">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              aria-label="Search movies, shows and your profile"
              autoComplete="off"
              enterKeyHint="search"
              className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-transparent"
            />
            {!query && (
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center truncate text-sm text-slate-400 transition-opacity duration-200 ${
                  phVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                Search titles e.g. <span className="ml-1 text-[#22D3EE] font-medium">{titles[idx % titles.length]}</span>
              </span>
            )}
          </div>

          {searching && <LoaderCircle size={16} className="shrink-0 animate-spin text-[#22D3EE]" />}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-0.5 text-slate-400 transition-colors hover:text-white hover:bg-white/10"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </form>

      {showPanel && panel}
    </div>
  );
}

const Group = ({ title, children }) => (
  <div className="mb-1.5">
    <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-[#22D3EE]">{title}</p>
    {children}
  </div>
);

const ResultRow = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-white transition-all hover:bg-[#8B5CF6]/20 hover:shadow-[0_0_12px_rgba(139,92,246,0.15)] focus-visible:bg-[#8B5CF6]/20 focus-visible:outline-none"
  >
    {children}
  </button>
);

const Thumb = ({ src, person, tv }) => (
  <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#1e293b] text-slate-400">
    {src ? (
      <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
    ) : person ? (
      <UserRound size={18} />
    ) : tv ? (
      <Tv size={18} />
    ) : (
      <Film size={18} />
    )}
  </span>
);

const Meta = ({ title, sub }) => (
  <span className="min-w-0 flex-1">
    <span className="block truncate text-sm font-semibold text-slate-100">{title}</span>
    <span className="block truncate text-xs text-slate-400">{sub}</span>
  </span>
);
