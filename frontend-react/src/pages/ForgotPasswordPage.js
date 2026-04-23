import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPasswordPage() {
	const navigate = useNavigate();
	const { requestPasswordReset } = useAuth();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setMessage("");
		if (!email) {
			setError("Please enter your email address.");
			return;
		}
		setLoading(true);
		try {
			const result = await requestPasswordReset(email);
			setMessage(
				result.data?.message ||
					"If that email exists, a reset link has been sent.",
			);
		} catch (err) {
			setError(
				err.response?.data?.error?.message ||
					err.message ||
					"Unable to request password reset.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="page-centered">
			<div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
				<h1 style={{ marginBottom: 14, fontSize: 28, color: "#e2e8f0" }}>
					Forgot Password
				</h1>
				<p style={{ margin: "0 0 24px", color: "#94a3b8" }}>
					Enter your email and we’ll send you a secure link to reset your
					password.
				</p>
				<form
					onSubmit={handleSubmit}
					style={{
						display: "grid",
						gap: 14,
						background: "rgba(15, 23, 42, 0.96)",
						border: "1px solid rgba(99,102,241,0.18)",
						borderRadius: 20,
						padding: 24,
					}}
				>
					<label
						style={{
							textAlign: "left",
							color: "#cbd5e1",
							fontSize: 13,
							fontWeight: 600,
						}}
					>
						Email
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						style={{
							padding: "14px 16px",
							borderRadius: 14,
							border: "1px solid rgba(148, 163, 184, 0.2)",
							background: "#0e1525",
							color: "#e2e8f0",
						}}
					/>
					{error && (
						<div className="error-banner">
							<p>{error}</p>
						</div>
					)}
					{message && (
						<div
							style={{
								padding: "12px 14px",
								borderRadius: 12,
								background: "rgba(34,197,94,0.12)",
								color: "#d9f99d",
							}}
						>
							{message}
						</div>
					)}
					<button
						type="submit"
						className="hero-banner-btn"
						disabled={loading}
					>
						{loading ? "Sending..." : "Send reset link"}
					</button>
					<button
						type="button"
						className="hero-banner-btn"
						style={{ background: "rgba(99,102,241,0.12)", color: "#cbd5e1" }}
						onClick={() => navigate("/login")}
					>
						Back to login
					</button>
				</form>
			</div>
		</div>
	);
}
