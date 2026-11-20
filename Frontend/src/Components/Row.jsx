import { useCallback, useEffect, useRef, useState } from "react";
import MovieCard from "../Components/MovieCard";
import useMovies from "../Hook/Usemovies";
import { useLanguage } from "../Context/LanguageContext";
import { translations } from "../Data/Translations";
import { withLanguage } from "../Library/tmdbLanguage";

const getVisibleCount = (width) =>
  width < 640 ? 2.3 : width < 1024 ? 3.3 : width < 1280 ? 4.3 : width < 1536 ? 5.3 : 6.3;

function useVisibleCount() {
  const [count, setCount] = useState(() =>
    typeof window === "undefined" ? 6.3 : getVisibleCount(window.innerWidth)
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
  width: "calc((100% - (var(--n) - 1) * var(--gap)) / var(--n))",
};

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

  const scroller = useRef(null);
  const rafId = useRef(null);

  const list = (movies || []).filter((movie) => movie.poster_path);

  const sectionSpacing = isFirstRow
    ? "-mt-8 pt-0 sm:-mt-10 md:-mt-12 lg:-mt-14"
    : "mt-3 pt-0 sm:mt-5 md:mt-6";

  const sectionClass = `relative z-10 w-full px-4 pb-0 sm:px-8 sm:pb-1 md:px-12 lg:px-16 ${sectionSpacing}`;

  // Dynamically calculate 3D arc curve as the user slides
  const updateArcEffect = useCallback(() => {
    const el = scroller.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const halfWidth = rect.width / 2;

    const cards = el.querySelectorAll(".movie-arc-item");
    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      // Normalized offset from center: -1 (left) to 0 (center) to +1 (right)
      const delta = (cardCenter - centerX) / (halfWidth || 1);
      const clampedDelta = Math.max(-1.4, Math.min(1.4, delta));

      // Curved arc rotation: left tilts clockwise (+deg), right tilts counter-clockwise (-deg)
      const rotateY = -clampedDelta * 26; // in degrees
      // Recede backward along the cylindrical arc
      const translateZ = -Math.pow(Math.abs(clampedDelta), 1.5) * 65; // in px
      // Scale down gently on the curved sides
      const scale = Math.max(0.85, 1 - Math.abs(clampedDelta) * 0.08);
      // Subtle depth fade on outer edges
      const opacity = Math.max(0.68, 1 - Math.abs(clampedDelta) * 0.2);

      card.style.transform = `perspective(1100px) translateZ(${translateZ.toFixed(1)}px) rotateY(${rotateY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = `${opacity.toFixed(2)}`;
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    updateArcEffect();

    const onScroll = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(updateArcEffect);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Initial layout pass once posters mount
    const timer = setTimeout(updateArcEffect, 60);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [updateArcEffect, list.length, count]);

  if (loading) {
    return (
      <section className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-1.5 rounded-full bg-[#8B5CF6]/50 animate-pulse" />
          <div className="h-6 w-44 animate-pulse rounded-lg bg-[#111827] sm:h-7 sm:w-52" />
        </div>

        <div className="flex gap-2.5 overflow-hidden sm:gap-3.5 md:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] w-[40vw] shrink-0 animate-pulse rounded-2xl border border-white/[0.04] bg-[#111827] sm:w-[26vw] md:w-[21vw] lg:w-[15vw]"
            />
          ))}
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

      {/* 3D Arc Slider Container */}
      <div className="group/row relative z-0 min-w-0 [perspective:1200px]">
        {/* Continuous 3D Arc Movie Slider */}
        <div
          ref={scroller}
          style={{
            "--n": count,
            "--gap": "clamp(0.65rem, 1vw, 1.25rem)",
          }}
          className="relative flex items-stretch gap-[var(--gap)] overflow-x-auto overflow-y-hidden scroll-smooth py-1.5 sm:py-2.5 md:py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [transform-style:preserve-3d]"
        >
          {list.map((movie) => (
            <div
              key={movie.id}
              style={CARD_STYLE}
              className="movie-arc-item relative z-0 shrink-0 transform-gpu transition-all duration-150 ease-out will-change-transform"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
