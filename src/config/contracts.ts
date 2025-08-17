import { baseSepolia } from "viem/chains";

// Contract addresses for different networks
interface ContractAddresses {
  KuriFactory: `0x${string}`;
  KuriCore?: `0x${string}`;
}

interface NetworkConfig {
  addresses: ContractAddresses;
  chainId: number;
}

// Contract addresses per network
const NETWORK_CONFIG: { [key: number]: NetworkConfig } = {
  [baseSepolia.id]: {
    addresses: {
      KuriFactory: "0xFf16fe499a6EBd3e84f8e9bced54Ff8F8Bc7eC98", // V1 Factory Address
    },
    chainId: baseSepolia.id,
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
