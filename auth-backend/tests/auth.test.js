jest.setTimeout(60000);
process.env.NODE_ENV = "test";
process.env.CSRF_ENFORCE = "true";
process.env.ENFORCE_HTTPS = "false";
process.env.COOKIE_SECURE = "false";
process.env.RATE_LIMITER_ENABLED = "false";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
process.env.COOKIE_NAME = "refreshToken";
process.env.CSRF_COOKIE_NAME = "csrfToken";
process.env.CSRF_HEADER_NAME = "x-csrf-token";

jest.mock("../utils/email", () => ({
	sendEmail: jest.fn(),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const crypto = require("crypto");
const { generateRefreshToken, hashToken } = require("../utils/jwt");
const { sendEmail } = require("../utils/email");
const User = require("../models/User");
const { app } = require("../server");
const { config } = require("../config/env");

let mongoServer;

const extractCookieValue = (res, name) => {
	const cookieHeader = res.headers["set-cookie"] || [];
	const cookieString = cookieHeader.find((cookie) =>
		cookie.startsWith(`${name}=`),
	);
	if (!cookieString) return null;
	const cookiePair = cookieString.split(";")[0];
	const separatorIndex = cookiePair.indexOf("=");
	return separatorIndex >= 0 ? cookiePair.slice(separatorIndex + 1) : null;
};

const buildCookieHeader = (cookies) =>
	cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

const createVerifiedUser = async () => {
	const password = "Aa1!password";
	const user = await User.create({
		name: "Test User",
		email: "test@example.com",
		password,
		isVerified: true,
	});
	return { user, password };
};

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri(), {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
});

afterAll(async () => {
	await mongoose.disconnect();
	if (mongoServer) {
		await mongoServer.stop();
	}
});

beforeEach(async () => {
	sendEmail.mockClear();
	const collections = Object.values(mongoose.connection.collections);
	for (const collection of collections) {
		await collection.deleteMany({});
	}
});

describe("Authentication production-grade flow", () => {
	it("detects refresh token reuse and invalidates sessions", async () => {
		const { password } = await createVerifiedUser();
		const agent = request.agent(app);

		const loginRes = await agent
			.post("/api/auth/login")
			.send({ email: "test@example.com", password });
		expect(loginRes.status).toBe(200);
		expect(loginRes.body.success).toBe(true);

		const csrfToken = extractCookieValue(loginRes, config.CSRF_COOKIE_NAME);
		expect(csrfToken).toBeTruthy();

		const refreshRes = await agent
			.post("/api/auth/refresh")
			.set("Origin", config.FRONTEND_URL)
			.set(config.CSRF_HEADER_NAME, csrfToken)
			.send();
		expect(refreshRes.status).toBe(200);
		expect(refreshRes.body.success).toBe(true);

		const oldRefreshCookie = extractCookieValue(loginRes, config.COOKIE_NAME);
		const reuseRes = await request(app)
			.post("/api/auth/refresh")
			.set("Origin", config.FRONTEND_URL)
			.set(config.CSRF_HEADER_NAME, csrfToken)
			.set(
				"Cookie",
				`${config.COOKIE_NAME}=${oldRefreshCookie}; ${config.CSRF_COOKIE_NAME}=${csrfToken}`,
			)
			.send();

		expect(reuseRes.status).toBe(401);
		expect(reuseRes.body.error.message).toMatch(/reuse detected/i);
	});

	it("rejects refresh when the session has expired", async () => {
		const { user } = await createVerifiedUser();
		const sessionId = crypto.randomUUID();
		const refreshToken = generateRefreshToken(user.id, sessionId);
		const refreshTokenHash = hashToken(refreshToken);

		user.sessions.push({
			sessionId,
			refreshTokenHash,
			ip: "127.0.0.1",
			userAgent: "jest",
			valid: true,
			createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
			lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
			expiresAt: new Date(Date.now() - 1000),
		});
		await user.save();

		const response = await request(app)
			.post("/api/auth/refresh")
			.set("Origin", config.FRONTEND_URL)
			.set(config.CSRF_HEADER_NAME, "fake-csrf-token")
			.set(
				"Cookie",
				`${config.COOKIE_NAME}=${refreshToken}; ${config.CSRF_COOKIE_NAME}=fake-csrf-token`,
			)
			.send();

		expect(response.status).toBe(401);
		expect(response.body.error.message).toMatch(/reuse detected/i);
	});

	it("locks an account after too many failed login attempts", async () => {
		const { password } = await createVerifiedUser();

		for (let i = 0; i < 5; i += 1) {
			const res = await request(app)
				.post("/api/auth/login")
				.send({ email: "test@example.com", password: "BadPassword1!" });
			expect(res.status).toBe(401);
		}

		const lockRes = await request(app)
			.post("/api/auth/login")
			.send({ email: "test@example.com", password: "BadPassword1!" });
		expect(lockRes.status).toBe(423);
		expect(lockRes.body.error.message).toMatch(/account locked/i);
	});

	it("rejects logout without a valid CSRF token", async () => {
		const { password } = await createVerifiedUser();
		const agent = request.agent(app);
		const loginRes = await agent
			.post("/api/auth/login")
			.send({ email: "test@example.com", password });
		expect(loginRes.status).toBe(200);

		const response = await agent
			.post("/api/auth/logout")
			.set("Origin", config.FRONTEND_URL)
			.send();
		expect(response.status).toBe(403);
		expect(response.body.error.message).toMatch(/invalid csrf/i);
	});

	it("invalidates refresh on logout", async () => {
		const { password } = await createVerifiedUser();
		const agent = request.agent(app);

		const loginRes = await agent
			.post("/api/auth/login")
			.send({ email: "test@example.com", password });
		expect(loginRes.status).toBe(200);
		const csrfToken = extractCookieValue(loginRes, config.CSRF_COOKIE_NAME);
		const refreshCookie = extractCookieValue(loginRes, config.COOKIE_NAME);

		const logoutRes = await agent
			.post("/api/auth/logout")
			.set("Origin", config.FRONTEND_URL)
			.set(config.CSRF_HEADER_NAME, csrfToken)
			.send();

		expect(logoutRes.status).toBe(200);
		expect(logoutRes.body.success).toBe(true);

		const refreshRes = await request(app)
			.post("/api/auth/refresh")
			.set("Origin", config.FRONTEND_URL)
			.set(config.CSRF_HEADER_NAME, csrfToken)
			.set(
				"Cookie",
				`${config.COOKIE_NAME}=${refreshCookie}; ${config.CSRF_COOKIE_NAME}=${csrfToken}`,
			)
			.send();

		expect(refreshRes.status).toBe(401);
		expect(refreshRes.body.error.message).toMatch(
			/reuse detected|invalid or expired/i,
		);
	});

	it("registers a new user and rejects duplicate signup", async () => {
		const signupPayload = {
			name: "Signup User",
			email: "signup@example.com",
			password: "Aa1!password",
		};

		const signupRes = await request(app)
			.post("/api/auth/signup")
			.send(signupPayload);
		expect(signupRes.status).toBe(201);
		expect(signupRes.body.success).toBe(true);

		const duplicateRes = await request(app)
			.post("/api/auth/signup")
			.send(signupPayload);
		expect(duplicateRes.status).toBe(409);
		expect(duplicateRes.body.error.message).toMatch(/email already in use/i);
	});

	it("verifies email when the verification token from email is used", async () => {
		const signupPayload = {
			name: "Verify User",
			email: "verify@example.com",
			password: "Aa1!password",
		};

		const signupRes = await request(app)
			.post("/api/auth/signup")
			.send(signupPayload);
		expect(signupRes.status).toBe(201);
		expect(signupRes.body.success).toBe(true);
		expect(sendEmail).toHaveBeenCalledTimes(1);

		const emailPayload = sendEmail.mock.calls[0][0];
		expect(emailPayload.to).toBe("verify@example.com");

		const match = /token=([0-9a-f]+)&email=/.exec(
			emailPayload.html || emailPayload.text,
		);
		expect(match).toBeTruthy();
		const verificationToken = match[1];

		const verifyRes = await request(app)
			.get("/api/auth/verify-email")
			.query({ token: verificationToken, email: "verify@example.com" });

		expect(verifyRes.status).toBe(200);
		expect(verifyRes.body.success).toBe(true);

		const verifiedUser = await User.findOne({ email: "verify@example.com" });
		expect(verifiedUser).toBeTruthy();
		expect(verifiedUser.isVerified).toBe(true);
	});

	it("supports password reset and invalidates existing sessions", async () => {
		const { password } = await createVerifiedUser();
		const loginAgent = request.agent(app);

		const loginRes = await loginAgent
			.post("/api/auth/login")
			.send({ email: "test@example.com", password });
		expect(loginRes.status).toBe(200);

		const oldCsrfToken = extractCookieValue(loginRes, config.CSRF_COOKIE_NAME);
		const oldRefreshCookie = extractCookieValue(loginRes, config.COOKIE_NAME);

		const requestResetRes = await request(app)
			.post("/api/auth/request-password-reset")
			.send({ email: "test@example.com" });
		expect(requestResetRes.status).toBe(200);
		expect(requestResetRes.body.success).toBe(true);
		expect(sendEmail).toHaveBeenCalledTimes(1);

		const emailPayload = sendEmail.mock.calls[0][0];
		expect(emailPayload.to).toBe("test@example.com");
		const match = /token=([0-9a-f]+)&email=/.exec(
			emailPayload.html || emailPayload.text,
		);
		expect(match).toBeTruthy();
		const resetToken = match[1];

		const resetRes = await request(app)
			.post("/api/auth/reset-password")
			.send({
				token: resetToken,
				email: "test@example.com",
				password: "NewPass1!",
			});
		expect(resetRes.status).toBe(200);
		expect(resetRes.body.success).toBe(true);

		const refreshRes = await request(app)
			.post("/api/auth/refresh")
			.set("Origin", config.FRONTEND_URL)
			.set(config.CSRF_HEADER_NAME, oldCsrfToken)
			.set(
				"Cookie",
				`${config.COOKIE_NAME}=${oldRefreshCookie}; ${config.CSRF_COOKIE_NAME}=${oldCsrfToken}`,
			)
			.send();
		expect(refreshRes.status).toBe(401);

		const reloginRes = await request(app)
			.post("/api/auth/login")
			.send({ email: "test@example.com", password: "NewPass1!" });
		expect(reloginRes.status).toBe(200);
		expect(reloginRes.body.success).toBe(true);
	});
});
