import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clapperboard,
  CircleAlert,
  Heart,
  LoaderCircle,
  Play,
  RefreshCw,
  Search,
  ThumbsUp,
  Trash2,
  Sparkles,
} from "lucide-react";
import axiosInstance from "../Redux/axiosInstance";
import Navbar from "../Components/Navbar";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_IMAGE = "https://image.tmdb.org/t/p/";
const TMDB_API = "https://api.themoviedb.org/3";

const LISTS_ENDPOINT = "/movie/lists";
const getRemoveEndpoint = (movieId) =>
  `/movie/list/likelist/${movieId}`;

const getMovieId = (movie) => movie?._id || movie?.id;

const getMovieTitle = (movie) =>
  movie?.title || movie?.name || movie?.original_title || "Untitled";

const getPoster = (movie) => {
  const poster = movie?.poster_path || movie?.posterPath;

  if (poster) {
    return poster.startsWith("http")
      ? poster
      : `${TMDB_IMAGE}w500${poster}`;
  }

  if (movie?.poster?.url) return movie.poster.url;
  if (typeof movie?.poster === "string") return movie.poster;

  return "";
};

const getBackdrop = (movie) => {
  const backdrop = movie?.backdrop_path || movie?.backdropPath;

  if (backdrop) {
    return backdrop.startsWith("http")
      ? backdrop
      : `${TMDB_IMAGE}original${backdrop}`;
  }

  return getPoster(movie);
};

const getMediaType = (movie) =>
  movie?.media_type ||
  movie?.mediaType ||
  (movie?.first_air_date || movie?.name ? "tv" : "movie");

const getYear = (movie) => {
  const date = movie?.release_date || movie?.first_air_date;
  return date ? date.slice(0, 4) : "";
};

const getRating = (movie) =>
  Number(movie?.vote_average || movie?.rating || 0).toFixed(1);

export default function LikeList() {
  const [movies, setMovies] = useState([]);
  const [background, setBackground] = useState("");
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [backgroundError, setBackgroundError] = useState(false);

  const fetchLikedMovies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get(LISTS_ENDPOINT);
      const data = response?.data?.data || response?.data;

      setMovies(Array.isArray(data?.likelist) ? data.likelist : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your liked movies. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRandomBackground = useCallback(async () => {
    setBackgroundLoading(true);
    setBackgroundError(false);

    try {
      const endpoints = [
        `${TMDB_API}/trending/movie/week`,
        `${TMDB_API}/trending/tv/week`,
      ];

      const responses = await Promise.all(
        endpoints.map(async (url) => {
          const response = await fetch(
            `${url}?api_key=${TMDB_API_KEY}&language=en-US`,
          );

          if (!response.ok) {
            throw new Error("Unable to fetch TMDB posters.");
          }

          return response.json();
        }),
      );

      const results = responses
        .flatMap((response) => response.results || [])
        .filter((movie) => movie.backdrop_path || movie.poster_path);

      if (!results.length) {
        throw new Error("No backdrop images available.");
      }

      const randomMovie = results[Math.floor(Math.random() * results.length)];

      setBackground(getBackdrop(randomMovie));
    } catch {
      setBackgroundError(true);
    } finally {
      setBackgroundLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLikedMovies();
      fetchRandomBackground();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLikedMovies, fetchRandomBackground]);

  const handleRemove = async (movie) => {
    const movieId = getMovieId(movie);

    if (!movieId || removingId) return;

    setRemovingId(movieId);
    setError("");

    try {
      await axiosInstance.delete(getRemoveEndpoint(movieId));

      setMovies((previous) =>
        previous.filter(
          (item) => String(getMovieId(item)) !== String(movieId),
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to remove this movie from your liked list.",
      );
    } finally {
      setRemovingId("");
    }
  };

  const filteredMovies = movies.filter((movie) =>
    getMovieTitle(movie).toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#080B14] text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative min-h-[440px] overflow-hidden sm:min-h-[480px] lg:min-h-[520px]">
        {background && (
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center opacity-40 blur-xs transition-opacity duration-1000"
            style={{ backgroundImage: `url("${background}")` }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#080B14] via-[#080B14]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080B14] via-[#080B14]/40 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.2)_0%,transparent_60%)]" />

        <div className="relative z-10 mx-auto flex min-h-[440px] max-w-[1600px] flex-col justify-end px-5 pb-12 pt-28 sm:min-h-[480px] sm:px-8 sm:pb-14 lg:min-h-[520px] lg:px-14 lg:pb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#111827]/70 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.25em] text-[#22D3EE] backdrop-blur-md">
            <Heart size={14} className="text-[#8B5CF6]" fill="currentColor" />
            Your favorites
          </div>

          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Movies You
            <span className="block text-[#22D3EE]">
              Love.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            All the movies and shows you have liked, collected in one place.
            Revisit your favorites whenever you want.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/80 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md">
              <ThumbsUp size={14} className="text-[#8B5CF6]" />
              {movies.length} liked titles
            </div>

            <button
              type="button"
              onClick={fetchRandomBackground}
              disabled={backgroundLoading}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/60 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md transition-colors hover:border-[#8B5CF6]/50 hover:text-white disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={backgroundLoading ? "animate-spin text-[#22D3EE]" : ""}
              />
              New backdrop
            </button>
          </div>

          {backgroundError && (
            <p className="mt-3 text-xs text-slate-500">
              The backdrop could not be loaded. Your liked movies are unaffected.
            </p>
          )}
        </div>
      </section>

      {/* Grid Content */}
      <section className="relative z-10 mx-auto max-w-[1600px] px-5 pb-20 sm:px-8 lg:px-14">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Liked Movies
            </h2>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              {movies.length} {movies.length === 1 ? "title" : "titles"} in your collection
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search liked titles..."
              aria-label="Search liked titles"
              className="w-full rounded-xl border border-white/10 bg-[#111827]/80 py-2.5 pl-11 pr-4 text-xs font-medium text-white outline-none transition-all placeholder:text-slate-500 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 sm:text-sm"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200"
          >
            <CircleAlert size={20} className="shrink-0 text-red-400" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={fetchLikedMovies}
              className="shrink-0 font-bold text-[#22D3EE] underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl border border-white/[0.04] bg-[#111827]" />
                <div className="mt-3 h-4 w-3/4 rounded bg-[#111827]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-[#111827]" />
              </div>
            ))}
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredMovies.map((movie) => {
              const id = getMovieId(movie);
              const title = getMovieTitle(movie);
              const poster = getPoster(movie);
              const mediaType = getMediaType(movie);
              const isRemoving = String(removingId) === String(id);
              const playbackId = movie.tmdbId || movie.tmdb_id || id;

              return (
                <article key={id} className="group min-w-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#111827] shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition duration-300 hover:-translate-y-1 hover:border-[#8B5CF6] hover:shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(139,92,246,0.3)]">
                    {poster ? (
                      <img
                        src={poster}
                        alt={`${title} poster`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-slate-500">
                        <Clapperboard size={32} />
                        <span className="text-xs">{title}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#080B14] via-[#080B14]/40 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

                    <div className="absolute inset-x-0 bottom-0 flex translate-y-2 flex-col gap-2.5 p-3.5 opacity-100 transition-all duration-300 sm:translate-y-3 sm:p-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/watch/${mediaType}/${playbackId}`}
                          aria-label={`Play ${title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B5CF6] text-white transition hover:bg-[#7C3AED]"
                        >
                          <Play size={14} fill="currentColor" className="ml-0.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleRemove(movie)}
                          disabled={isRemoving || !id}
                          aria-label={`Remove ${title} from liked movies`}
                          title="Remove from liked movies"
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#111827]/80 text-white transition hover:border-red-500 hover:bg-red-600 disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <LoaderCircle size={15} className="animate-spin text-red-400" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>

                      <Link
                        to={`/watch/${mediaType}/${playbackId}`}
                        className="text-xs font-bold text-white hover:text-[#22D3EE]"
                      >
                        View details
                      </Link>
                    </div>

                    {Number(movie?.vote_average || movie?.rating) > 0 && (
                      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-white/10 bg-[#080B14]/80 px-1.5 py-0.5 text-[10px] font-bold text-[#22D3EE] backdrop-blur-md">
                        <span>★</span>
                        {getRating(movie)}
                      </div>
                    )}

                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md border border-[#8B5CF6]/40 bg-[#8B5CF6]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#22D3EE] backdrop-blur-md">
                      <Heart size={10} fill="currentColor" />
                      Liked
                    </div>
                  </div>

                  <div className="px-0.5 pt-2.5">
                    <h3 className="truncate text-xs font-bold text-slate-100 transition-colors group-hover:text-white sm:text-sm">
                      {title}
                    </h3>

                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                      {getYear(movie) && <span>{getYear(movie)}</span>}
                      {getYear(movie) && <span>·</span>}
                      <span className="uppercase text-[#22D3EE] font-medium">
                        {mediaType === "tv" ? "Series" : "Movie"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#111827]/30 px-5 py-14 text-center sm:min-h-[380px]">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 text-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.25)]">
              <Heart size={26} fill="currentColor" />
            </div>

            <h3 className="text-xl font-bold sm:text-2xl text-white">
              {search ? "No matching movies" : "No liked movies yet"}
            </h3>

            <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-slate-400">
              {search
                ? "Try another keyword or clear your search to see your liked movies."
                : "When you like a movie or show, it will appear here for quick and easy access."}
            </p>

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-6 rounded-xl border border-white/10 bg-[#111827] px-5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-[#8B5CF6]/50 hover:text-white"
              >
                Clear search
              </button>
            ) : (
              <Link
                to="/"
                className="mt-5 inline-flex items-center justify-center rounded-md bg-[#8B5CF6] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#7C3AED]"
              >
                Explore movies
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
