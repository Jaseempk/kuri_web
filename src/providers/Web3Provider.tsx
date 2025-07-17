import { WagmiProvider } from "wagmi";
import { config } from "../config/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";

// Create a client with optimized settings for market and user data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000, // Default stale time
      gcTime: 300000, // 5 minutes garbage collection (replaces cacheTime in v5)
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Set up query-specific configurations
queryClient.setQueryDefaults(["userMarketData"], {
  staleTime: 30000, // 30 seconds for user data
  gcTime: 300000, // 5 minutes
  refetchOnWindowFocus: false,
  retry: 2,
});

queryClient.setQueryDefaults(["market-metadata"], {
  staleTime: 300000, // 5 minutes for market metadata (changes rarely)
  gcTime: 600000, // 10 minutes
  refetchOnWindowFocus: false,
  retry: 3,
});

queryClient.setQueryDefaults(["kuriMarkets"], {
  staleTime: 10000, // 10 seconds for market data
  gcTime: 300000, // 5 minutes
  refetchOnWindowFocus: false,
  retry: 3,
});

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
