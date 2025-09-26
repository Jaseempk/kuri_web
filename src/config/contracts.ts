import { baseSepolia, base } from "viem/chains";

// Contract addresses for different networks
interface ContractAddresses {
  KuriFactory: `0x${string}`;
  KuriCore?: `0x${string}`;
  USDC: `0x${string}`;
}

interface NetworkConfig {
  addresses: ContractAddresses;
  chainId: number;
  name: string;
  blockExplorer: string;
}

// Contract addresses per network
const NETWORK_CONFIG: { [key: number]: NetworkConfig } = {
  [baseSepolia.id]: {
    addresses: {
      KuriFactory: "0xB502F83cb70d0F978EF7eF737602C140552d38f2", // V1 Factory Address (Testnet)
      USDC: "0xC129124eA2Fd4D63C1Fc64059456D8f231eBbed1", // USDC Testnet
    },
    chainId: baseSepolia.id,
    name: "Base Sepolia",
    blockExplorer: "https://sepolia.basescan.org",
  },
  [base.id]: {
    addresses: {
      KuriFactory: "0x929F118dE62d4975886D795bb9C6C321742b77fB", // V1 Factory Address (Mainnet)
      USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC Mainnet
    },
    chainId: base.id,
    name: "Base",
    blockExplorer: "https://basescan.org",
  },
};

// Helper functions
export const getContractAddress = (
  chainId: number,
  contractName: keyof ContractAddresses
): `0x${string}` => {
  const network = NETWORK_CONFIG[chainId];
  if (!network) {
    throw new Error(`Network config not found for chainId: ${chainId}`);
  }

  const address = network.addresses[contractName];
  if (!address) {
    throw new Error(
      `Contract address not found for ${contractName} on chainId: ${chainId}`
    );
  }

  return address;
};

export const getSupportedChainIds = (): number[] => {
  return Object.keys(NETWORK_CONFIG).map(Number);
};

export const isChainSupported = (chainId: number): boolean => {
  return chainId in NETWORK_CONFIG;
};

export const KURI_CONTRACT_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

// Network selection based on environment variable
export const getDefaultChainId = (): number => {
  const network = import.meta.env.VITE_NETWORK || "mainnet";
  return network === "testnet" ? baseSepolia.id : base.id;
};

export const getDefaultChain = () => {
  const network = import.meta.env.VITE_NETWORK || "mainnet";
  return network === "testnet" ? baseSepolia : base;
};

export const getNetworkConfig = (chainId: number): NetworkConfig => {
  const network = NETWORK_CONFIG[chainId];
  if (!network) {
    throw new Error(`Network config not found for chainId: ${chainId}`);
  }
  return network;
};

export const getCurrentNetworkConfig = (): NetworkConfig => {
  return getNetworkConfig(getDefaultChainId());
};
