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
  "[--gap:0.4rem] [--tg:1] sm:[--gap:clamp(0.5rem,0.8vw,0.85rem)] sm:[--tg:0]";

const TILE_WITH =
  "[--tile:0px] sm:[--tile:clamp(4rem,4vw+1rem,6rem)]";

const TILE_NONE = "[--tile:0px]";

// Mobile: smaller fixed size. sm and up: same fluid size as before.
const TITLE =
  "text-[1.05rem] font-semibold leading-tight text-white sm:text-[clamp(1.1rem,0.9vw+0.85rem,1.6rem)]";

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

  // Mobile: first row is pulled up under the banner, other rows sit close together.
  // sm and up: unchanged.
  const sectionSpacing = isFirstRow
    ? "-mt-10 pt-0 sm:-mt-12 md:-mt-14 lg:-mt-16"
    : "mt-1 pt-0 sm:mt-3 md:mt-4";

  const sectionClass = `relative z-10 w-full px-4 pb-0 sm:px-6 sm:pb-2 md:px-10 lg:px-16 ${sectionSpacing}`;

  useEffect(() => {
    setPages(1);
    setIsExpanding(false);
    previousPages.current = 1;

    if (scroller.current) {
      scroller.current.scrollLeft = 0;
    }
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
        <div className="mb-2 h-6 w-36 animate-pulse rounded bg-white/10 sm:mb-3 sm:h-7 sm:w-40" />

        <div className="flex gap-2 overflow-hidden sm:gap-4">
          {Array.from({ length: Math.max(MIN_POSTERS, count) }).map(
            (_, index) => (
              <div
                key={index}
                className="aspect-[2/3] w-[42vw] shrink-0 animate-pulse rounded-md bg-white/10 sm:w-[24vw] md:w-[19vw] lg:w-[15vw]"
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
        <p className="mt-2 text-xs text-gray-400 sm:mt-3 sm:text-sm">
          Unable to load movies right now.
        </p>
      </section>
    );
  }

  if (!list.length) return null;

  return (
    <section className={sectionClass}>
      <div className="relative z-0 mb-1 sm:mb-4">
        <h2 className={TITLE}>{heading}</h2>
      </div>

      <div className="relative z-0 min-w-0">
        <div
          ref={scroller}
          style={{ "--n": count }}
          className={`relative flex items-stretch gap-[var(--gap)] overflow-x-auto overflow-y-hidden scroll-smooth px-1 py-1 sm:py-2 md:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${ROW_VARS} ${hasMore ? TILE_WITH : TILE_NONE
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

          {hasMore && (
            <div className="flex w-12 shrink-0 items-center justify-center sm:w-16 md:w-20">
              <button
                type="button"
                aria-label="View more movies"
                disabled={isExpanding}
                onClick={loadMore}
                className={`group/more relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-0 text-white transition-[background-color,transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 active:scale-95 disabled:cursor-wait sm:h-10 sm:w-10 md:h-11 md:w-11 ${isExpanding
                    ? "bg-red-600 shadow-[0_0_18px_rgba(229,9,20,0.35)]"
                    : "bg-white/15 hover:bg-green-600 hover:shadow-[0_0_18px_rgba(34,197,94,0.3)]"
                  }`}
              >
                <Plus
                  className={`absolute h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanding
                      ? "rotate-90 scale-50 opacity-0"
                      : "rotate-0 scale-100 opacity-100"
                    }`}
                  strokeWidth={2}
                />

                <Check
                  className={`absolute h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanding
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-50 opacity-0"
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