import { type Config, createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// Create a more resilient transport with retries and longer timeout
const transport = http(
  "https://base-sepolia.g.alchemy.com/v2/txntl9XYKWyIkkmj1p0JcecUKxqt9327",
  {
    timeout: 30000, // 30 seconds
    retryCount: 3,
    retryDelay: 1000, // 1 second between retries
  }
);

const wagmiConfig = getDefaultConfig({
  appName: "Kuri Finance",
  walletConnectProjectId: "b1647c589ac18a28722c490d2f840895",
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: transport,
  },
});

export const config: Config = createConfig(wagmiConfig);
