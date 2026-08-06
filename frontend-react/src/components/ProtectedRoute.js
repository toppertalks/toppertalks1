import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
	const { user, loading, initialized } = useAuth();
	const location = useLocation();

	if (!initialized || loading) {
		return (
			<div className="page-centered">
				<div style={{ textAlign: "center", color: "#cbd5e1" }}>
					<p>Checking your session...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<Navigate
				to={`/login?next=${encodeURIComponent(location.pathname)}`}
				replace
			/>
		);
	}

	return children;
}
