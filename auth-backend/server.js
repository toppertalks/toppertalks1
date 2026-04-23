const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const { connectDatabase } = require("./config/db");
const { config } = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const { authLimiter } = require("./middleware/rateLimiter");
const { enforceHttps } = require("./middleware/httpsEnforcer");

const app = express();

app.set("trust proxy", config.TRUST_PROXY);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use(
	helmet({
		contentSecurityPolicy: {
			useDefaults: true,
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", config.FRONTEND_URL],
				connectSrc: ["'self'", config.FRONTEND_URL],
				imgSrc: ["'self'", "data:"],
				styleSrc: ["'self'", config.FRONTEND_URL, "'unsafe-inline'"],
				frameAncestors: ["'none'"],
			},
		},
		frameguard: { action: "deny" },
		xContentTypeOptions: true,
		crossOriginEmbedderPolicy: false,
	}),
);

app.use(
	cors({
		origin: config.FRONTEND_URL,
		credentials: true,
	}),
);

app.use(enforceHttps);

// Apply rate limiting only to authentication endpoints to prevent brute force.
if (config.RATE_LIMITER_ENABLED) {
	app.use("/api/auth", authLimiter);
}

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use(errorHandler);

const startServer = async () => {
	await connectDatabase();
	app.listen(config.PORT, () => {
		console.log(`Auth service running on port ${config.PORT}`);
	});
};

module.exports = { app, startServer };

if (require.main === module) {
	startServer();
}
