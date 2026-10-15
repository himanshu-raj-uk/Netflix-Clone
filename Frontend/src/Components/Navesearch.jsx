import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

// variant: "desktop" (centered bar with dropdown) | "mobile" (inside the 3-bar panel)
export default function NavSearch({ variant = "desktop", onDone }) {
  const navigate = useNavigate();
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

  /* ---- real trending titles for the animated placeholder ---- */
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

  /* ---- rotate placeholder names ---- */
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

  /* ---- focus on mobile, outside click + Escape on desktop ---- */
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

  /* ---- debounced TMDB search ---- */
  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setError("");
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
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
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  /* ---- profile-related matches ---- */
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

  /* ---- navigation: results open the trailer page directly ---- */
  const go = (to) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onDone?.();
    navigate(to);
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
          ? "mt-3 max-h-[60vh] overflow-y-auto overscroll-contain"
          : "absolute left-0 right-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto overscroll-contain rounded-lg border border-white/15 bg-[#111]/95 p-2 shadow-2xl backdrop-blur-md"
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
              <l.icon size={18} className="shrink-0 text-gray-300" />
              <span className="truncate text-sm">{l.label}</span>
            </ResultRow>
          ))}
        </Group>
      )}

      {error && <p className="px-3 py-4 text-sm text-red-400">{error}</p>}
      {searching && !results.length && !accountMatches.length && !listMatches.length && (
        <p className="px-3 py-4 text-sm text-gray-400">Searching...</p>
      )}
      {nothingFound && (
        <p className="px-3 py-4 text-sm text-gray-400">
          No results for “{q}”. Check the spelling or try another title.
        </p>
      )}
    </div>
  );

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={onSubmit} role="search">
        <div className="flex h-10 w-full items-center gap-2 rounded border border-white/40 bg-transparent px-3 focus-within:border-white">
          <Search size={17} className="shrink-0 text-gray-300" />

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
              className="h-full w-full bg-transparent text-base text-white outline-none md:text-sm"
            />
            {!query && (
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center truncate text-sm text-gray-400 transition-opacity duration-200 ${phVisible ? "opacity-100" : "opacity-0"
                  }`}
              >
                {titles[idx % titles.length]}
              </span>
            )}
          </div>

          {searching && <LoaderCircle size={16} className="shrink-0 animate-spin text-gray-300" />}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="shrink-0 text-gray-300 hover:text-white"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </form>

      {showPanel && panel}
    </div>
  );
}

/* ---------- small helpers ---------- */
const Group = ({ title, children }) => (
  <div className="mb-1">
    <p className="px-3 pb-1 pt-2 text-xs font-semibold text-gray-500">{title}</p>
    {children}
  </div>
);

const ResultRow = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-white transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
  >
    {children}
  </button>
);

const Thumb = ({ src, person, tv }) => (
  <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-[#222] text-gray-500">
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
    <span className="block truncate text-sm font-medium">{title}</span>
    <span className="block truncate text-xs text-gray-400">{sub}</span>
  </span>
);