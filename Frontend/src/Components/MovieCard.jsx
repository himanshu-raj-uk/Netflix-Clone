import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Plus,
  Check,
  ThumbsUp,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";
import { useLanguage } from "../Context/LanguageContext";
import { translations } from "../Data/Translations";
import { addMovieToList } from "../Redux/AuthAPI";

/* Responsive sizes: everything scales smoothly with the screen width */
const BTN_SIZE =
  "h-[clamp(1.6rem,1.1rem+1.5vw,2.4rem)] w-[clamp(1.6rem,1.1rem+1.5vw,2.4rem)]";

const ICON =
  "h-[clamp(0.75rem,0.55rem+0.6vw,1.1rem)] w-[clamp(0.75rem,0.55rem+0.6vw,1.1rem)]";

const ACTION_BTN = `flex ${BTN_SIZE} shrink-0 items-center justify-center rounded-full border border-white/35 bg-black/50 text-white shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-red-400 hover:bg-red-600 hover:shadow-[0_0_12px_rgba(239,68,68,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500`;

const TITLE_TEXT = "text-[clamp(0.7rem,0.55rem+0.5vw,0.95rem)]";
const META_TEXT = "text-[clamp(0.6rem,0.5rem+0.3vw,0.78rem)]";
const MESSAGE_TEXT = "text-[clamp(0.65rem,0.5rem+0.4vw,0.85rem)]";

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
  const { language } = useLanguage();
  const t = (translations[language] || translations.en).movieCard;

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

  const goToTrailer = () => {
    navigate(`/watch/${mediaType}/${movie.id}`, {
      state: { movie, mediaType },
    });
  };

  const saveMovieToList = async (listType) => {
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
              ? "Removed from your Liked titles."
              : "Added to your Liked titles."
            : alreadySaved
              ? "Removed from My List."
              : "Added to My List successfully."
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
          ? "Added to your Liked titles."
          : "Added to My List successfully."
      );

      window.dispatchEvent(new Event("lists-changed"));
    } catch (error) {
      showCardMessage(
        error?.response?.data?.message ||
        "Couldn't save this title. Please try again."
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

  // Icons + text appear only on hover (or keyboard focus, or after a tap on touch screens)
  const revealClass = detailsVisible
    ? "opacity-100"
    : "pointer-events-none opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100";

  return (
    <article
      className="group relative aspect-[2/3] min-w-0 overflow-hidden rounded-lg border border-transparent bg-[#111] transition-[border-color,box-shadow,transform] duration-300 ease-out hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.45),0_0_26px_rgba(239,68,68,0.2)] focus-within:border-red-500 focus-within:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
      onMouseEnter={() => setDetailsVisible(true)}
      onMouseLeave={() => setDetailsVisible(false)}
      onTouchStart={() => setDetailsVisible(true)}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-white/[0.07]" />
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.04] ${loaded ? "opacity-100" : "opacity-0"
            }`}
        />
      )}

      {!imageUrl && (
        <div
          className={`flex h-full items-center justify-center p-3 text-center text-gray-400 ${TITLE_TEXT}`}
        >
          {title}
        </div>
      )}

      {/* dark gradient only while hovering, so the poster stays clean otherwise */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent transition-opacity duration-300 ${detailsVisible ? "opacity-100" : "opacity-0 group-focus-within:opacity-100"
          }`}
      />

      <div className="absolute inset-x-0 bottom-0 p-[clamp(0.4rem,0.2rem+0.8vw,0.8rem)]">
        <div
          className={`mb-[clamp(0.3rem,0.2rem+0.4vw,0.55rem)] flex flex-wrap items-center gap-[clamp(0.25rem,0.15rem+0.4vw,0.45rem)] transition-opacity duration-300 ${revealClass}`}
        >
          <button
            type="button"
            onClick={goToTrailer}
            aria-label={`Play ${title}`}
            className={`flex ${BTN_SIZE} shrink-0 items-center justify-center rounded-full border border-white/70 bg-white text-black shadow-md transition-all duration-300 hover:border-red-400 hover:bg-red-600 hover:text-white`}
          >
            <Play className={`${ICON} fill-current`} />
          </button>

          <button
            type="button"
            onClick={() => saveMovieToList("watchlist")}
            disabled={savingList !== ""}
            aria-label="Add to My List"
            title="Add to My List"
            className={`${ACTION_BTN} ${savedLists.watchlist
                ? "border-red-400 bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                : ""
              }`}
          >
            {savingList === "watchlist" ? (
              <LoaderCircle className={`${ICON} animate-spin`} />
            ) : savedLists.watchlist ? (
              <Check className={ICON} />
            ) : (
              <Plus className={ICON} />
            )}
          </button>

          <button
            type="button"
            onClick={() => saveMovieToList("likelist")}
            disabled={savingList !== ""}
            aria-label="Like title"
            title="Like title"
            className={`${ACTION_BTN} ${savedLists.likelist
                ? "border-red-400 bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                : ""
              }`}
          >
            {savingList === "likelist" ? (
              <LoaderCircle className={`${ICON} animate-spin`} />
            ) : (
              <ThumbsUp
                className={`${ICON} ${savedLists.likelist ? "fill-current" : ""
                  }`}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setDetailsVisible((previous) => !previous)}
            aria-label="Show movie details"
            className={`${ACTION_BTN} ml-auto`}
          >
            <ChevronDown
              className={`${ICON} transition-transform duration-300 ${detailsVisible ? "rotate-180" : ""
                }`}
            />
          </button>
        </div>

        {cardMessage && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-2 rounded-lg border border-red-500/50 bg-black/90 px-2 py-1.5 text-center font-medium leading-snug text-white shadow-[0_0_16px_rgba(239,68,68,0.15)] backdrop-blur-md sm:px-3 sm:py-2 ${MESSAGE_TEXT}`}
          >
            {cardMessage}
          </div>
        )}

        {/* title, year and overview: visible only on hover */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${detailsVisible
              ? "max-h-40 opacity-100"
              : "max-h-0 opacity-0 group-focus-within:max-h-40 group-focus-within:opacity-100"
            }`}
        >
          <h3 className={`truncate font-semibold text-white ${TITLE_TEXT}`}>
            {title}
          </h3>

          <div
            className={`mt-0.5 flex items-center gap-1.5 text-gray-300 sm:gap-2 ${META_TEXT}`}
          >
            {year && <span>{year}</span>}
            {year && <span>·</span>}
            <span>{mediaType === "tv" ? "Series" : "Movie"}</span>
          </div>

          {movie?.overview && (
            <p
              className={`mt-1 line-clamp-2 leading-relaxed text-gray-300 sm:line-clamp-3 ${META_TEXT}`}
            >
              {movie.overview}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}