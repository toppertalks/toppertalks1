const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { config } = require("../config/env");
const { sendEmail } = require("../utils/email");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");
const {
	generateAccessToken,
	generateRefreshToken,
	hashToken,
} = require("../utils/jwt");

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 30 * 60 * 1000;

const createTokenCookie = (res, token) => {
	const cookieOptions = {
		httpOnly: true,
		secure: config.COOKIE_SECURE,
		sameSite: config.COOKIE_SAMESITE,
		maxAge: SESSION_TTL_MS,
	};
	if (config.COOKIE_DOMAIN) {
		cookieOptions.domain = config.COOKIE_DOMAIN;
	}
	res.cookie(config.COOKIE_NAME, token, cookieOptions);
};

const createCsrfCookie = (res) => {
	const csrfToken = crypto.randomBytes(32).toString("hex");
	const cookieOptions = {
		httpOnly: false,
		secure: config.COOKIE_SECURE,
		sameSite: config.COOKIE_SAMESITE,
		maxAge: SESSION_TTL_MS,
	};
	if (config.COOKIE_DOMAIN) {
		cookieOptions.domain = config.COOKIE_DOMAIN;
	}
	res.cookie(config.CSRF_COOKIE_NAME, csrfToken, cookieOptions);
	return csrfToken;
};

const clearAuthCookies = (res) => {
	const cookieOptions = {
		httpOnly: true,
		secure: config.COOKIE_SECURE,
		sameSite: config.COOKIE_SAMESITE,
		maxAge: 0,
	};
	if (config.COOKIE_DOMAIN) {
		cookieOptions.domain = config.COOKIE_DOMAIN;
	}
	res.clearCookie(config.COOKIE_NAME, cookieOptions);
	res.clearCookie(config.CSRF_COOKIE_NAME, {
		httpOnly: false,
		secure: config.COOKIE_SECURE,
		sameSite: config.COOKIE_SAMESITE,
		maxAge: 0,
		...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
	});
};

const addAuditLog = (user, eventType, details = {}) => {
	user.addAuditLog(eventType, {
		message: details.message,
		ip: details.ip,
		userAgent: details.userAgent,
		sessionId: details.sessionId,
	});
};

const handleFailedLogin = async (user, ip, userAgent) => {
	user.failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
	if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
		user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
		addAuditLog(user, "account_locked", {
			ip,
			userAgent,
			message: "Account locked due to repeated failed login attempts.",
		});
	}
	addAuditLog(user, "login_failure", {
		ip,
		userAgent,
		message: "Invalid credentials provided.",
	});
	await user.save();
};

const resetLoginState = async (user) => {
	user.failedLoginAttempts = 0;
	user.lockUntil = undefined;
	await user.save();
};

const invalidateAllSessions = async (user, reason, details) => {
	user.sessions.forEach((session) => {
		session.valid = false;
	});
	addAuditLog(user, reason, details);
	await user.save();
};

const signup = async (req, res, next) => {
	try {
		const { name, email, password } = req.body;

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res
				.status(409)
				.json({ success: false, error: { message: "Email already in use." } });
		}

		const emailVerificationToken = crypto.randomBytes(32).toString("hex");
		const emailVerificationHash = hashToken(emailVerificationToken);
		const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

		const user = await User.create({
			name,
			email,
			password,
			emailVerificationToken: emailVerificationHash,
			emailVerificationExpires,
		});

		const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(user.email)}`;
		await sendEmail({
			to: user.email,
			subject: "Verify your TopperTalks email",
			text: `Click here to verify your email: ${verificationUrl}`,
			html: `<p>Click the link to verify your email:</p><p><a href="${verificationUrl}">Verify Email</a></p>`,
		});

		res.status(201).json({
			success: true,
			message:
				"User registered successfully. Please verify your email before logging in.",
		});
	} catch (error) {
		next(error);
	}
};

const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const ip = req.ip;
		const userAgent = req.get("User-Agent") || "unknown";

		const user = await User.findOne({ email }).select(
			"+password +sessions +failedLoginAttempts +lockUntil +auditLogs",
		);
		if (!user) {
			logger.warn("Login attempt failed for unknown email", {
				event: "login_failure",
				email,
				ip,
				userAgent,
			});
			return next(new AppError("Invalid credentials.", 401));
		}

		if (user.isAccountLocked()) {
			logger.warn("Locked account login attempt", {
				event: "login_locked",
				userId: user.id,
				ip,
				userAgent,
			});
			return next(new AppError("Account locked. Try again later.", 423));
		}

		if (!user.isVerified) {
			return next(
				new AppError("Please verify your email before logging in.", 403),
			);
		}

		const passwordMatches = await user.comparePassword(password);
		if (!passwordMatches) {
			await handleFailedLogin(user, ip, userAgent);
			return next(new AppError("Invalid credentials.", 401));
		}

		await resetLoginState(user);

		const sessionId = crypto.randomUUID();
		const refreshToken = generateRefreshToken(user.id, sessionId);
		const refreshTokenHash = hashToken(refreshToken);
		const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

		user.sessions.push({
			sessionId,
			refreshTokenHash,
			ip,
			userAgent,
			valid: true,
			createdAt: new Date(),
			lastUsedAt: new Date(),
			expiresAt,
		});

		addAuditLog(user, "login_success", {
			ip,
			userAgent,
			sessionId,
			message: "User logged in successfully.",
		});

		logger.info("User login successful", {
			event: "login_success",
			userId: user.id,
			sessionId,
			ip,
			userAgent,
		});

		await user.save();

		const accessToken = generateAccessToken(user.id);
		createTokenCookie(res, refreshToken);
		const csrfToken = createCsrfCookie(res);

		res.json({
			success: true,
			data: {
				accessToken,
				expiresIn: config.JWT_ACCESS_EXPIRES,
				csrfToken,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			},
		});
	} catch (error) {
		next(error);
	}
};

const refreshToken = async (req, res, next) => {
	try {
		const token = req.cookies[config.COOKIE_NAME];
		if (!token) {
			return next(new AppError("Refresh token missing.", 401));
		}

		const payload = jwt.verify(token, config.JWT_REFRESH_SECRET);
		if (payload.type !== "refresh") {
			return next(new AppError("Invalid token type.", 401));
		}

		const user = await User.findById(payload.sub).select(
			"+sessions +sessions.refreshTokenHash",
		);
		if (!user) {
			clearAuthCookies(res);
			return next(new AppError("Unauthorized.", 401));
		}

		const session = user.sessions.find(
			(item) => item.sessionId === payload.sid,
		);
		if (
			!session ||
			!session.valid ||
			(session.expiresAt && session.expiresAt < new Date())
		) {
			await invalidateAllSessions(user, "refresh_reuse", {
				ip: req.ip,
				userAgent: req.get("User-Agent") || "unknown",
				sessionId: session?.sessionId,
				message: "Refresh token reuse or stale session detected.",
			});

			clearAuthCookies(res);
			logger.warn("Refresh token reused or expired", {
				event: "refresh_reuse",
				userId: user.id,
				sessionId: session?.sessionId,
				ip: req.ip,
			});
			return next(
				new AppError("Refresh token reuse detected. Please log in again.", 401),
			);
		}

		const refreshTokenHash = hashToken(token);
		if (refreshTokenHash !== session.refreshTokenHash) {
			await invalidateAllSessions(user, "refresh_reuse", {
				ip: req.ip,
				userAgent: req.get("User-Agent") || "unknown",
				sessionId: session.sessionId,
				message: "Refresh token hash mismatch detected.",
			});

			clearAuthCookies(res);
			logger.warn("Refresh token hash mismatch", {
				event: "refresh_reuse",
				userId: user.id,
				sessionId: session.sessionId,
				ip: req.ip,
			});
			return next(
				new AppError("Refresh token reuse detected. Please log in again.", 401),
			);
		}

		const newRefreshToken = generateRefreshToken(user.id, session.sessionId);
		session.refreshTokenHash = hashToken(newRefreshToken);
		session.lastUsedAt = new Date();
		session.expiresAt = new Date(Date.now() + SESSION_TTL_MS);

		addAuditLog(user, "refresh_success", {
			ip: req.ip,
			userAgent: req.get("User-Agent") || "unknown",
			sessionId: session.sessionId,
			message: "Refresh token rotated successfully.",
		});

		logger.info("Refresh token rotated", {
			event: "refresh_success",
			userId: user.id,
			sessionId: session.sessionId,
			ip: req.ip,
		});

		await user.save();

		const accessToken = generateAccessToken(user.id);
		createTokenCookie(res, newRefreshToken);
		const csrfToken = createCsrfCookie(res);

		res.json({
			success: true,
			data: { accessToken, expiresIn: config.JWT_ACCESS_EXPIRES, csrfToken },
		});
	} catch (error) {
		if (
			error.name === "TokenExpiredError" ||
			error.name === "JsonWebTokenError"
		) {
			clearAuthCookies(res);
			return next(new AppError("Refresh token invalid or expired.", 401));
		}
		next(error);
	}
};

const logout = async (req, res, next) => {
	try {
		const token = req.cookies[config.COOKIE_NAME];
		let sessionId;

		if (token) {
			try {
				const payload = jwt.verify(token, config.JWT_REFRESH_SECRET);
				if (payload.type === "refresh") {
					sessionId = payload.sid;
					const user = await User.findById(payload.sub).select(
						"+sessions +sessions.refreshTokenHash",
					);
					if (user) {
						const sessionIndex = user.sessions.findIndex(
							(item) => item.sessionId === sessionId,
						);
						if (sessionIndex !== -1) {
							user.sessions.splice(sessionIndex, 1);
							addAuditLog(user, "logout", {
								ip: req.ip,
								userAgent: req.get("User-Agent") || "unknown",
								sessionId,
								message: "User logged out from one device.",
							});
							await user.save();
						}
					}
				}
			} catch (_) {
				// If token is invalid, still clear cookies.
			}
		}

		clearAuthCookies(res);

		res.json({ success: true, message: "Logged out successfully." });
	} catch (error) {
		next(error);
	}
};

const verifyEmail = async (req, res, next) => {
	try {
		const { token, email } = req.query;
		if (!token || !email) {
			return res
				.status(400)
				.json({
					success: false,
					error: { message: "Verification token and email are required." },
				});
		}

		const hashedToken = hashToken(token);
		const user = await User.findOne({
			email,
			emailVerificationToken: hashedToken,
			emailVerificationExpires: { $gt: Date.now() },
		});

		if (!user) {
			return res
				.status(400)
				.json({
					success: false,
					error: { message: "Invalid or expired verification token." },
				});
		}

		user.isVerified = true;
		user.emailVerificationToken = undefined;
		user.emailVerificationExpires = undefined;
		addAuditLog(user, "email_verified", {
			ip: req.ip,
			userAgent: req.get("User-Agent") || "unknown",
			message: "Email address verified.",
		});
		await user.save();

		res.json({ success: true, message: "Email verified successfully." });
	} catch (error) {
		next(error);
	}
};

const requestPasswordReset = async (req, res, next) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res
				.status(400)
				.json({ success: false, error: { message: "Email is required." } });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(200)
				.json({
					success: true,
					message: "If that email exists, a password reset link has been sent.",
				});
		}

		const resetToken = crypto.randomBytes(32).toString("hex");
		user.passwordResetToken = hashToken(resetToken);
		user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
		addAuditLog(user, "password_reset_request", {
			ip: req.ip,
			userAgent: req.get("User-Agent") || "unknown",
			message: "Password reset requested.",
		});
		await user.save();

		const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
		await sendEmail({
			to: user.email,
			subject: "Reset your TopperTalks password",
			text: `Use this link to reset your password: ${resetUrl}`,
			html: `<p>Click the button below to reset your password.</p><p><a href="${resetUrl}">Reset password</a></p>`,
		});

		res.json({
			success: true,
			message: "Password reset email sent if the email exists.",
		});
	} catch (error) {
		next(error);
	}
};

const resetPassword = async (req, res, next) => {
	try {
		const { token, email, password } = req.body;
		if (!token || !email || !password) {
			return res
				.status(400)
				.json({
					success: false,
					error: { message: "Token, email, and password are required." },
				});
		}

		const user = await User.findOne({
			email,
			passwordResetToken: hashToken(token),
			passwordResetExpires: { $gt: Date.now() },
		}).select("+sessions +sessions.refreshTokenHash");

		if (!user) {
			return res
				.status(400)
				.json({
					success: false,
					error: { message: "Invalid or expired reset token." },
				});
		}

		user.password = password;
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		user.sessions.forEach((session) => {
			session.valid = false;
		});
		addAuditLog(user, "password_reset_success", {
			ip: req.ip,
			userAgent: req.get("User-Agent") || "unknown",
			message:
				"Password reset completed successfully and sessions invalidated.",
		});
		await user.save();

		res.json({
			success: true,
			message: "Password has been reset successfully.",
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	signup,
	login,
	refreshToken,
	logout,
	verifyEmail,
	requestPasswordReset,
	resetPassword,
};
