import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { resetPassword } = useAuth();
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState("idle");
	const [message, setMessage] = useState("");

	const token = searchParams.get("token");
	const email = searchParams.get("email");

	useEffect(() => {
		if (!token || !email) {
			setStatus("error");
			setMessage("Password reset link is missing token or email.");
		}
	}, [token, email]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setStatus("idle");
		setMessage("");
		if (!password || password.length < 6) {
			setStatus("error");
			setMessage("Please choose a stronger password (min 6 characters).");
			return;
		}
		setStatus("loading");
		try {
			const result = await resetPassword(token, email, password);
			setStatus("success");
			setMessage(
				result.data?.message || "Password reset successfully. Please sign in.",
			);
		} catch (err) {
			setStatus("error");
			setMessage(
				err.response?.data?.error?.message ||
					err.message ||
					"Unable to reset your password.",
			);
		}
	};

	return (
		<div className="page-centered">
			<div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
				<h1 style={{ marginBottom: 14, fontSize: 28, color: "#e2e8f0" }}>
					Reset Password
				</h1>
				<p style={{ margin: "0 0 24px", color: "#94a3b8" }}>
					{email ? `Reset password for ${email}` : "Enter your new password."}
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
						New password
					</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="New password"
						style={{
							padding: "14px 16px",
							borderRadius: 14,
							border: "1px solid rgba(148, 163, 184, 0.2)",
							background: "#0e1525",
							color: "#e2e8f0",
						}}
					/>
					{(status === "error" || message) && (
						<div
							className={status === "error" ? "error-banner" : ""}
							style={
								status !== "error" ?
									{
										padding: "12px 14px",
										borderRadius: 12,
										background: "rgba(34,197,94,0.12)",
										color: "#d9f99d",
									}
								:	{}
							}
						>
							<p>{message}</p>
						</div>
					)}
					<button
						type="submit"
						className="hero-banner-btn"
						disabled={status === "loading" || !token || !email}
					>
						{status === "loading" ? "Resetting…" : "Reset Password"}
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
