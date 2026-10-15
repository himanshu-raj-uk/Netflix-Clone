import { useEffect, useState } from "react";
import { Play, Info, LoaderCircle } from "lucide-react";
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
  "pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_35%] transition-opacity duration-700 sm:object-center";

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
    "group relative inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-md px-3 text-[13px] font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-95 " +
    "sm:h-11 sm:flex-none sm:min-w-[130px] sm:gap-2 sm:px-5 sm:text-sm " +
    "md:h-12 md:min-w-[150px] md:px-7 md:text-base " +
    "lg:h-[52px] lg:min-w-[160px] lg:px-8";

  return (
    <header className="relative isolate z-0 h-[78svh] min-h-[500px] max-h-[900px] w-full overflow-hidden bg-[#0b0b0b] sm:h-[80vh] sm:min-h-[560px] lg:h-[88vh] lg:min-h-[640px]">
      {/* Loading state */}
      <div
        aria-hidden={!showSpinner}
        className={`pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-gradient-to-br from-white/[0.04] via-white/[0.08] to-white/[0.04] transition-opacity duration-500 ${showSpinner ? "animate-pulse opacity-100" : "opacity-0"
          }`}
      >
        <LoaderCircle className="h-8 w-8 animate-spin text-red-600 sm:h-10 sm:w-10" />
        <span className="sr-only">Loading</span>
      </div>

      {/* Centered backdrop */}
      {movie && (
        <>
          <img
            aria-hidden="true"
            alt=""
            fetchPriority="high"
            decoding="async"
            src={`${IMG}/${LOW}${movie.backdrop_path}`}
            className={`${heroImage} ${lowLoaded ? "opacity-100" : "opacity-0"
              }`}
            style={{ objectPosition: "center center" }}
          />

          <img
            aria-hidden="true"
            alt=""
            decoding="async"
            src={`${IMG}/${HIGH}${movie.backdrop_path}`}
            className={`${heroImage} ${highLoaded ? "opacity-100" : "opacity-0"
              }`}
            style={{ objectPosition: "center center" }}
          />
        </>
      )}

      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#0b0b0b_0%,rgba(11,11,11,0.92)_24%,rgba(11,11,11,0.55)_53%,rgba(0,0,0,0.25)_100%)] sm:hidden"
      />

      {/* Desktop overlays */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.35)_75%,rgba(11,11,11,0.9)_110%)] sm:block"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.55)_35%,rgba(0,0,0,0.15)_70%,rgba(0,0,0,0.08)_100%),linear-gradient(to_top,#0b0b0b_0%,rgba(11,11,11,0.6)_18%,rgba(11,11,11,0.1)_48%,transparent_100%)] sm:block"
      />

      {/* Responsive content */}
      <div className="absolute inset-0 z-10 flex items-end px-4 pb-8 sm:px-8 sm:pb-14 md:px-10 md:pb-16 lg:px-14 lg:pb-20 xl:px-16">
        {movie ? (
          <div className="flex w-full max-w-[34rem] flex-col items-start text-left md:max-w-2xl lg:max-w-3xl">
            <span className="mb-2 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md sm:mb-3 sm:px-3 sm:text-[11px] md:text-xs lg:px-3.5 lg:py-1.5">
              {t.trending}
            </span>

            <h1
              title={title}
              className="mb-2 w-full break-words text-balance text-[clamp(1.5rem,6.5vw,2.25rem)] font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)] sm:mb-4 sm:text-[clamp(2rem,4.5vw,3rem)] lg:text-[clamp(2.75rem,4vw,4rem)] xl:text-[clamp(3.25rem,4vw,4.5rem)]"
            >
              {title}
            </h1>

            <div className="mb-2.5 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-white/85 sm:mb-4 sm:gap-x-3 sm:text-sm lg:text-base">
              {movie.vote_average ? (
                <span className="font-bold text-green-400">
                  {movie.vote_average.toFixed(1)} {t.rating}
                </span>
              ) : null}

              {year && (
                <>
                  <span className="text-white/40">•</span>
                  <span>{year}</span>
                </>
              )}

              <span className="text-white/40">•</span>
              <span>HD</span>
            </div>

            <p className="mb-4 line-clamp-3 w-full max-w-xl text-[12px] leading-[1.55] text-white/90 drop-shadow-lg sm:mb-6 sm:line-clamp-4 sm:text-sm sm:leading-[1.65] md:text-[15px] lg:mb-8 lg:text-base lg:leading-[1.7] xl:max-w-2xl xl:text-lg">
              {overview}
            </p>

            <div className="flex w-full items-center gap-2.5 sm:w-auto sm:gap-3 md:gap-4">
              <button
                type="button"
                onClick={goToTrailer}
                className={`${btnBase} border border-white bg-white text-black hover:border-red-600 hover:bg-red-600 hover:text-white focus-visible:ring-red-500`}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Play
                  className="relative z-10 h-4 w-4 shrink-0 md:h-5 md:w-5"
                  fill="currentColor"
                  strokeWidth={2.5}
                />
                <span className="relative z-10">{t.play}</span>
              </button>

              <button
                type="button"
                onClick={goToTrailer}
                className={`${btnBase} border border-white/30 bg-white/15 text-white backdrop-blur-md hover:border-blue-500 hover:bg-blue-600 focus-visible:ring-blue-500`}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Info
                  className="relative z-10 h-4 w-4 shrink-0 md:h-5 md:w-5"
                  strokeWidth={2.5}
                />
                <span className="relative z-10">{t.moreInfo}</span>
              </button>
            </div>
          </div>
        ) : failed ? (
          <p className="pb-4 text-sm text-white/70 sm:text-base">
            {t.error}
          </p>
        ) : null}
      </div>

      {/* Bottom blend */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 bg-gradient-to-b from-transparent to-[#0b0b0b] sm:h-14" />
    </header>
  );
}

export default Banner;