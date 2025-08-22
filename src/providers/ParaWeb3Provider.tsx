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

export const ParaWeb3Provider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const apiKey = import.meta.env.VITE_PARA_API_KEY || "";
  console.log("ParaWeb3Provider apiKey:", apiKey ? "SET" : "NOT SET");
  console.log("ParaWeb3Provider Environment:", Environment.BETA);

  return (
    <QueryClientProvider client={queryClient}>
      <ParaProvider
        paraClientConfig={{
          apiKey: apiKey,
          env: Environment.BETA,
        }}
        config={{
          appName: "Kuri Finance",
          requireEmailVerification: true, // Always require email verification for Kuri
        }}
      >
        <WagmiProvider config={config}>{children}</WagmiProvider>
      </ParaProvider>
    </QueryClientProvider>
  );
};
