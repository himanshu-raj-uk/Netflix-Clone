import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Check } from "lucide-react";
import MovieCard from "../Components/MovieCard";
import useMovies from "../Hook/Usemovies";
import { useLanguage } from "../Context/LanguageContext";
import { translations } from "../Data/Translations";
import { withLanguage } from "../Library/tmdbLanguage";

const MIN_POSTERS = 5;

const getVisibleCount = (width) =>
  width < 640 ? 2 : width < 1024 ? 3 : width < 1280 ? 4 : width < 1536 ? 5 : 6;

function useVisibleCount() {
  const [count, setCount] = useState(() =>
    typeof window === "undefined" ? 6 : getVisibleCount(window.innerWidth)
  );

  useEffect(() => {
    const handleResize = () => setCount(getVisibleCount(window.innerWidth));
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return count;
}

const CARD_STYLE = {
  width:
    "calc((100% - var(--tile) - (var(--n) - var(--tg)) * var(--gap)) / var(--n))",
};

const ROW_VARS =
  "[--gap:0.5rem] [--tg:1] sm:[--gap:clamp(0.6rem,0.9vw,1rem)] sm:[--tg:0]";

const TILE_WITH =
  "[--tile:0px] sm:[--tile:clamp(4rem,4vw+1rem,6rem)]";

const TILE_NONE = "[--tile:0px]";

const TITLE =
  "text-[1.1rem] font-bold tracking-tight text-white sm:text-[clamp(1.2rem,0.9vw+0.9rem,1.7rem)]";

export default function Row({
  title,
  titleKey,
  fetchUrl,
  isFirstRow = false,
}) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const heading = (titleKey && t.rows?.[titleKey]) || title;

  const url = withLanguage(fetchUrl, language);
  const { movies, loading, error } = useMovies(url);
  const count = useVisibleCount();

  const [pages, setPages] = useState(1);
  const [isExpanding, setIsExpanding] = useState(false);

  const scroller = useRef(null);
  const previousPages = useRef(1);

  const list = (movies || []).filter((movie) => movie.poster_path);
  const batchSize = Math.max(MIN_POSTERS, count);
  const shownCount = batchSize * pages;
  const visibleMovies = list.slice(0, shownCount);
  const hasMore = shownCount < list.length;

  const sectionSpacing = isFirstRow
    ? "-mt-8 pt-0 sm:-mt-10 md:-mt-12 lg:-mt-14"
    : "mt-4 pt-0 sm:mt-6 md:mt-8";

  const sectionClass = `relative z-10 w-full px-4 pb-1 sm:px-8 sm:pb-3 md:px-12 lg:px-16 ${sectionSpacing}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPages(1);
      setIsExpanding(false);
      previousPages.current = 1;
      if (scroller.current) {
        scroller.current.scrollLeft = 0;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUrl, language]);

  useEffect(() => {
    if (!isExpanding) return;

    const timeout = setTimeout(() => {
      setIsExpanding(false);
    }, 650);

    return () => clearTimeout(timeout);
  }, [isExpanding, pages]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;

    if (pages > previousPages.current) {
      element.scrollBy({
        left: element.clientWidth * 0.65,
        behavior: "smooth",
      });
    }

    previousPages.current = pages;
  }, [pages, count, list.length]);

  const loadMore = useCallback(() => {
    if (isExpanding || !hasMore) return;
    setIsExpanding(true);
    setPages((current) => current + 1);
  }, [isExpanding, hasMore]);

  if (loading) {
    return (
      <section className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-1.5 rounded-full bg-[#8B5CF6]/50 animate-pulse" />
          <div className="h-6 w-44 animate-pulse rounded-lg bg-[#111827] sm:h-7 sm:w-52" />
        </div>

        <div className="flex gap-2 overflow-hidden sm:gap-4">
          {Array.from({ length: Math.max(MIN_POSTERS, count) }).map(
            (_, index) => (
              <div
                key={index}
                className="aspect-[2/3] w-[42vw] shrink-0 animate-pulse rounded-xl border border-white/[0.04] bg-[#111827] sm:w-[24vw] md:w-[19vw] lg:w-[15vw]"
              />
            )
          )}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={sectionClass}>
        <h2 className={TITLE}>{heading}</h2>
        <p className="mt-2 text-xs text-slate-400 sm:mt-3 sm:text-sm">
          Unable to load movies right now.
        </p>
      </section>
    );
  }

  if (!list.length) return null;

  return (
    <section className={sectionClass}>
      {/* Category Heading with cinematic accent bar */}
      <div className="relative z-0 mb-2 flex items-center gap-2.5 sm:mb-4">
        <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[#8B5CF6] to-[#22D3EE] shadow-[0_0_8px_rgba(139,92,246,0.5)] sm:h-5 sm:w-1.5" />
        <h2 className={TITLE}>{heading}</h2>
      </div>

      <div className="relative z-0 min-w-0">
        <div
          ref={scroller}
          style={{ "--n": count }}
          className={`relative flex items-stretch gap-[var(--gap)] overflow-x-auto overflow-y-hidden scroll-smooth px-1 py-1 sm:py-2 md:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${ROW_VARS} ${
            hasMore ? TILE_WITH : TILE_NONE
          }`}
        >
          {visibleMovies.map((movie) => (
            <div
              key={movie.id}
              style={CARD_STYLE}
              className="relative z-0 shrink-0"
            >
              <MovieCard movie={movie} />
            </div>
          ))}

          {/* Load More Button at end of carousel */}
          {hasMore && (
            <div className="flex w-12 shrink-0 items-center justify-center sm:w-16 md:w-20">
              <button
                type="button"
                aria-label="View more movies"
                disabled={isExpanding}
                onClick={loadMore}
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#111827] text-white transition-colors duration-200 hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/20 active:scale-95 disabled:cursor-wait sm:h-10 sm:w-10 ${
                  isExpanding ? "border-[#22D3EE] text-[#22D3EE]" : ""
                }`}
              >
                <Plus
                  className={`absolute h-4 w-4 transition-transform duration-300 ${
                    isExpanding ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100 text-white"
                  }`}
                  strokeWidth={2}
                />

                <Check
                  className={`absolute h-4 w-4 transition-transform duration-300 ${
                    isExpanding ? "rotate-0 scale-100 opacity-100 text-[#22D3EE]" : "-rotate-90 scale-50 opacity-0"
                  }`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
