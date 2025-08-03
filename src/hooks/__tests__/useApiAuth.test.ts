import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useApiAuth } from "../useApiAuth";
import { renderWithProviders } from "../../test/utils";

// Mock wagmi hooks
const mockUseAccount = vi.hoisted(() => vi.fn());
const mockSignMessageAsync = vi.hoisted(() => vi.fn());
const mockUseSignMessage = vi.hoisted(() => vi.fn());

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: mockUseAccount,
    useSignMessage: mockUseSignMessage,
  };
});

// Mock API client
const mockApiClient = vi.hoisted(() => ({
  getAuthMessage: vi.fn(),
}));

vi.mock("../../lib/apiClient", () => ({
  apiClient: mockApiClient,
}));

describe("useApiAuth", () => {
  const mockAddress = "0x1234567890123456789012345678901234567890";
  const mockMessage = "Sign this message to authenticate: create_profile at 1234567890";
  const mockSignature = "0xabcdef123456789";
  const mockTimestamp = 1234567890;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSignMessage.mockReturnValue({
      signMessageAsync: mockSignMessageAsync,
    });
  });

  describe("when wallet is connected", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true,
      });
    });

    it("generates signed message for profile creation", async () => {
      // Setup mocks
      mockApiClient.getAuthMessage.mockResolvedValue({
        message: mockMessage,
        timestamp: mockTimestamp,
      });
      mockSignMessageAsync.mockResolvedValue(mockSignature);

      const { result } = renderHook(() => useApiAuth());

      // Test authentication
      const authPromise = result.current.getSignedAuth('create_profile');
      const authResult = await authPromise;

      // Verify API client was called correctly
      expect(mockApiClient.getAuthMessage).toHaveBeenCalledWith('create_profile', mockAddress);

      // Verify wallet signing was called
      expect(mockSignMessageAsync).toHaveBeenCalledWith({ message: mockMessage });

      // Verify returned data structure
      expect(authResult).toEqual({
        message: mockMessage,
        signature: mockSignature,
        address: mockAddress,
      });
    });

    it("generates signed message for market creation", async () => {
      const marketMessage = "Sign this message to authenticate: create_market at 1234567890";
      
      mockApiClient.getAuthMessage.mockResolvedValue({
        message: marketMessage,
        timestamp: mockTimestamp,
      });
      mockSignMessageAsync.mockResolvedValue(mockSignature);

      const { result } = renderHook(() => useApiAuth());

      const authResult = await result.current.getSignedAuth('create_market');

      expect(mockApiClient.getAuthMessage).toHaveBeenCalledWith('create_market', mockAddress);
      expect(authResult.message).toBe(marketMessage);
    });

    it("validates message format and content", async () => {
      mockApiClient.getAuthMessage.mockResolvedValue({
        message: mockMessage,
        timestamp: mockTimestamp,
      });
      mockSignMessageAsync.mockResolvedValue(mockSignature);

      const { result } = renderHook(() => useApiAuth());

      const authResult = await result.current.getSignedAuth('create_profile');

      // Verify message contains expected components
      expect(authResult.message).toContain('create_profile');
      expect(authResult.message).toContain('1234567890'); // timestamp
      expect(authResult.message).toContain('Sign this message');
      
      // Verify security parameters
      expect(authResult.signature).toBe(mockSignature);
      expect(authResult.address).toBe(mockAddress);
    });

    it("handles user rejection of signing", async () => {
      mockApiClient.getAuthMessage.mockResolvedValue({
        message: mockMessage,
        timestamp: mockTimestamp,
      });
      
      // Mock user rejection
      const userRejectionError = new Error('User rejected the request');
      mockSignMessageAsync.mockRejectedValue(userRejectionError);

      const { result } = renderHook(() => useApiAuth());

      // Should throw the rejection error
      await expect(result.current.getSignedAuth('create_profile')).rejects.toThrow('User rejected the request');
      
      // Verify API was still called (rejection happens during signing)
      expect(mockApiClient.getAuthMessage).toHaveBeenCalled();
      expect(mockSignMessageAsync).toHaveBeenCalled();
    });

    it("handles API errors gracefully", async () => {
      // Mock API failure
      const apiError = new Error('Failed to get auth message from server');
      mockApiClient.getAuthMessage.mockRejectedValue(apiError);

      const { result } = renderHook(() => useApiAuth());

      // Should propagate API error
      await expect(result.current.getSignedAuth('create_profile')).rejects.toThrow('Failed to get auth message from server');
      
      // Verify signing was never called due to API failure
      expect(mockSignMessageAsync).not.toHaveBeenCalled();
    });

    it("returns correct connection status", () => {
      const { result } = renderHook(() => useApiAuth());

      expect(result.current.isConnected).toBe(true);
    });
  });

  describe("when wallet is not connected", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      });
    });

    it("throws error when wallet not connected", async () => {
      const { result } = renderHook(() => useApiAuth());

      await expect(result.current.getSignedAuth('create_profile')).rejects.toThrow('Wallet not connected');
      
      // Verify no API calls were made
      expect(mockApiClient.getAuthMessage).not.toHaveBeenCalled();
      expect(mockSignMessageAsync).not.toHaveBeenCalled();
    });

    it("returns correct connection status", () => {
      const { result } = renderHook(() => useApiAuth());

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("error handling and recovery", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true,
      });
    });

    it("handles network timeouts", async () => {
      const timeoutError = new Error('Network timeout');
      mockApiClient.getAuthMessage.mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useApiAuth());

      await expect(result.current.getSignedAuth('create_profile')).rejects.toThrow('Network timeout');
    });

    it("handles signing failures gracefully", async () => {
      mockApiClient.getAuthMessage.mockResolvedValue({
        message: mockMessage,
        timestamp: mockTimestamp,
      });
      
      const signingError = new Error('Signing failed');
      mockSignMessageAsync.mockRejectedValue(signingError);

      const { result } = renderHook(() => useApiAuth());

      await expect(result.current.getSignedAuth('create_profile')).rejects.toThrow('Signing failed');
    });
  });
});