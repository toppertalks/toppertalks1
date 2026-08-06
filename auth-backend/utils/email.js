const nodemailer = require("nodemailer");
const { config } = require("../config/env");

const transport = nodemailer.createTransport({
	host: config.EMAIL_HOST,
	port: Number(config.EMAIL_PORT) || 587,
	secure: config.EMAIL_SECURE,
	auth: {
		user: config.EMAIL_USER,
		pass: config.EMAIL_PASSWORD,
	},
});

const sendEmail = async ({ to, subject, text, html }) => {
	if (!config.EMAIL_HOST || !config.EMAIL_USER || !config.EMAIL_PASSWORD) {
		console.warn("Email service is not fully configured. Check .env values.");
		return;
	}

	await transport.sendMail({
		from: config.EMAIL_FROM,
		to,
		subject,
		text,
		html,
	});
};

module.exports = { sendEmail };
