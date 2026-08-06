import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SearchPage from "./pages/SearchPage";
import RandomPage from "./pages/RandomPage";
import MessagesPage from "./pages/MessagesPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";
import NotificationsPage from "./pages/NotificationsPage";
import TopperProfilePage from "./pages/TopperProfilePage";
import BecomeMentorPage from "./pages/BecomeMentorPage";
import TopperDashboardPage from "./pages/TopperDashboardPage";
import AdminPage from "./pages/AdminPage";
import LegalPage from "./pages/LegalPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
	return (
		<BrowserRouter>
			<Layout>
				<Routes>
					<Route
						path="/login"
						element={<LoginPage />}
					/>
					<Route
						path="/verify-email"
						element={<VerifyEmailPage />}
					/>
					<Route
						path="/forgot-password"
						element={<ForgotPasswordPage />}
					/>
					<Route
						path="/reset-password"
						element={<ResetPasswordPage />}
					/>
					<Route
						path="/legal"
						element={<LegalPage />}
					/>

					<Route element={<ProtectedRoute />}>
						<Route
							path="/"
							element={<HomePage />}
						/>
						<Route
							path="/search"
							element={<SearchPage />}
						/>
						<Route
							path="/random"
							element={<RandomPage />}
						/>
						<Route
							path="/messages"
							element={<MessagesPage />}
						/>
						<Route
							path="/messages/:id"
							element={<ChatPage />}
						/>
						<Route
							path="/profile"
							element={<ProfilePage />}
						/>
						<Route
							path="/wallet"
							element={<WalletPage />}
						/>
						<Route
							path="/notifications"
							element={<NotificationsPage />}
						/>
						<Route
							path="/topperprofile/:id"
							element={<TopperProfilePage />}
						/>
						<Route
							path="/become-mentor"
							element={<BecomeMentorPage />}
						/>
						<Route
							path="/topper"
							element={<TopperDashboardPage />}
						/>
						<Route
							path="/admin"
							element={<AdminPage />}
						/>
					</Route>
				</Routes>
			</Layout>
		</BrowserRouter>
	);
}
