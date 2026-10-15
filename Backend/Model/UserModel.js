const mongoose = require("mongoose");

const isLocalAccount = function () {
    return this.authProvider !== "google";
};

const movieList = [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
    },
];

const userModel = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: isLocalAccount,
            minlength: 6,
        },

        phone: {
            type: String,
            required: isLocalAccount,
            unique: true,
            sparse: true,
            trim: true,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        googleId: {
            type: String,
        },

        otp: {
            type: String,
        },

        otpExpire: {
            type: Date,
        },

        resetVerified: {
            type: Boolean,
            default: false,
        },

        refreshToken: {
            type: String,
            default: null,
        },

        profileImage: {
            url: {
                type: String,
                default: "",
            },
            public_id: {
                type: String,
                default: "",
            },
        },

        address: {
            fullName: { type: String, default: "" },
            houseNo: { type: String, default: "" },
            area: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            country: { type: String, default: "India" },
            pincode: { type: String, default: "" },
        },

        wishlist: movieList,

        watchlist: movieList,

        likelist: movieList,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userModel);