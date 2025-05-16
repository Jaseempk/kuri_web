import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { Web3Provider } from "./providers/Web3Provider";
import { ToastProvider } from "./components/providers/ToastProvider";
import { FarcasterProvider } from "./contexts/FarcasterContext";
import { FarcasterAwareLayout } from "./components/layouts/FarcasterAwareLayout";
import { ApolloProvider } from "./providers/ApolloProvider";
import Landing from "./pages/Landing";
import MarketList from "./pages/MarketList";
import MarketDetail from "./pages/MarketDetail";
import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";
import Onboarding from "./pages/Onboarding";

function App() {
  return (
    <Web3Provider>
      <ApolloProvider>
        <FarcasterProvider>
          <ToastProvider />
          <Router>
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
                <Route path="/profile" element={<UserProfile />} />
              </Route>
            </Routes>
          </Router>
        </FarcasterProvider>
      </ApolloProvider>
    </Web3Provider>
  );
}

export default App;
