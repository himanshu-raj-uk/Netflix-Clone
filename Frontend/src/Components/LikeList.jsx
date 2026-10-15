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
    fetchLikedMovies();
    fetchRandomBackground();
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
    <main className="min-h-screen overflow-hidden bg-[#080808] text-white">
      <Navbar />

      <section className="relative min-h-[420px] overflow-hidden sm:min-h-[470px] lg:min-h-[520px]">
        {background && (
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center opacity-70 transition-opacity duration-700"
            style={{ backgroundImage: `url("${background}")` }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/75 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/20 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[420px] max-w-[1600px] flex-col justify-end px-5 pb-12 pt-28 sm:min-h-[470px] sm:px-8 sm:pb-14 lg:min-h-[520px] lg:px-14 lg:pb-16">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-red-500">
            <Heart size={18} />
            Your favorites
          </div>

          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Movies You
            <span className="block text-red-600">Love.</span>
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-6 text-gray-300 sm:text-base sm:leading-7">
            All the movies and shows you have liked, together in one place.
            Revisit your favorites whenever you want.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm text-gray-200 backdrop-blur-md">
              <ThumbsUp size={16} className="text-red-500" />
              {movies.length} liked titles
            </div>

            <button
              type="button"
              onClick={fetchRandomBackground}
              disabled={backgroundLoading}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={backgroundLoading ? "animate-spin" : ""}
              />
              New backdrop
            </button>
          </div>

          {backgroundError && (
            <p className="mt-3 text-xs text-gray-400">
              The backdrop could not be loaded. Your liked movies are
              unaffected.
            </p>
          )}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1600px] px-5 pb-20 sm:px-8 lg:px-14">
        <div className="mb-7 flex flex-col justify-between gap-5 border-b border-white/10 pb-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Liked Movies
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {movies.length} {movies.length === 1 ? "title" : "titles"} in
              your collection
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search liked movies"
              aria-label="Search liked movies"
              className="w-full rounded-full border border-white/10 bg-white/[0.05] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-red-600/70 focus:bg-white/[0.08]"
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
              className="shrink-0 font-semibold underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-white/[0.07]" />
                <div className="mt-3 h-4 w-3/4 rounded bg-white/[0.07]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.05]" />
              </div>
            ))}
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredMovies.map((movie) => {
              const id = getMovieId(movie);
              const title = getMovieTitle(movie);
              const poster = getPoster(movie);
              const mediaType = getMediaType(movie);
              const isRemoving = String(removingId) === String(id);
              const playbackId = movie.tmdbId || movie.tmdb_id || id;

              return (
                <article key={id} className="group min-w-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/[0.08] bg-[#171717] shadow-lg shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-black/50">
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
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-gray-500">
                        <Clapperboard size={32} />
                        <span className="text-sm">{title}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

                    <div className="absolute inset-x-0 bottom-0 flex translate-y-2 flex-col gap-3 p-3 opacity-100 transition-all duration-300 sm:translate-y-3 sm:p-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/watch/${mediaType}/${playbackId}`}
                          aria-label={`Play ${title}`}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 hover:bg-red-600 hover:text-white"
                        >
                          <Play size={18} fill="currentColor" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleRemove(movie)}
                          disabled={isRemoving || !id}
                          aria-label={`Remove ${title} from liked movies`}
                          title="Remove from liked movies"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white transition hover:border-red-500 hover:bg-red-600 disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <LoaderCircle size={17} className="animate-spin" />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>
                      </div>

                      <Link
                        to={`/watch/${mediaType}/${playbackId}`}
                        className="text-xs font-semibold text-white hover:text-red-400 sm:text-sm"
                      >
                        View details
                      </Link>
                    </div>

                    {Number(movie?.vote_average || movie?.rating) > 0 && (
                      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
                        <span className="text-yellow-400">★</span>
                        {getRating(movie)}
                      </div>
                    )}

                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                      <Heart size={11} fill="currentColor" />
                      Liked
                    </div>
                  </div>

                  <div className="px-0.5 pt-3">
                    <h3 className="truncate text-sm font-semibold text-gray-100 transition-colors group-hover:text-white sm:text-base">
                      {title}
                    </h3>

                    <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
                      {getYear(movie) && <span>{getYear(movie)}</span>}
                      {getYear(movie) && <span>·</span>}
                      <span className="uppercase">
                        {mediaType === "tv" ? "Series" : "Movie"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-12 text-center sm:min-h-[360px]">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-500">
              <Heart size={27} />
            </div>

            <h3 className="text-xl font-bold sm:text-2xl">
              {search ? "No matching movies" : "No liked movies yet"}
            </h3>

            <p className="mt-3 max-w-md text-sm leading-6 text-gray-400">
              {search
                ? "Try another title or clear your search to see your liked movies."
                : "When you like a movie or show, it will appear here for easy access."}
            </p>

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-6 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10"
              >
                Clear search
              </button>
            ) : (
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-700"
              >
                <Play size={16} fill="currentColor" />
                Explore movies
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}