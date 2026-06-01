require("dotenv").config();
const socket = require("./socket");
const express = require("express");
const { createServer } = require("http");
const app = express();
const server = createServer(app);

socket.initializeSocket(server);

const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const {
  applySecurityHeaders,
  blockUnsafePayloads,
  createRateLimiter,
} = require("./middlewares/security.middleware");

const userRoutes = require("./routes/user.routes");
const captainRoutes = require("./routes/captain.routes");
const mapsRoutes = require("./routes/maps.routes");
const rideRoutes = require("./routes/ride.routes");
const mailRoutes = require("./routes/mail.routes");
const keepServerRunning = require("./services/active.service");
const dbStream = require("./services/logging.service");
require("./config/db");
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");

if (process.env.ENVIRONMENT == "production") {
  app.use(
    morgan(":method :url :status :response-time ms - :res[content-length]", {
      stream: dbStream,
    })
  );
} else {
  app.use(morgan("dev"));
}
app.use(applySecurityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || process.env.ENVIRONMENT !== "production") {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(
  createRateLimiter({
    windowMs: 60 * 1000,
    max: 180,
    message: "Too many requests. Please slow down and try again.",
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));
app.use(blockUnsafePayloads);

app.use(
  ["/user/login", "/user/register", "/user/google-signin", "/captain/login", "/captain/register", "/captain/google-signin"],
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: "Too many authentication attempts. Please try again later.",
  })
);

if (process.env.ENVIRONMENT == "production") {
  keepServerRunning();
}

app.get("/", (req, res) => {
  res.json("Hello, World!");
});

app.get("/reload", (req, res) => {
  res.json("Server Reloaded");
});

app.use("/user", userRoutes);
app.use("/captain", captainRoutes);
app.use("/map", mapsRoutes);
app.use("/ride", rideRoutes);
app.use("/mail", mailRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

server.listen(PORT, () => {
  console.log("Server is listening on port", PORT);
});
