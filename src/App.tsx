import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./providers/Web3Provider";
import { ToastProvider } from "./components/providers/ToastProvider";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import DApp from "./pages/Dapp";

function App() {
  return (
    <Web3Provider>
      <ToastProvider />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/dapp" element={<DApp />} />
          </Route>
        </Routes>
      </Router>
    </Web3Provider>
  );
}

export default App;
