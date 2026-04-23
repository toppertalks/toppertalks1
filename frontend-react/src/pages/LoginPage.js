import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	Mail,
	ArrowRight,
	CheckCircle,
	AlertCircle,
	Eye,
	EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const nextUrl = searchParams.get("next") || "/";
	const {
		login,
		signup,
		loading: authLoading,
		error: authError,
		clearError,
		isAuthenticated,
	} = useAuth();

	const [mode, setMode] = useState("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [localError, setLocalError] = useState("");

	if (isAuthenticated) {
		navigate(nextUrl, { replace: true });
		return null;
	}

	const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	const passwordTooShort = password.length > 0 && password.length < 6;

	const resetMessages = () => {
		setLocalError("");
		clearError();
	};

	const handleAuth = async () => {
		resetMessages();

		if (!email || !password) {
			setLocalError("Please enter your email and password.");
			return;
		}

		if (mode === "signup" && !name) {
			setLocalError("Please enter your name.");
			return;
		}

		if (!isValidEmail) {
			setLocalError("Please enter a valid email address.");
			return;
		}

		if (passwordTooShort) {
			setLocalError("Password must be at least 6 characters.");
			return;
		}

		try {
			if (mode === "login") {
				await login(email, password);
			} else {
				await signup(name, email, password);
			}
			navigate(nextUrl, { replace: true });
		} catch (err) {
			// Error becomes available through authError
		}
	};

	return (
		<div className="page-centered">
			<div
				style={{ width: "100%", maxWidth: 420, animation: "fadeUp 0.4s ease" }}
			>
				<div style={{ textAlign: "center", marginBottom: 36 }}>
					<div
						style={{
							width: 72,
							height: 72,
							borderRadius: 22,
							margin: "0 auto 16px",
							background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: "0 12px 40px rgba(99,102,241,0.5)",
							fontSize: 34,
						}}
					>
						🎓
					</div>
					<h1
						style={{
							margin: "0 0 6px",
							fontSize: 26,
							fontWeight: 900,
							color: "#e2e8f0",
						}}
					>
						{mode === "login" ? "Sign In" : "Create Account"}
					</h1>
					<p
						style={{
							margin: 0,
							fontSize: 14,
							color: "#64748b",
							lineHeight: 1.6,
						}}
					>
						{mode === "login" ?
							"Access your TopperTalks dashboard with your email and password."
						:	"Create your TopperTalks account and start learning with top mentors."
						}
					</p>
				</div>

				{(localError || authError) && (
					<div
						className="error-banner"
						style={{ marginBottom: 18 }}
					>
						<AlertCircle
							size={16}
							color="#f87171"
							style={{ flexShrink: 0, marginTop: 1 }}
						/>
						<p style={{ margin: 0, lineHeight: 1.5 }}>
							{localError || authError}
						</p>
					</div>
				)}

				<div
					className="auth-toggle"
					style={{ marginBottom: 24 }}
				>
					{[
						{ key: "login", label: "Sign In" },
						{ key: "signup", label: "Sign Up" },
					].map((option) => (
						<button
							key={option.key}
							type="button"
							onClick={() => {
								setMode(option.key);
								resetMessages();
							}}
							className={mode === option.key ? "active" : ""}
							style={{ flex: 1 }}
						>
							{option.label}
						</button>
					))}
				</div>

				{mode === "signup" && (
					<div style={{ marginBottom: 14 }}>
						<label className="form-label">Name</label>
						<div className="form-input-group">
							<input
								autoFocus
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your full name"
								onFocus={resetMessages}
								onKeyDown={(e) => e.key === "Enter" && handleAuth()}
							/>
						</div>
					</div>
				)}

				<div style={{ marginBottom: 14 }}>
					<label className="form-label">Email</label>
					<div className={`form-input-group ${isValidEmail ? "focused" : ""}`}>
						<Mail
							size={16}
							color="#6366f1"
						/>
						<input
							autoFocus
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							onFocus={resetMessages}
							onKeyDown={(e) => e.key === "Enter" && handleAuth()}
						/>
						{isValidEmail && (
							<CheckCircle
								size={16}
								color="#22c55e"
							/>
						)}
					</div>
				</div>

				<div style={{ marginBottom: 20 }}>
					<label className="form-label">Password</label>
					<div className="form-input-group">
						<input
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="At least 6 characters"
							onFocus={resetMessages}
							onKeyDown={(e) => e.key === "Enter" && handleAuth()}
						/>
						<button
							type="button"
							onClick={() => setShowPassword((current) => !current)}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								color: "#64748b",
								padding: 0,
								display: "flex",
							}}
						>
							{showPassword ?
								<EyeOff size={16} />
							:	<Eye size={16} />}
						</button>
					</div>
					{passwordTooShort && (
						<p style={{ margin: "8px 0 0", fontSize: 12, color: "#f97316" }}>
							Password should be at least 6 characters.
						</p>
					)}
				</div>

				<button
					type="button"
					className="btn-primary"
					onClick={handleAuth}
					disabled={
						authLoading ||
						!email ||
						!password ||
						(mode === "signup" && !name) ||
						!isValidEmail ||
						passwordTooShort
					}
				>
					{authLoading ?
						"Working…"
					: mode === "login" ?
						"Sign In"
					:	"Create Account"}
					<ArrowRight
						size={18}
						style={{ marginLeft: 10 }}
					/>
				</button>

				{mode === "login" && (
					<button
						type="button"
						className="text-link"
						onClick={() => navigate("/forgot-password")}
					>
						Forgot password?
					</button>
				)}

				<p style={{ marginTop: 22, fontSize: 13, color: "#94a3b8" }}>
					{mode === "login" ?
						<>
							New to TopperTalks?{" "}
							<button
								type="button"
								className="text-link"
								onClick={() => setMode("signup")}
							>
								Create an account
							</button>
						</>
					:	<>
							Already have an account?{" "}
							<button
								type="button"
								className="text-link"
								onClick={() => setMode("login")}
							>
								Sign in
							</button>
						</>
					}
				</p>
			</div>
		</div>
	);
}
