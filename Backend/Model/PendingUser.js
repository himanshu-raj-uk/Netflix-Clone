const mongoose = require("mongoose");

const pendingUserModel = new mongoose.Schema(
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
            required: true,
            minlength: 6,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        otp: {
            type: String,
            required: true,
        },

        otpExpire: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

pendingUserModel.index({ otpExpire: 1 }, { expireAfterSeconds: 60 * 60 });

module.exports = mongoose.model("PendingUser", pendingUserModel);