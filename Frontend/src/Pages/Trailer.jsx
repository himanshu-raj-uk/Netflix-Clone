import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Loader2, ExternalLink } from "lucide-react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import requests from "../Library/Tmdb";
import { useLanguage } from "../Context/LanguageContext";
import { translations } from "../Data/Translations";

const TMDB_IMAGE = "https://image.tmdb.org/t/p/original";

export default function Trailer() {
  const { id, mediaType = "movie" } = useParams();
  const { state } = useLocation();
  const { language } = useLanguage();
  const t = (translations[language] || translations.en).trailer;

  const movie = state?.movie;
  const title =
    movie?.title ||
    movie?.name ||
    movie?.original_title ||
    movie?.original_name;

  const year = (
    movie?.release_date ||
    movie?.first_air_date ||
    ""
  ).slice(0, 4);

  const [videoKey, setVideoKey] = useState(null);
  const [status, setStatus] = useState("loading");
  const [backdrop, setBackdrop] = useState(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    setVideoKey(null);
    window.scrollTo({ top: 0, behavior: "instant" });

    (async () => {
      try {
        const res = await fetch(requests.trailers(id, mediaType));

        if (!res.ok) {
          throw new Error("Failed to fetch trailer");
        }

        const data = await res.json();

        const videos = (data?.results || []).filter(
          (video) => video.site === "YouTube"
        );

        const pick =
          videos.find(
            (video) => video.type === "Trailer" && video.official
          ) ||
          videos.find((video) => video.type === "Trailer") ||
          videos.find((video) => video.type === "Teaser") ||
          videos[0];

        if (cancelled) return;

        if (pick) {
          setVideoKey(pick.key);
          setStatus("ready");
        } else {
          setStatus("empty");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Trailer fetch failed:", error);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, mediaType]);

  useEffect(() => {
    let cancelled = false;

    const apiKey = import.meta.env.VITE_TMDB_API_KEY;

    const currentBackdrop = movie?.backdrop_path
      ? `${TMDB_IMAGE}${movie.backdrop_path}`
      : movie?.poster_path
        ? `${TMDB_IMAGE}${movie.poster_path}`
        : null;

    setBackgroundLoaded(false);
    setBackdrop(currentBackdrop);

    if (!apiKey) {
      console.error("VITE_TMDB_API_KEY is missing.");
      return () => {
        cancelled = true;
      };
    }

    const fetchRandomBackdrop = async () => {
      try {
        const pages = [1, 2, 3];
        const randomPage = pages[Math.floor(Math.random() * pages.length)];

        const response = await fetch(
          `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&page=${randomPage}`
        );

        if (!response.ok) {
          throw new Error("Unable to fetch trending TMDB titles");
        }

        const data = await response.json();

        if (cancelled) return;

        const backgrounds = (data?.results || [])
          .filter(
            (item) =>
              item.backdrop_path &&
              (item.media_type === "movie" || item.media_type === "tv")
          )
          .map((item) => ({
            url: `${TMDB_IMAGE}${item.backdrop_path}`,
            id: item.id,
          }));

        if (backgrounds.length === 0) {
          if (currentBackdrop) setBackdrop(currentBackdrop);
          return;
        }

        const differentBackgrounds = backgrounds.filter(
          (item) => item.url !== currentBackdrop
        );

        const available =
          differentBackgrounds.length > 0
            ? differentBackgrounds
            : backgrounds;

        const selected =
          available[Math.floor(Math.random() * available.length)];

        setBackdrop(selected.url);
      } catch (error) {
        if (!cancelled) {
          console.error("TMDB background fetch failed:", error);
          setBackdrop(currentBackdrop);
        }
      }
    };

    fetchRandomBackdrop();

    return () => {
      cancelled = true;
    };
  }, [id, mediaType, movie?.backdrop_path, movie?.poster_path]);

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <Navbar />

      <main className="relative isolate flex-1 overflow-hidden">
        {backdrop && (
          <div
            key={backdrop}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 -z-20 bg-cover bg-center transition-opacity duration-700 ${
              backgroundLoaded ? "opacity-45" : "opacity-0"
            }`}
            style={{ backgroundImage: `url("${backdrop}")` }}
          >
            <img
              src={backdrop}
              alt=""
              className="hidden"
              onLoad={() => setBackgroundLoaded(true)}
              onError={() => setBackgroundLoaded(false)}
            />
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/65 via-[#080808]/80 to-[#080808]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/45 via-transparent to-black/45"
        />

        <section className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-4 pb-5 pt-24 text-center sm:px-6 sm:pb-7 sm:pt-28 md:px-8 md:pb-9 md:pt-32 lg:px-12">
          {title && (
            <div className="mb-4 flex w-full flex-col items-center sm:mb-6 md:mb-7">
              <h1 className="max-w-5xl break-words text-balance text-2xl font-extrabold leading-tight tracking-tight drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                {title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-white/80 sm:mt-3 sm:gap-x-4 sm:text-sm md:text-base">
                {movie?.vote_average > 0 && (
                  <span className="font-bold text-green-400">
                    {Math.round(movie.vote_average * 10)}% {t.match}
                  </span>
                )}

                {year && <span>{year}</span>}

                <span className="rounded border border-white/40 px-2 py-0.5 text-[10px] font-semibold tracking-wider sm:text-xs">
                  HD
                </span>
              </div>

              {movie?.overview && (
                <p className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-white/85 sm:mt-4 sm:text-base md:text-lg">
                  {movie.overview}
                </p>
              )}
            </div>
          )}

          <div className="relative w-full overflow-hidden rounded-lg border border-white/15 bg-black shadow-[0_10px_40px_rgba(0,0,0,0.65),0_0_25px_rgba(229,9,20,0.12)]">
            <div className="relative aspect-video w-full">
              {status === "ready" && (
                <iframe
                  title={title || "Trailer"}
                  src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              )}

              {status === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-4">
                  <Loader2 className="h-7 w-7 animate-spin text-red-600 sm:h-9 sm:w-9" />
                  <span className="text-sm text-white/75 sm:text-base">
                    {t.loading}
                  </span>
                </div>
              )}

              {(status === "empty" || status === "error") && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/75 px-5">
                  <p className="max-w-md text-sm leading-relaxed text-white/75 sm:text-base md:text-lg">
                    {status === "empty" ? t.notFound : t.error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {status === "ready" && (
            <a
              href={`https://www.youtube.com/watch?v=${videoKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/30 bg-black/40 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-red-600 hover:bg-red-600 hover:shadow-[0_0_22px_rgba(229,9,20,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-[0.98] sm:mt-5 sm:min-h-11 sm:px-6 sm:text-base md:mt-6"
            >
              <span>{t.watchOnYoutube}</span>
              <ExternalLink className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:h-[18px] sm:w-[18px]" />
            </a>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}