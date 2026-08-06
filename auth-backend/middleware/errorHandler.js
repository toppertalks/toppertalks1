const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
	const statusCode = err.statusCode || 500;
	const message = err.isOperational ? err.message : "Internal Server Error";
	const details = err.details || null;

	logger.error("Auth service error", {
		statusCode,
		message,
		path: req.path,
		method: req.method,
		ip: req.ip,
		...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
	});

	res.status(statusCode).json({
		success: false,
		error: {
			message,
			details,
		},
	});
};

module.exports = { errorHandler };
