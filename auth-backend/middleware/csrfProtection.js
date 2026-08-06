const AppError = require("../utils/AppError");
const { config } = require("../config/env");

const getRequestOrigin = (req) => {
	const origin = req.get("origin");
	if (origin) {
		return origin;
	}
	const referer = req.get("referer");
	if (referer) {
		try {
			return new URL(referer).origin;
		} catch {
			return null;
		}
	}
	return null;
};

const csrfProtection = (req, res, next) => {
	if (!config.CSRF_ENFORCE) {
		return next();
	}

	const allowedOrigin = new URL(config.FRONTEND_URL).origin;
	const requestOrigin = getRequestOrigin(req);
	if (requestOrigin !== allowedOrigin) {
		return next(new AppError("Invalid request origin.", 403));
	}

	const csrfHeader = req.get(config.CSRF_HEADER_NAME);
	const csrfCookie = req.cookies[config.CSRF_COOKIE_NAME];
	if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
		return next(new AppError("Invalid CSRF token.", 403));
	}

	next();
};

module.exports = { csrfProtection };
