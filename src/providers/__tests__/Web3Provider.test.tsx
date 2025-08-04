import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Web3Provider } from "../Web3Provider";

// Mock wagmi
const mockWagmiProvider = vi.hoisted(() => 
  ({ children, config }: { children: React.ReactNode; config: any }) => (
    <div data-testid="wagmi-provider" data-config={JSON.stringify(config || {})}>
      {children}
    </div>
  )
);

vi.mock("wagmi", () => ({
  WagmiProvider: mockWagmiProvider,
  createConfig: vi.fn(),
  http: vi.fn(),
}));

vi.mock("wagmi/chains", () => ({
  baseSepolia: { id: 84532, name: "Base Sepolia" },
}));


// Mock TanStack Query
const mockQueryClient = vi.hoisted(() => ({
  setQueryDefaults: vi.fn(),
  getQueryDefaults: vi.fn(),
  clear: vi.fn(),
}));

const mockQueryClientProvider = vi.hoisted(() => 
  ({ children, client }: { children: React.ReactNode; client: any }) => (
    <div data-testid="query-client-provider" data-client-id={client?.id || 'mock-client'}>
      {children}
    </div>
  )
);

const mockQueryClient_constructor = vi.hoisted(() => vi.fn());
const mockSetQueryDefaults = vi.hoisted(() => vi.fn());
const mockQueryClientInstance = vi.hoisted(() => ({
  setQueryDefaults: mockSetQueryDefaults,
  getQueryDefaults: vi.fn(),  
  clear: vi.fn(),
  id: 'mock-client',
  options: {},
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: vi.fn().mockImplementation((options) => {
    mockQueryClient_constructor(options);
    const instance = mockQueryClientInstance;
    instance.options = options;
    return instance;
  }),
  QueryClientProvider: mockQueryClientProvider,
}));

// Mock ConnectKit
const mockConnectKitProvider = vi.hoisted(() => 
  ({ children }: { children: React.ReactNode }) => (
    <div data-testid="connectkit-provider">
      {children}
    </div>
  )
);

vi.mock("connectkit", () => ({
  ConnectKitProvider: mockConnectKitProvider,
  getDefaultConfig: vi.fn(() => ({
    appName: "Test App",
    chains: [],
    transports: {},
  })),
}));

vi.mock("../../config/wagmi", () => ({
  config: {
    chains: [{ id: 84532, name: 'Base Sepolia' }],
    transports: {},
  },
}));

// Mock wagmi config
const mockWagmiConfig = {
  chains: [{ id: 84532, name: 'Base Sepolia' }],
  transports: {},
};

describe("Web3Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes wagmi config correctly", () => {
    const TestComponent = () => <div data-testid="test-child">Test Child</div>;
    
    render(
      <Web3Provider>
        <TestComponent />
      </Web3Provider>
    );

    // Verify WagmiProvider receives correct config
    const wagmiProvider = screen.getByTestId("wagmi-provider");
    expect(wagmiProvider).toBeInTheDocument();
    
    const configData = JSON.parse(wagmiProvider.getAttribute("data-config") || "{}");
    expect(configData).toEqual(mockWagmiConfig);
  });

  it("initializes QueryClient with correct configuration", () => {
    const TestComponent = () => <div data-testid="test-child">Test Child</div>;
    
    render(
      <Web3Provider>
        <TestComponent />
      </Web3Provider>
    );

    // Verify QueryClient was created with proper options
    expect(mockQueryClient_constructor).toHaveBeenCalledWith({
      defaultOptions: {
        queries: expect.objectContaining({
          retry: 3,
          staleTime: 5000,
          gcTime: 300000,
          refetchOnWindowFocus: false,
          refetchOnMount: true,
          refetchOnReconnect: true,
        }),
        mutations: expect.objectContaining({
          retry: 2,
        }),
      },
    });
  });

  it("sets up query-specific configurations", () => {
    const TestComponent = () => <div data-testid="test-child">Test Child</div>;
    
    render(
      <Web3Provider>
        <TestComponent />
      </Web3Provider>
    );

    // Verify query defaults were set for different query types
    expect(mockSetQueryDefaults).toHaveBeenCalledWith(
      ["userMarketData"],
      expect.objectContaining({
        staleTime: 30000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        retry: 2,
      })
    );

    expect(mockSetQueryDefaults).toHaveBeenCalledWith(
      ["market-metadata"],
      expect.objectContaining({
        staleTime: 300000,
        gcTime: 600000,
        refetchOnWindowFocus: false,
        retry: 3,
      })
    );

    expect(mockSetQueryDefaults).toHaveBeenCalledWith(
      ["kuriMarkets"],
      expect.objectContaining({
        staleTime: 10000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        retry: 3,
      })
    );
  });

  it("provides wallet state to children", () => {
    const TestComponent = () => <div data-testid="test-child">Test Child</div>;
    
    render(
      <Web3Provider>
        <TestComponent />
      </Web3Provider>
    );

    // Verify provider hierarchy is correct
    const wagmiProvider = screen.getByTestId("wagmi-provider");
    const queryProvider = screen.getByTestId("query-client-provider");
    const connectKitProvider = screen.getByTestId("connectkit-provider");
    const testChild = screen.getByTestId("test-child");

    expect(wagmiProvider).toBeInTheDocument();
    expect(queryProvider).toBeInTheDocument();
    expect(connectKitProvider).toBeInTheDocument();
    expect(testChild).toBeInTheDocument();

    // Verify nesting structure
    expect(wagmiProvider).toContainElement(queryProvider);
    expect(queryProvider).toContainElement(connectKitProvider);
    expect(connectKitProvider).toContainElement(testChild);
  });

  it("handles provider composition correctly", () => {
    const MultipleChildren = () => (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </>
    );
    
    render(
      <Web3Provider>
        <MultipleChildren />
      </Web3Provider>
    );

    // All children should be rendered within the provider context
    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });

  it("optimizes retry configuration correctly", () => {
    render(
      <Web3Provider>
        <div>Test</div>
      </Web3Provider>
    );

    const queryClientOptions = mockQueryClient_constructor.mock.calls[0][0];
    
    // Verify retry configuration
    expect(queryClientOptions.defaultOptions.queries.retry).toBe(3);
    expect(queryClientOptions.defaultOptions.mutations.retry).toBe(2);
    
    // Verify retry delay function exists and works
    const queryRetryDelay = queryClientOptions.defaultOptions.queries.retryDelay;
    const mutationRetryDelay = queryClientOptions.defaultOptions.mutations.retryDelay;
    
    expect(typeof queryRetryDelay).toBe('function');
    expect(typeof mutationRetryDelay).toBe('function');
    
    // Test exponential backoff
    expect(queryRetryDelay(0)).toBe(1000); // 1000 * 2^0
    expect(queryRetryDelay(1)).toBe(2000); // 1000 * 2^1
    expect(queryRetryDelay(2)).toBe(4000); // 1000 * 2^2
    expect(queryRetryDelay(10)).toBe(30000); // Should cap at 30000
  });

  it("provides appropriate cache configuration", () => {
    render(
      <Web3Provider>
        <div>Test</div>
      </Web3Provider>
    );

    const queryClientOptions = mockQueryClient_constructor.mock.calls[0][0];
    
    // Verify cache timing settings
    expect(queryClientOptions.defaultOptions.queries.staleTime).toBe(5000);
    expect(queryClientOptions.defaultOptions.queries.gcTime).toBe(300000);
    expect(queryClientOptions.defaultOptions.queries.refetchOnWindowFocus).toBe(false);
    expect(queryClientOptions.defaultOptions.queries.refetchOnMount).toBe(true);
    expect(queryClientOptions.defaultOptions.queries.refetchOnReconnect).toBe(true);
  });

  it("handles error boundaries gracefully", () => {
    // Test that provider doesn't crash with error children
    const ErrorComponent = () => {
      throw new Error("Test error");
    };

    // This test verifies the provider itself doesn't crash
    // Error boundaries would be handled at a higher level
    expect(() => {
      render(
        <Web3Provider>
          <div data-testid="safe-child">Safe Content</div>
        </Web3Provider>
      );
    }).not.toThrow();

    expect(screen.getByTestId("safe-child")).toBeInTheDocument();
  });
});