import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Plus,
  Check,
  ThumbsUp,
  ChevronDown,
  LoaderCircle,
  Star,
} from "lucide-react";
import { addMovieToList } from "../Redux/AuthAPI";

const ACTION_BTN =
  "flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#111827]/90 text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] active:scale-95";

const GUEST_KEYS = {
  watchlist: "guest_watchlist",
  likelist: "guest_likelist",
};

const getMovieKey = (movie) =>
  `${movie?.mediaType || movie?.media_type || "movie"}-${movie?.tmdbId || movie?.id}`;

const readGuestList = (listType) => {
  try {
    const value = JSON.parse(
      localStorage.getItem(GUEST_KEYS[listType]) || "[]"
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeGuestList = (listType, movies) => {
  localStorage.setItem(GUEST_KEYS[listType], JSON.stringify(movies));
};

const getSavedMovieData = (movie, mediaType) => ({
  ...movie,
  tmdbId: Number(movie.tmdbId || movie.id),
  mediaType,
  title: movie.title || movie.name || "Untitled",
  originalTitle: movie.original_title || movie.original_name || "",
  overview: movie.overview || "",
  posterPath: movie.poster_path || movie.posterPath || "",
  backdropPath: movie.backdrop_path || movie.backdropPath || "",
  releaseDate: movie.release_date || movie.first_air_date || "",
  voteAverage: Number(movie.vote_average || movie.voteAverage || 0),
  genreIds: movie.genre_ids || movie.genreIds || [],
  originalLanguage: movie.original_language || movie.originalLanguage || "",
});

export default function MovieCard({ movie }) {
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [cardMessage, setCardMessage] = useState("");
  const [savingList, setSavingList] = useState("");
  const [savedLists, setSavedLists] = useState({
    watchlist: false,
    likelist: false,
  });

  const messageTimeout = useRef(null);

  const mediaType =
    movie?.media_type ||
    movie?.mediaType ||
    (movie?.first_air_date || movie?.name ? "tv" : "movie");

  const movieKey = getMovieKey({ ...movie, mediaType });
  const title = movie?.title || movie?.name || "Untitled";
  const posterPath = movie?.poster_path || movie?.posterPath;
  const year = String(
    movie?.release_date || movie?.first_air_date || ""
  ).slice(0, 4);

  const showCardMessage = useCallback((message) => {
    setCardMessage(message);

    if (messageTimeout.current) {
      clearTimeout(messageTimeout.current);
    }

    messageTimeout.current = setTimeout(() => {
      setCardMessage("");
      messageTimeout.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    const syncLists = () => {
      setSavedLists({
        watchlist: readGuestList("watchlist").some(
          (item) => getMovieKey(item) === movieKey
        ),
        likelist: readGuestList("likelist").some(
          (item) => getMovieKey(item) === movieKey
        ),
      });
    };

    syncLists();

    window.addEventListener("lists-changed", syncLists);
    window.addEventListener("storage", syncLists);

    return () => {
      window.removeEventListener("lists-changed", syncLists);
      window.removeEventListener("storage", syncLists);
    };
  }, [movieKey]);

  useEffect(
    () => () => {
      if (messageTimeout.current) {
        clearTimeout(messageTimeout.current);
      }
    },
    []
  );

  const goToTrailer = (e) => {
    e?.stopPropagation?.();
    navigate(`/watch/${mediaType}/${movie.id}`, {
      state: { movie, mediaType },
    });
  };

  const toggleDetails = (e) => {
    e?.stopPropagation?.();
    setDetailsVisible((prev) => !prev);
  };

  const saveMovieToList = async (listType, e) => {
    e?.stopPropagation?.();
    if (savingList || !movie?.id) return;
    if (!["watchlist", "likelist"].includes(listType)) return;

    const token = localStorage.getItem("userToken");
    const movieData = getSavedMovieData(movie, mediaType);

    setSavingList(listType);

    try {
      if (!token) {
        const currentList = readGuestList(listType);
        const alreadySaved = currentList.some(
          (item) => getMovieKey(item) === movieKey
        );

        const updatedList = alreadySaved
          ? currentList.filter((item) => getMovieKey(item) !== movieKey)
          : [...currentList, movieData];

        writeGuestList(listType, updatedList);

        setSavedLists((previous) => ({
          ...previous,
          [listType]: !alreadySaved,
        }));

        window.dispatchEvent(new Event("lists-changed"));

        showCardMessage(
          listType === "likelist"
            ? alreadySaved
              ? "Removed from Liked titles."
              : "Added to Liked titles."
            : alreadySaved
              ? "Removed from My List."
              : "Added to My List."
        );
        return;
      }

      await addMovieToList(listType, movie.id, movieData);

      setSavedLists((previous) => ({
        ...previous,
        [listType]: true,
      }));

      showCardMessage(
        listType === "likelist"
          ? "Added to Liked titles."
          : "Added to My List."
      );

      window.dispatchEvent(new Event("lists-changed"));
    } catch (error) {
      showCardMessage(
        error?.response?.data?.message ||
        "Couldn't save title. Try again."
      );
    } finally {
      setSavingList("");
    }
  };

  const imageUrl = posterPath
    ? posterPath.startsWith("http")
      ? posterPath
      : `https://image.tmdb.org/t/p/w500${posterPath}`
    : "";

  return (
    <article
      className="group relative aspect-[2/3] min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0B1020] shadow-[0_12px_28px_rgba(0,0,0,0.65)] transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.04] hover:border-[#8B5CF6] hover:shadow-[0_20px_45px_-10px_rgba(139,92,246,0.5),0_10px_25px_-5px_rgba(34,211,238,0.3)] focus-within:border-[#8B5CF6] will-change-transform"
    >
      {/* Skeleton loader shimmer */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-[#151d30]" />
      )}

      {/* Poster Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* 3D Glass Light Sweep Effect */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      {!imageUrl && (
        <div className="flex h-full items-center justify-center p-3 text-center text-xs text-slate-400">
          {title}
        </div>
      )}

      {/* Rating badge on top right */}
      {movie?.vote_average > 0 && (
        <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1 rounded bg-[#080B14]/90 px-1.5 py-0.5 text-[9px] font-semibold text-[#22D3EE] backdrop-blur-sm sm:text-[10px]">
          <Star size={9} className="fill-[#22D3EE] text-[#22D3EE]" />
          <span>{movie.vote_average.toFixed(1)}</span>
        </div>
      )}

      {/* Bright ambient background gradient overlay */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          detailsVisible
            ? "bg-gradient-to-t from-[#1e1b4b] via-[#111827]/90 to-transparent opacity-95"
            : "bg-gradient-to-t from-[#1e1b4b]/80 via-transparent to-transparent opacity-70"
        }`}
      />

      {/* Ambient bright violet-cyan glow in card background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 inset-x-0 h-36 bg-[radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.35)_0%,rgba(34,211,238,0.18)_40%,transparent_75%)]"
      />

      {/* Card Content & Action Bar */}
      <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2.5">
        {/* Button Row */}
        <div className="mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
          {/* Simple Play Button */}
          <button
            type="button"
            onClick={goToTrailer}
            aria-label={`Play ${title}`}
            className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] text-white transition-colors duration-200 hover:bg-[#7C3AED] active:scale-95"
          >
            <Play size={11} fill="currentColor" className="ml-0.5 sm:scale-110" />
          </button>

          {/* Add to Watchlist */}
          <button
            type="button"
            onClick={(e) => saveMovieToList("watchlist", e)}
            disabled={savingList !== ""}
            aria-label="Add to My List"
            title="Add to My List"
            className={`${ACTION_BTN} ${
              savedLists.watchlist
                ? "border-[#22D3EE] bg-[#22D3EE]/20 text-[#22D3EE]"
                : ""
            }`}
          >
            {savingList === "watchlist" ? (
              <LoaderCircle size={11} className="animate-spin sm:scale-110" />
            ) : savedLists.watchlist ? (
              <Check size={11} strokeWidth={2.5} className="sm:scale-110" />
            ) : (
              <Plus size={11} className="sm:scale-110" />
            )}
          </button>

          {/* Like Title */}
          <button
            type="button"
            onClick={(e) => saveMovieToList("likelist", e)}
            disabled={savingList !== ""}
            aria-label="Like title"
            title="Like title"
            className={`${ACTION_BTN} ${
              savedLists.likelist
                ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#8B5CF6]"
                : ""
            }`}
          >
            {savingList === "likelist" ? (
              <LoaderCircle size={11} className="animate-spin sm:scale-110" />
            ) : (
              <ThumbsUp
                size={11}
                className={`sm:scale-110 ${savedLists.likelist ? "fill-current text-[#8B5CF6]" : ""}`}
              />
            )}
          </button>

          {/* Toggle Button: anchor down or up to hide or show movie data */}
          <button
            type="button"
            onClick={toggleDetails}
            aria-label={detailsVisible ? "Hide movie data" : "Show movie data"}
            title={detailsVisible ? "Hide data" : "Show data"}
            className={`${ACTION_BTN} ${
              detailsVisible ? "border-[#22D3EE] text-[#22D3EE]" : "text-slate-300"
            }`}
          >
            <ChevronDown
              size={13}
              className={`transition-transform duration-300 sm:scale-110 ${
                detailsVisible ? "rotate-180 text-[#22D3EE]" : "rotate-0 text-slate-300"
              }`}
            />
          </button>
        </div>

        {/* Action feedback message */}
        {cardMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-1 rounded border border-[#8B5CF6]/40 bg-[#111827] px-2 py-1 text-center text-[10px] sm:text-xs font-medium text-[#22D3EE]"
          >
            {cardMessage}
          </div>
        )}

        {/* Title & Metadata: shown or hidden via the toggle button */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            detailsVisible
              ? "max-h-48 opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <h3 className="truncate text-xs font-bold text-white sm:text-sm">
            {title}
          </h3>

          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-300 sm:text-xs">
            {year && <span>{year}</span>}
            {year && <span className="text-white/30">•</span>}
            <span className="uppercase text-[#22D3EE] font-semibold">
              {mediaType === "tv" ? "Series" : "Movie"}
            </span>
          </div>

          {movie?.overview && (
            <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-300 sm:text-xs sm:leading-relaxed">
              {movie.overview}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
