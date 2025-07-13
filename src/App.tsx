import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Web3Provider } from "./providers/Web3Provider";
import { ToastProvider } from "./components/providers/ToastProvider";
import { FarcasterProvider } from "./contexts/FarcasterContext";
import { FarcasterAwareLayout } from "./components/layouts/FarcasterAwareLayout";
import { ApolloProvider } from "./providers/ApolloProvider";
import { useAnalyticsTracking } from "./hooks/useAnalyticsTracking";
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
          <FarcasterAwareLayout>
            <Outlet />
          </FarcasterAwareLayout>
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

function App() {
  return (
    <Web3Provider>
      <ApolloProvider>
        <FarcasterProvider>
          <ToastProvider />
          <Analytics debug={false} />
          <Router future={{ v7_relativeSplatPath: true }}>
            <RoutesWithAnalytics />
          </Router>
        </FarcasterProvider>
      </ApolloProvider>
    </Web3Provider>
  );
}

export default App;
