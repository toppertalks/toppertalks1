const AppError = require("../utils/AppError");
const { config } = require("../config/env");

const enforceHttps = (req, res, next) => {
	if (config.NODE_ENV === "production") {
		const forwardedProto = req.headers["x-forwarded-proto"];
		if (!req.secure && forwardedProto !== "https") {
			return next(new AppError("HTTPS required.", 403));
		}
	}
	next();
};

module.exports = { enforceHttps };
