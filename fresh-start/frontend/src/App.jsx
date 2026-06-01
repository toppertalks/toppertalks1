import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import GoogleCallbackPage from './pages/GoogleCallbackPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';

import HomePage from './pages/HomePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import RandomPage from './pages/RandomPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import TopperProfilePage from './pages/TopperProfilePage.jsx';
import BecomeMentorPage from './pages/BecomeMentorPage.jsx';
import TopperDashboardPage from './pages/TopperDashboardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import LegalPage from './pages/LegalPage.jsx';

export default function App() {
  const { loading } = useAuth();
  if (loading) return <div className="center-loading">Loading…</div>;
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/random" element={<ProtectedRoute><RandomPage /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/messages/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/topperprofile/:id" element={<ProtectedRoute><TopperProfilePage /></ProtectedRoute>} />
        <Route path="/become-mentor" element={<ProtectedRoute><BecomeMentorPage /></ProtectedRoute>} />
        <Route path="/topper" element={<ProtectedRoute><TopperDashboardPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
