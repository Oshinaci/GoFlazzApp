import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

import LandingPage from "@/pages/landing/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import CreateWalletPage from "@/pages/auth/CreateWalletPage";
import ImportWalletPage from "@/pages/auth/ImportWalletPage";
import RecoveryPhrasePage from "@/pages/auth/RecoveryPhrasePage";
import VerifyRecoveryPage from "@/pages/auth/VerifyRecoveryPage";

import DashboardPage from "@/pages/dashboard/DashboardPage";
import MarketPage from "@/pages/market/MarketPage";
import TokenDetailPage from "@/pages/market/TokenDetailPage";
import WatchlistPage from "@/pages/watchlist/WatchlistPage";

import SettingsLayout from "@/pages/settings/SettingsLayout";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import WalletSettings from "@/pages/settings/WalletSettings";
import AppearanceSettings from "@/pages/settings/AppearanceSettings";
import LanguageSettings from "@/pages/settings/LanguageSettings";
import CurrencySettings from "@/pages/settings/CurrencySettings";
import SecuritySettings from "@/pages/settings/SecuritySettings";
import NotificationSettings from "@/pages/settings/NotificationSettings";
import PrivacySettings from "@/pages/settings/PrivacySettings";
import SupportSettings from "@/pages/settings/SupportSettings";
import AboutSettings from "@/pages/settings/AboutSettings";
import HelpCenterSettings from "@/pages/settings/HelpCenterSettings";

import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Onboarding (auth required, but pre-wallet) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/wallet/create" element={<CreateWalletPage />} />
          <Route path="/wallet/import" element={<ImportWalletPage />} />
          <Route path="/wallet/recovery-phrase" element={<RecoveryPhrasePage />} />
          <Route path="/wallet/verify" element={<VerifyRecoveryPage />} />

          {/* Main app */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/market/:coinId" element={<TokenDetailPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />

          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<ProfileSettings />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="wallet" element={<WalletSettings />} />
            <Route path="appearance" element={<AppearanceSettings />} />
            <Route path="language" element={<LanguageSettings />} />
            <Route path="currency" element={<CurrencySettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="privacy" element={<PrivacySettings />} />
            <Route path="support" element={<SupportSettings />} />
            <Route path="about" element={<AboutSettings />} />
            <Route path="help" element={<HelpCenterSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
