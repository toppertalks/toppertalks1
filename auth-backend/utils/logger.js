const { createLogger, transports, format } = require("winston");

const sensitiveKeys = new Set([
	"password",
	"refreshToken",
	"csrfToken",
	"authorization",
	"set-cookie",
	"cookie",
]);

const redact = (value) => {
	if (Array.isArray(value)) {
		return value.map(redact);
	}
	if (value && typeof value === "object") {
		return Object.entries(value).reduce((acc, [key, nestedValue]) => {
			const normalizedKey = key.toLowerCase();
			if (sensitiveKeys.has(normalizedKey)) {
				acc[key] = "[REDACTED]";
			} else {
				acc[key] = redact(nestedValue);
			}
			return acc;
		}, {});
	}
	return value;
};

const sanitize = format((info) => {
	const sanitized = redact({ ...info });
	return Object.assign(info, sanitized);
});

const logger = createLogger({
	level: process.env.NODE_ENV === "production" ? "info" : "debug",
	format: format.combine(
		sanitize(),
		format.timestamp(),
		format.errors({ stack: true }),
		format.splat(),
		format.json(),
	),
	transports: [
		new transports.Console({
			format: format.combine(format.colorize(), format.simple()),
		}),
	],
});

module.exports = logger;
