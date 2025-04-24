import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { connectkit } from "connectkit";

// Configure chains & providers
export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(
      `'https://api.developer.coinbase.com/rpc/v1/base-sepolia/DBytHtVTEsZ9VhQE0Zx7WvomGHot4hTI`
    ),
  },
  connectors: [connectkit()],
});
