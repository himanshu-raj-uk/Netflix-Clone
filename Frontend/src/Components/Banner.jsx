import { useEffect, useState } from "react";
import { Play, Info, LoaderCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import requests from "../Library/Tmdb";
import { useLanguage } from "../Context/LanguageContext";
import { translations } from "../Data/Translations";
import { withLanguage } from "../Library/tmdbLanguage";

const IMG = "https://image.tmdb.org/t/p";
const LOW = "w780";
const HIGH = "w1280";

const trendingCache = {};

function preload(url, onDone) {
  const img = new Image();
  img.onload = () => onDone(true);
  img.onerror = () => onDone(false);
  img.src = url;
  return img;
}

const heroImage =
  "pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_30%] transition-opacity duration-1000 sm:object-center";

function Banner() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (translations[language] || translations.en).banner;

  const [movie, setMovie] = useState(null);
  const [lowLoaded, setLowLoaded] = useState(false);
  const [highLoaded, setHighLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchBanner() {
      try {
        let results = trendingCache[language];

        if (!results) {
          const response = await fetch(
            withLanguage(requests.trending, language)
          );

          if (!response.ok) {
            throw new Error("Failed to fetch banner");
          }

          const data = await response.json();

          results = (data?.results || []).filter(
            (item) => item.backdrop_path
          );

          trendingCache[language] = results;
        }

        if (cancelled) return;

        if (!results.length) {
          setFailed(true);
          return;
        }

        results.slice(0, 3).forEach((item) =>
          preload(`${IMG}/${LOW}${item.backdrop_path}`, () => { })
        );

        const pick =
          results[Math.floor(Math.random() * results.length)];

        setLowLoaded(false);
        setHighLoaded(false);
        setFailed(false);
        setMovie(pick);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch banner movie:", error);
          setFailed(true);
        }
      }
    }

    fetchBanner();

    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (!movie) return;

    let cancelled = false;

    preload(`${IMG}/${LOW}${movie.backdrop_path}`, () => {
      if (!cancelled) setLowLoaded(true);
    });

    preload(`${IMG}/${HIGH}${movie.backdrop_path}`, (ok) => {
      if (!cancelled && ok) setHighLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [movie]);

  const title = movie?.title || movie?.name;

  const year = (
    movie?.release_date ||
    movie?.first_air_date ||
    ""
  ).slice(0, 4);

  const overview = movie?.overview || t.fallbackOverview;

  const goToTrailer = () => {
    if (!movie) return;

    const mediaType =
      movie.media_type || (movie.first_air_date ? "tv" : "movie");

    navigate(`/watch/${mediaType}/${movie.id}`, {
      state: { movie, mediaType },
    });
  };

  const showSpinner = !failed && (!movie || !lowLoaded);

  const btnBase =
    "group inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-4 text-xs font-semibold transition-colors duration-200 active:scale-95 " +
    "sm:h-11 sm:flex-none sm:min-w-[130px] sm:px-6 sm:text-sm " +
    "md:min-w-[145px]";

  return (
    <header className="relative isolate z-0 h-[80svh] min-h-[500px] max-h-[900px] w-full overflow-hidden bg-[#080B14] sm:h-[82vh] sm:min-h-[560px] lg:h-[86vh] lg:min-h-[640px]">
      {/* Loading state */}
      <div
        aria-hidden={!showSpinner}
        className={`pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-[#080B14] transition-opacity duration-500 ${
          showSpinner ? "opacity-100" : "opacity-0"
        }`}
      >
        <LoaderCircle className="h-8 w-8 animate-spin text-[#8B5CF6]" />
      </div>

      {/* Hero Backdrop Images */}
      {movie && (
        <>
          <img
            aria-hidden="true"
            alt=""
            fetchPriority="high"
            decoding="async"
            src={`${IMG}/${LOW}${movie.backdrop_path}`}
            className={`${heroImage} ${lowLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ objectPosition: "center 30%" }}
          />

          <img
            aria-hidden="true"
            alt=""
            decoding="async"
            src={`${IMG}/${HIGH}${movie.backdrop_path}`}
            className={`${heroImage} ${highLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ objectPosition: "center 30%" }}
          />
        </>
      )}

      {/* Mobile Dark Gradient Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#080B14_0%,rgba(8,11,20,0.92)_28%,rgba(8,11,20,0.55)_55%,rgba(8,11,20,0.2)_100%)] sm:hidden"
      />

      {/* Desktop Gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(8,11,20,0.4)_70%,rgba(8,11,20,0.95)_115%)] sm:block"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(8,11,20,0.92)_0%,rgba(8,11,20,0.65)_35%,rgba(8,11,20,0.2)_70%,rgba(8,11,20,0.08)_100%),linear-gradient(to_top,#080B14_0%,rgba(8,11,20,0.7)_20%,rgba(8,11,20,0.15)_50%,transparent_100%)] sm:block"
      />

      {/* Hero Content */}
      <div className="absolute inset-0 z-10 flex items-end px-4 pb-10 sm:px-8 sm:pb-14 md:px-12 md:pb-16 lg:px-16 lg:pb-20">
        {movie ? (
          <div className="flex w-full max-w-[36rem] flex-col items-start text-left md:max-w-2xl lg:max-w-3xl">
            {/* Category / Trending Badge WITHOUT sparkles icon */}
            <div className="mb-2.5 flex items-center gap-2">
              <span className="rounded-md border border-[#8B5CF6]/40 bg-[#111827]/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#22D3EE]">
                {t.trending}
              </span>

              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-300">
                4K Ultra HD
              </span>
            </div>

            {/* Title */}
            <h1
              title={title}
              className="mb-2.5 w-full break-words text-balance text-[clamp(1.75rem,6.5vw,2.5rem)] font-bold leading-[1.1] tracking-tight text-white drop-shadow-md sm:mb-3.5 sm:text-[clamp(2.2rem,4.5vw,3.2rem)] lg:text-[clamp(2.8rem,4vw,4.2rem)]"
            >
              {title}
            </h1>

            {/* Meta row */}
            <div className="mb-3 flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-200 sm:mb-4 sm:text-sm">
              {movie.vote_average ? (
                <span className="flex items-center gap-1 font-semibold text-[#22D3EE]">
                  <Star size={13} className="fill-[#22D3EE] text-[#22D3EE]" />
                  {movie.vote_average.toFixed(1)} {t.rating}
                </span>
              ) : null}

              {year && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="text-slate-300">{year}</span>
                </>
              )}

              <span className="text-white/30">•</span>
              <span className="rounded border border-white/20 bg-white/5 px-1.5 py-0.2 text-[10px] text-slate-300">
                HD
              </span>
            </div>

            {/* Overview description */}
            <p className="mb-5 line-clamp-3 w-full max-w-xl text-xs leading-[1.6] text-slate-300 sm:mb-6 sm:line-clamp-4 sm:text-sm sm:leading-[1.7] md:text-[15px] lg:mb-7">
              {overview}
            </p>

            {/* Clean, Simple, Normal Buttons (No glowing shadow, no multi-color gradient) */}
            <div className="flex w-full items-center gap-2.5 sm:w-auto sm:gap-3">
              <button
                type="button"
                onClick={goToTrailer}
                className={`${btnBase} bg-[#8B5CF6] text-white hover:bg-[#7C3AED]`}
              >
                <Play
                  className="h-4 w-4 shrink-0 fill-current"
                />
                <span>{t.play}</span>
              </button>

              <button
                type="button"
                onClick={goToTrailer}
                className={`${btnBase} border border-white/20 bg-[#111827]/80 text-white hover:bg-white/10`}
              >
                <Info
                  className="h-4 w-4 shrink-0 text-[#22D3EE]"
                />
                <span>{t.moreInfo}</span>
              </button>
            </div>
          </div>
        ) : failed ? (
          <p className="pb-4 text-sm text-slate-400 sm:text-base">
            {t.error}
          </p>
        ) : null}
      </div>

      {/* Smooth bottom gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-b from-transparent to-[#080B14]"
      />
    </header>
  );
}

export default Banner;
