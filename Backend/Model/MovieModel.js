const mongoose = require("mongoose");

const movieModel = new mongoose.Schema(
    {
        tmdbId: {
            type: Number,
            required: true,
            unique: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        originalTitle: {
            type: String,
            trim: true,
            default: "",
        },

        overview: {
            type: String,
            default: "",
        },

        posterPath: {
            type: String,
            default: "",
        },

        backdropPath: {
            type: String,
            default: "",
        },

        mediaType: {
            type: String,
            enum: ["movie", "tv"],
            required: true,
        },

        releaseDate: {
            type: String,
            default: "",
        },

        voteAverage: {
            type: Number,
            default: 0,
            min: 0,
            max: 10,
        },

        genreIds: {
            type: [Number],
            default: [],
        },

        originalLanguage: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Movie", movieModel);