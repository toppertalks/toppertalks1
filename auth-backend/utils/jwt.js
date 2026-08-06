const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { config } = require("../config/env");

const generateAccessToken = (userId) => {
	return jwt.sign({ sub: userId, type: "access" }, config.JWT_ACCESS_SECRET, {
		expiresIn: config.JWT_ACCESS_EXPIRES,
	});
};

const generateRefreshToken = (userId, sessionId) => {
	return jwt.sign(
		{
			sub: userId,
			sid: sessionId,
			type: "refresh",
			jti: crypto.randomUUID(),
		},
		config.JWT_REFRESH_SECRET,
		{
			expiresIn: config.JWT_REFRESH_EXPIRES,
		},
	);
};

const hashToken = (token) => {
	return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = { generateAccessToken, generateRefreshToken, hashToken };
