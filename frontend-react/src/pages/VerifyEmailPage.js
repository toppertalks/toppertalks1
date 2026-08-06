import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function useQuery() {
	return new URLSearchParams(useLocation().search);
}

export default function VerifyEmailPage() {
	const query = useQuery();
	const navigate = useNavigate();
	const { verifyEmail } = useAuth();
	const [status, setStatus] = useState("loading");
	const [message, setMessage] = useState("Verifying your email...");

	useEffect(() => {
		const token = query.get("token");
		const email = query.get("email");
		if (!token || !email) {
			setStatus("error");
			setMessage("Verification link is missing token or email.");
			return;
		}

		(async () => {
			try {
				const result = await verifyEmail(token, email);
				setStatus("success");
				setMessage(
					result.data?.message || "Your email has been verified successfully.",
				);
			} catch (error) {
				setStatus("error");
				setMessage(
					error.response?.data?.error?.message ||
						error.message ||
						"Verification failed.",
				);
			}
		})();
	}, [query, verifyEmail]);

	return (
		<div className="page-centered">
			<div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
				<h1 style={{ marginBottom: 14, fontSize: 28, color: "#e2e8f0" }}>
					Email Verification
				</h1>
				<div
					style={{
						padding: 24,
						borderRadius: 20,
						background: "rgba(15, 23, 42, 0.96)",
						border: "1px solid rgba(99,102,241,0.18)",
					}}
				>
					<p
						style={{
							color: status === "success" ? "#86efac" : "#fca5a5",
							fontSize: 16,
							marginBottom: 16,
						}}
					>
						{message}
					</p>
					<button
						type="button"
						className="hero-banner-btn"
						onClick={() => navigate(status === "success" ? "/login" : "/login")}
					>
						{status === "success" ? "Go to login" : "Return to login"}
					</button>
				</div>
			</div>
		</div>
	);
}
