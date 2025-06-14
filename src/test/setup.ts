import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock wagmi
vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: "0x1234567890123456789012345678901234567890",
    isConnected: true,
  }),
  useNetwork: () => ({
    chain: {
      id: 84532, // base-sepolia
      name: "Base Sepolia",
    },
  }),
  usePublicClient: () => ({
    getBalance: vi.fn(),
    getBlockNumber: vi.fn(),
  }),
  http: vi.fn(),
  createConfig: vi.fn(),
  WagmiConfig: ({ children }: { children: React.ReactNode }) => children,
  getAccount: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890",
    connector: null,
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
    isReconnecting: false,
    status: "connected",
  })),
}));

// Mock getAccount and readContract from @wagmi/core
vi.mock("@wagmi/core", () => ({
  getAccount: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890",
    connector: null,
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
    isReconnecting: false,
    status: "connected",
  })),
  readContract: vi.fn(() => Promise.resolve({})),
}));

// Mock ConnectKitProvider and getDefaultConfig
vi.mock("connectkit", () => ({
  ConnectKitProvider: ({ children }: { children: React.ReactNode }) => children,
  getDefaultConfig: vi.fn(() => ({})),
}));

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: vi.fn(),
      insert: vi.fn(),
    }),
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      }),
    },
  }),
}));

// Mock Apollo Client
vi.mock("@apollo/client", () => ({
  ApolloClient: vi.fn(),
  InMemoryCache: vi.fn(),
  ApolloProvider: ({ children }: { children: React.ReactNode }) => children,
  gql: (template: TemplateStringsArray) => template[0],
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock environment variables
vi.mock("../config/env", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-key",
  ALCHEMY_API_KEY: "test-key",
  WALLET_CONNECT_PROJECT_ID: "test-id",
  SUBGRAPH_URL: "https://test.subgraph.url",
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
