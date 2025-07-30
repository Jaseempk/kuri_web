import { type Config, createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;
const WALLET_CONNECT_PROJECT_ID = import.meta.env
  .VITE_WALLET_CONNECT_PROJECT_ID;

if (!ALCHEMY_API_KEY) {
  throw new Error("Missing ALCHEMY_API_KEY environment variable");
}

if (!WALLET_CONNECT_PROJECT_ID) {
  throw new Error("Missing WALLET_CONNECT_PROJECT_ID environment variable");
}

// Create a more resilient transport with retries and longer timeout
const transport = http(
  `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  {
    timeout: 30000, // 30 seconds
    retryCount: 3,
    retryDelay: 1000, // 1 second between retries
  }
);

const wagmiConfig = getDefaultConfig({
  appName: "Kuri Finance",
  walletConnectProjectId: WALLET_CONNECT_PROJECT_ID,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: transport,
  },
  // Handle multiple wallet extensions gracefully
  ssr: false, // Disable server-side rendering for wallet detection
});

export const config: Config = createConfig(wagmiConfig);
