require("dotenv").config();
const express = require("express");
const cors = require("cors");


const app = express();
app.use(express.json());

const connectDB = require("./Config/MongoDB");
app.set("trust proxy", 1);

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


// ROUTE
const user = require("./Routes/UserRoute");


app.use("/user", user);


app.use(Error);

const PORT = process.env.PORT || 8000;
connectDB();
app.listen(PORT, () => {
    console.log("Server Started Successfully");
});
