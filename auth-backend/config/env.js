const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const parseBoolean = (value) => String(value).toLowerCase() === "true";

const config = {
	PORT: process.env.AUTH_PORT || 5000,
	MONGO_URI: process.env.MONGO_URI,
	FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
	JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
	JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
	JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
	JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",
	COOKIE_NAME: process.env.COOKIE_NAME || "refreshToken",
	COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "",
	COOKIE_SECURE: parseBoolean(process.env.COOKIE_SECURE || "false"),
	COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || "lax",
	CSRF_COOKIE_NAME: process.env.CSRF_COOKIE_NAME || "csrfToken",
	CSRF_HEADER_NAME: process.env.CSRF_HEADER_NAME || "x-csrf-token",
	CSRF_ENFORCE: parseBoolean(process.env.CSRF_ENFORCE || "false"),
	ENFORCE_HTTPS: parseBoolean(process.env.ENFORCE_HTTPS || "true"),
	TRUST_PROXY: parseBoolean(process.env.TRUST_PROXY || "false"),
	RATE_LIMITER_ENABLED: parseBoolean(
		process.env.RATE_LIMITER_ENABLED || "true",
	),
	EMAIL_HOST: process.env.EMAIL_HOST,
	EMAIL_PORT: process.env.EMAIL_PORT,
	EMAIL_SECURE: parseBoolean(process.env.EMAIL_SECURE || "false"),
	EMAIL_USER: process.env.EMAIL_USER,
	EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
	EMAIL_FROM: process.env.EMAIL_FROM,
};

module.exports = { config };
