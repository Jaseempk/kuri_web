import { render } from "@testing-library/react";
import { Web3Provider } from "../providers/Web3Provider";
import { ApolloProvider } from "../providers/ApolloProvider";
import { ToastProvider } from "../components/providers/ToastProvider";
import { BrowserRouter } from "react-router-dom";
import { KuriMarket } from "../hooks/useKuriMarkets";

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <Web3Provider>
        <ApolloProvider>
          {ui}
          <ToastProvider />
        </ApolloProvider>
      </Web3Provider>
    </BrowserRouter>
  );
}

// Mock market data for testing
export const mockMarket: KuriMarket = {
  address: "0x1234567890123456789012345678901234567890",
  creator: "0x1234567890123456789012345678901234567890",
  name: "Test Market",
  totalParticipants: 10,
  activeParticipants: 5,
  kuriAmount: "1000000000", // 1000 USDC
  intervalType: 1, // Monthly
  state: 1, // Active
  createdAt: "1234567890",
  nextDepositTime: "1234567890",
  nextRaffleTime: "1234567890",
  nextDraw: "1234567890",
  launchPeriod: "1234567890",
  startTime: "1234567890",
  endTime: "1234567890",
};

// Mock user data for testing
export const mockUser = {
  address: "0x1234567890123456789012345678901234567890",
  isConnected: true,
  balance: "1000000000000000000", // 1 ETH
};
