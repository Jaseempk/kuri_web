import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./providers/Web3Provider";
import { ToastProvider } from "./components/providers/ToastProvider";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import { ApolloProvider } from "./providers/ApolloProvider";
import MarketList from "./pages/MarketList";
import MarketDetail from "./pages/MarketDetail";
import UserDashboard from "./pages/UserDashboard";

function App() {
  return (
    <Web3Provider>
      <ApolloProvider>
        <ToastProvider />
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<Layout />}>
              <Route path="/markets" element={<MarketList />} />
              <Route path="/markets/:address" element={<MarketDetail />} />
              <Route path="/dashboard" element={<UserDashboard />} />
            </Route>
          </Routes>
        </Router>
      </ApolloProvider>
    </Web3Provider>
  );
}

export default App;
