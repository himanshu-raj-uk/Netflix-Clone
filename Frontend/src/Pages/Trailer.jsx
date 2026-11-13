import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Loader2, ExternalLink, Star } from "lucide-react";
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

    const timer = setTimeout(() => {
      if (!cancelled) setBackdrop(currentBackdrop);
    }, 0);

    if (!apiKey) {
      return () => {
        cancelled = true;
        clearTimeout(timer);
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
    <div className="flex min-h-screen flex-col bg-[#080B14] text-white">
      <Navbar />

      <main className="relative isolate flex-1 overflow-hidden">
        {backdrop && (
          <div
            key={backdrop}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 -z-20 bg-cover bg-center transition-opacity duration-1000 ${
              backgroundLoaded ? "opacity-35" : "opacity-0"
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

        {/* Ambient Spotlights */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2)_0%,transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#080B14]/70 via-[#080B14]/85 to-[#080B14]"
        />

        <section className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-4 pb-8 pt-24 text-center sm:px-6 sm:pb-12 sm:pt-28 md:px-10 md:pt-32 lg:px-12">
          {title && (
            <div className="mb-6 flex w-full flex-col items-center sm:mb-8">
              <h1 className="max-w-5xl break-words text-balance text-2xl font-black leading-tight tracking-tight drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                {title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-300 sm:mt-4 sm:gap-x-4 sm:text-sm">
                {movie?.vote_average > 0 && (
                  <span className="flex items-center gap-1 font-bold text-[#22D3EE]">
                    <Star size={13} className="fill-[#22D3EE] text-[#22D3EE]" />
                    {Math.round(movie.vote_average * 10)}% {t.match}
                  </span>
                )}

                {year && <span>{year}</span>}

                <span className="rounded border border-[#8B5CF6]/50 bg-[#8B5CF6]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#22D3EE]">
                  4K HDR
                </span>
                <span className="rounded border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  5.1 Audio
                </span>
              </div>

              {movie?.overview && (
                <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-slate-300 sm:text-base md:text-lg">
                  {movie.overview}
                </p>
              )}
            </div>
          )}

          {/* Cinema Frame */}
          <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-[#111827] shadow-2xl">
            <div className="relative aspect-video w-full bg-[#080B14]">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#080B14]/80 px-4">
                  <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
                  <span className="text-sm font-semibold text-[#22D3EE]">
                    {t.loading}
                  </span>
                </div>
              )}

              {(status === "empty" || status === "error") && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#080B14]/80 px-5">
                  <p className="max-w-md text-sm leading-relaxed text-slate-300 sm:text-base md:text-lg">
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
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#8B5CF6] px-5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#7C3AED] active:scale-95 sm:h-11 sm:px-6 sm:text-sm"
            >
              <span>{t.watchOnYoutube}</span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
