const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { config } = require("../config/env");

const authenticate = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res
				.status(401)
				.json({ success: false, error: { message: "Unauthorized" } });
		}

		const token = authHeader.split(" ")[1];
		const payload = jwt.verify(token, config.JWT_ACCESS_SECRET);
		if (payload.type !== "access") {
			return res
				.status(401)
				.json({ success: false, error: { message: "Invalid token type." } });
		}

		const user = await User.findById(payload.sub).select(
			"-password -sessions -auditLogs",
		);
		if (!user) {
			return res
				.status(401)
				.json({ success: false, error: { message: "Unauthorized" } });
		}

		req.user = user;
		next();
	} catch (error) {
		return res
			.status(401)
			.json({
				success: false,
				error: { message: "Invalid or expired token." },
			});
	}
};

const authorize = (...allowedRoles) => {
	return (req, res, next) => {
		if (!req.user || !allowedRoles.includes(req.user.role)) {
			return res
				.status(403)
				.json({
					success: false,
					error: { message: "Forbidden: insufficient permissions." },
				});
		}
		next();
	};
};

module.exports = { authenticate, authorize };
