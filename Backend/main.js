require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./Config/MongoDB");

const user = require("./Routes/UserRoute");
const errorMiddleware = require("./Middleware/Error");

const app = express();

app.set("trust proxy", 1);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
  });
});

connectDB();


const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", user);

// ---------- Error handler ----------
app.use(errorMiddleware);


// ---------- Start ----------
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("Server Started Successfully");
});
