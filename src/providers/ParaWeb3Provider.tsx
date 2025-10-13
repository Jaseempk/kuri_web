import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ParaProvider, Environment } from "@getpara/react-sdk";
import "@getpara/react-sdk/styles.css";
import { config } from "../config/wagmi"; // Use same config as existing

// Reuse existing query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000,
      gcTime: 300000,
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

// Same query defaults as existing
queryClient.setQueryDefaults(["userMarketData"], {
  staleTime: 30000,
  gcTime: 300000,
  refetchOnWindowFocus: false,
  retry: 2,
});

queryClient.setQueryDefaults(["market-metadata"], {
  staleTime: 300000,
  gcTime: 600000,
  refetchOnWindowFocus: false,
  retry: 3,
});

queryClient.setQueryDefaults(["kuriMarkets"], {
  staleTime: 10000,
  gcTime: 300000,
  refetchOnWindowFocus: false,
  retry: 3,
});

// Auth query defaults for optimized auth flow
queryClient.setQueryDefaults(["auth"], {
  staleTime: 30 * 1000, // 30 seconds for auth-critical data
  gcTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false, // Prevent excessive refetching
  retry: (failureCount, error) => failureCount < 2,
});

// Legacy profile query defaults (for backwards compatibility during migration)
queryClient.setQueryDefaults(["user-profile-smart"], {
  staleTime: 30 * 1000, // 30 seconds for auth-critical data
  gcTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
  retry: 2, // More retries for mobile reliability
});

// Cache invalidation utility for auth flows
export const invalidateAuthCache = () => {
  queryClient.invalidateQueries({ queryKey: ["auth"] });
};

// Export query client for advanced cache operations
export { queryClient };

export const ParaWeb3Provider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const apiKey = import.meta.env.VITE_PARA_API_KEY || "";

  return (
    <QueryClientProvider client={queryClient}>
      <ParaProvider
        paraClientConfig={{
          apiKey: apiKey,
          env: Environment.BETA,
        }}
        config={{
          appName: "Kuri Finance",
        }}
        paraModalConfig={{
          oAuthMethods: [], // Disable all OAuth methods (Google, Apple, Facebook, etc.)
          disableEmailLogin: false, // Keep email enabled
          disablePhoneLogin: false, // Keep phone enabled
        }}
      >
        <WagmiProvider config={config}>{children}</WagmiProvider>
      </ParaProvider>
    </QueryClientProvider>
  );
};
