const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.Mongoose_Connect;

    if (!mongoURI) {
      throw new Error("Mongoose_Connect environment variable is missing.");
    }

    await mongoose.connect(mongoURI, {
      dbName: "NETFLIX-CLONE",
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });

    console.log("Database Connected Successfully");
  } catch (err) {
    console.error("Database Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;