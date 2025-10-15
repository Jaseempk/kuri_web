import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { ParaWeb3Provider } from "./providers/ParaWeb3Provider";
import { ParaErrorBoundary } from "./components/providers/ParaErrorBoundary";
import { ToastProvider } from "./components/providers/ToastProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { FarcasterProvider } from "./contexts/FarcasterContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { FarcasterAwareLayout } from "./components/layouts/FarcasterAwareLayout";
import { PostCreationModalProvider } from "./components/modals/PostCreationModalProvider";
import { ApolloProvider } from "./providers/ApolloProvider";
import { useAnalyticsTracking } from "./hooks/useAnalyticsTracking";
import { InstallPrompt } from "./components/InstallPrompt";
import { NetworkStatus } from "./components/NetworkStatus";
import { FloatingNotificationPrompt } from "./components/notifications/FloatingNotificationPrompt";
import { NotificationHandler } from "./components/notifications/NotificationHandler";
import { AuthGuard } from "./components/guards/AuthGuard";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import Landing from "./pages/Landing";
import MarketList from "./pages/MarketList";
import MarketDetail from "./pages/MarketDetail";
import UserDashboard from "./pages/UserDashboard";
import EnhancedProfile from "./pages/EnhancedProfile";
import ProfileRedirect from "./pages/ProfileRedirect";
import Onboarding from "./pages/Onboarding";
import UserInsights from "./pages/UserInsights";

// Component that handles analytics tracking within Router context
function RoutesWithAnalytics() {
  // Enable analytics tracking for the entire app
  useAnalyticsTracking();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        element={
          <AuthGuard>
            <FarcasterAwareLayout>
              <Outlet />
            </FarcasterAwareLayout>
          </AuthGuard>
        }
      >
        <Route path="/markets" element={<MarketList />} />
        <Route path="/markets/:address" element={<MarketDetail />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/u/:identifier" element={<EnhancedProfile />} />
        <Route path="/me" element={<ProfileRedirect />} />
        <Route path="/insights/:address" element={<UserInsights />} />
      </Route>
    </Routes>
  );
}

// Runtime Para configuration validation
if (!import.meta.env.VITE_PARA_API_KEY) {
  throw new Error('VITE_PARA_API_KEY is required for Para authentication');
}

function App() {
  return (
    <ParaErrorBoundary>
      <ParaWeb3Provider>
      <ApolloProvider>
        <AuthProvider>
          <CurrencyProvider>
            <FarcasterProvider>
              <ToastProvider />
              <Analytics debug={false} />
              <NetworkStatus />
              <Router future={{ v7_relativeSplatPath: true }}>
                <PostCreationModalProvider>
                  <NotificationHandler />
                  <RoutesWithAnalytics />
                  <InstallPrompt />
                  <FloatingNotificationPrompt />
                  <PWAUpdatePrompt />
                </PostCreationModalProvider>
              </Router>
            </FarcasterProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ApolloProvider>
    </ParaWeb3Provider>
    </ParaErrorBoundary>
  );
}

export default App;
