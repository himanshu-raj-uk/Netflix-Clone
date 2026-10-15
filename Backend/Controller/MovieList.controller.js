const mongoose = require("mongoose");
const User = require("../Model/UserModel");
const Movie = require("../Model/MovieModel");

const allowedLists = ["wishlist", "watchlist", "likelist"];

const getAuthenticatedUserId = (req) =>
    req.user?._id || req.user?.id || req.userId;

const getMovieLists = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const user = await User.findById(userId)
            .select("wishlist watchlist likelist")
            .populate("wishlist")
            .populate("watchlist")
            .populate("likelist")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Movie lists fetched successfully.",
            data: {
                wishlist: user.wishlist || [],
                watchlist: user.watchlist || [],
                likelist: user.likelist || [],
            },
        });
    } catch (error) {
        console.error("Get movie lists error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch movie lists.",
        });
    }
};

const addMovieToList = async (req, res) => {
    try {
        const { listType, movieId } = req.params;

        if (!allowedLists.includes(listType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid list type.",
                allowedLists,
            });
        }

        const payload = req.body?.movie || req.body || {};
        const tmdbId = Number(payload.tmdbId ?? movieId);

        if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid TMDB movie ID is required.",
            });
        }

        const mediaType =
            payload.mediaType ||
            payload.media_type ||
            (payload.first_air_date ? "tv" : "movie");

        if (!["movie", "tv"].includes(mediaType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid media type.",
            });
        }

        const title = String(
            payload.title ||
            payload.name ||
            payload.originalTitle ||
            payload.original_title ||
            ""
        ).trim();

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Movie title is required.",
            });
        }

        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(200).json({
                success: true,
                guest: true,
                message: "Save this movie in browser storage.",
                data: {
                    listType,
                    tmdbId,
                    mediaType,
                    movie: {
                        ...payload,
                        id: tmdbId,
                        mediaType,
                        title,
                    },
                },
            });
        }

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Invalid authenticated user.",
            });
        }

        const userExists = await User.exists({ _id: userId });

        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const movieData = {
            tmdbId,
            title,
            originalTitle:
                payload.originalTitle ||
                payload.original_title ||
                payload.original_name ||
                "",
            overview: payload.overview || "",
            posterPath: payload.posterPath || payload.poster_path || "",
            backdropPath:
                payload.backdropPath || payload.backdrop_path || "",
            mediaType,
            releaseDate:
                payload.releaseDate ||
                payload.release_date ||
                payload.first_air_date ||
                "",
            voteAverage: Number(
                payload.voteAverage ?? payload.vote_average ?? 0
            ),
            genreIds: Array.isArray(payload.genreIds)
                ? payload.genreIds
                : Array.isArray(payload.genre_ids)
                    ? payload.genre_ids
                    : [],
            originalLanguage:
                payload.originalLanguage ||
                payload.original_language ||
                "",
        };

        if (
            !Number.isFinite(movieData.voteAverage) ||
            movieData.voteAverage < 0 ||
            movieData.voteAverage > 10
        ) {
            movieData.voteAverage = 0;
        }

        let movie = await Movie.findOne({ tmdbId });

        if (movie && movie.mediaType !== mediaType) {
            return res.status(409).json({
                success: false,
                message:
                    "This TMDB ID is already stored with a different media type.",
            });
        }

        if (!movie) {
            try {
                movie = await Movie.create(movieData);
            } catch (error) {
                if (error.code !== 11000) {
                    throw error;
                }

                movie = await Movie.findOne({ tmdbId });

                if (!movie) {
                    throw error;
                }

                if (movie.mediaType !== mediaType) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "This TMDB ID is already stored with a different media type.",
                    });
                }
            }
        }

        await User.findByIdAndUpdate(
            userId,
            {
                $addToSet: {
                    [listType]: movie._id,
                },
            },
            {
                runValidators: true,
            }
        );

        return res.status(200).json({
            success: true,
            guest: false,
            message:
                listType === "watchlist"
                    ? "Added to Watchlist successfully."
                    : listType === "likelist"
                        ? "Movie liked successfully."
                        : "Movie added to Wishlist successfully.",
            data: {
                listType,
                tmdbId,
                movieId: movie._id,
                movie,
            },
        });
    } catch (error) {
        console.error("Add movie to list error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add movie to list.",
        });
    }
};

const removeMovieFromList = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { listType, movieId } = req.params;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (!allowedLists.includes(listType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid list type.",
                allowedLists,
            });
        }

        if (!mongoose.isValidObjectId(movieId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid MongoDB movie ID.",
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    [listType]: new mongoose.Types.ObjectId(movieId),
                },
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("_id");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Movie removed from list successfully.",
            data: {
                listType,
                movieId,
            },
        });
    } catch (error) {
        console.error("Remove movie from list error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove movie from list.",
        });
    }
};

module.exports = {
    getMovieLists,
    addMovieToList,
    removeMovieFromList,
};