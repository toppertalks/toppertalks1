const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
	{
		sessionId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
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
			index: true,
		},
		createdAt: {
			type: Date,
			default: () => new Date(),
			index: true,
		},
		lastUsedAt: {
			type: Date,
			default: () => new Date(),
		},
		expiresAt: {
			type: Date,
			required: true,
			index: true,
		},
	},
	{
		timestamps: false,
	},
);

const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;
