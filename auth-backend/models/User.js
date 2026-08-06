const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const sessionSchema = new mongoose.Schema(
	{
		sessionId: {
			type: String,
			required: true,
			index: true,
		},
		refreshTokenHash: {
			type: String,
			required: true,
			select: false,
		},
		ip: String,
		userAgent: String,
		valid: {
			type: Boolean,
			default: true,
		},
		createdAt: {
			type: Date,
			default: () => new Date(),
		},
		lastUsedAt: {
			type: Date,
			default: () => new Date(),
		},
		expiresAt: {
			type: Date,
			required: true,
		},
	},
	{ _id: false },
);

const auditLogSchema = new mongoose.Schema(
	{
		eventType: {
			type: String,
			required: true,
			enum: [
				"login_success",
				"login_failure",
				"refresh_success",
				"refresh_reuse",
				"logout",
				"password_reset_request",
				"password_reset_success",
				"email_verified",
				"account_locked",
				"account_unlocked",
			],
		},
		message: String,
		ip: String,
		userAgent: String,
		sessionId: String,
		createdAt: {
			type: Date,
			default: () => new Date(),
		},
	},
	{ _id: false },
);

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required."],
			trim: true,
			minlength: 2,
			maxlength: 100,
		},
		email: {
			type: String,
			required: [true, "Email is required."],
			unique: true,
			lowercase: true,
			trim: true,
			validate: {
				validator: validator.isEmail,
				message: "Please provide a valid email address.",
			},
		},
		password: {
			type: String,
			required: [true, "Password is required."],
			minlength: 8,
			select: false,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		sessions: {
			type: [sessionSchema],
			default: [],
			select: false,
		},
		failedLoginAttempts: {
			type: Number,
			default: 0,
		},
		lockUntil: Date,
		emailVerificationToken: String,
		emailVerificationExpires: Date,
		passwordResetToken: String,
		passwordResetExpires: Date,
		auditLogs: {
			type: [auditLogSchema],
			default: [],
			select: false,
		},
	},
	{
		timestamps: true,
	},
);

const SALT_ROUNDS = 12;
const MAX_AUDIT_LOGS = 50;

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
	next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	if (!this.password) {
		return false;
	}
	return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isAccountLocked = function () {
	return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.addAuditLog = function (eventType, details = {}) {
	if (!Array.isArray(this.auditLogs)) {
		this.auditLogs = [];
	}

	this.auditLogs.unshift({
		eventType,
		message: details.message || "",
		ip: details.ip,
		userAgent: details.userAgent,
		sessionId: details.sessionId,
	});
	if (this.auditLogs.length > MAX_AUDIT_LOGS) {
		this.auditLogs = this.auditLogs.slice(0, MAX_AUDIT_LOGS);
	}
};

const User = mongoose.model("User", userSchema);
module.exports = User;
