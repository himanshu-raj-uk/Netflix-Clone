require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./Config/MongoDB");
const user = require("./Routes/UserRoute");

const app = express();
app.set("trust proxy", 1);

// ---------- CORS (single setup) ----------
const allowedOrigins = [
    "https://himanshu-raj-uk.github.io",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    process.env.CLIENT_URL, 
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // allow tools like Postman (no origin), listed websites, or local dev ports
        if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// ---------- Body parsers ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Routes ----------
app.get("/", (req, res) => {
    res.send("Netflix Clone API is running");
});

// Health check endpoint for UptimeRobot / monitoring
app.get("/health-check", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/user", user);

// ---------- 404 handler ----------
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// ---------- Error handler (must be last) ----------
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    console.error(`[Error ${statusCode}]:`, err.message);
    res.status(statusCode).json({
        status: false,
        message: err.message || "Server error",
    });
});

// ---------- Start ----------
const PORT = process.env.PORT || 8000;
connectDB();

app.listen(PORT, () => {
    console.log("Server Started Successfully");
});