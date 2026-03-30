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

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/random" element={<RandomPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:id" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/topperprofile/:id" element={<TopperProfilePage />} />
          <Route path="/become-mentor" element={<BecomeMentorPage />} />
          <Route path="/topper" element={<TopperDashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/legal" element={<LegalPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
