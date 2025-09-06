import { createConfig, http } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";

import { ParaWeb } from "@getpara/web-sdk";
import { paraConnector } from "@getpara/wagmi-v2-integration";

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;
const WALLET_CONNECT_PROJECT_ID = import.meta.env
  .VITE_WALLET_CONNECT_PROJECT_ID;
const PARA_API_KEY = import.meta.env.VITE_PARA_API_KEY;
const NETWORK = import.meta.env.VITE_NETWORK || "mainnet";

if (!ALCHEMY_API_KEY) {
  throw new Error("Missing ALCHEMY_API_KEY environment variable");
}

if (!WALLET_CONNECT_PROJECT_ID) {
  throw new Error("Missing WALLET_CONNECT_PROJECT_ID environment variable");
}

const para = new ParaWeb(PARA_API_KEY);

// Define chains you want to support - always include both for flexibility
const chains = [baseSepolia, base] as const;

// Create Para connector with required parameters
const connector = paraConnector({
  para,
  chains: [...chains],
  appName: "Kuri App",
  options: {},
});

// Create config with modern transports approach
export const config = createConfig({
  chains,
  connectors: [connector as any],
  transports: {
    // Testnet RPC
    [baseSepolia.id]: http(
      `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ),
    // Mainnet RPC - using same API key for both
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
  },
});
