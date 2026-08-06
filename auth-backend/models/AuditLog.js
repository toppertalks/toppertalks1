const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
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
			index: true,
		},
	},
	{
		timestamps: false,
	},
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
module.exports = AuditLog;
