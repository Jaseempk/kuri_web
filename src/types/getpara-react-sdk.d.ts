// TypeScript declarations for @getpara/react-sdk alpha version
// This file provides type definitions for the Para SDK hooks and components

declare module "@getpara/react-sdk" {
  import { ReactNode } from "react";

  // Account hook return type
  export interface UseAccountReturn {
    isConnected: boolean;
    isLoading: boolean;
    connectionType: 'embedded' | 'external' | 'both' | 'none';
    embedded: {
      isConnected: boolean;
      userId?: string;
      authType?: 'email' | 'phone' | 'farcaster' | 'telegram' | 'externalWallet';
      email?: string;
      wallets?: Array<{
        id: string;
        address: string;
        [key: string]: any;
      }>;
    };
    external: {
      connectedNetworks: Array<'evm' | 'cosmos' | 'solana'>;
      evm: { isConnected: boolean; address?: string; };
      cosmos: { isConnected: boolean; };
      solana: { isConnected: boolean; publicKey?: any; };
    };
    user?: {
      email?: string;
    };
  }

  // Modal hook return type
  export interface UseModalReturn {
    isOpen: boolean;
    openModal: ({ step }?: { step?: string }) => void;
    closeModal: () => void;
  }

  // Sign message hook return type
  export interface UseSignMessageReturn {
    signMessage: (params: { 
      walletId: string; 
      messageBase64: string;
    }) => void;
    signMessageAsync: (params: { 
      walletId: string; 
      messageBase64: string;
    }) => Promise<{ signature: string }>;
    isPending: boolean;
    error: Error | null;
    data?: { signature: string };
  }

  // Wallet hook return type
  export interface UseWalletReturn {
    data?: {
      id: string;
      address: string;
    };
  }

  // Environment enum
  export enum Environment {
    BETA = "beta",
    PROD = "prod"
  }

  // Provider props
  export interface ParaProviderProps {
    children: ReactNode;
    paraClientConfig: {
      apiKey: string;
      env?: Environment;
    };
    config?: {
      appName?: string;
      requireEmailVerification?: boolean;
    };
  }

  // Viem client hook return type
  export interface UseViemClientReturn {
    viemClient: any | undefined; // Viem Client type
    isLoading: boolean;
  }

  // Viem account hook return type
  export interface UseViemAccountReturn {
    viemAccount: any | undefined; // Viem Account type
    isLoading: boolean;
  }

  // Hook exports
  export function useAccount(): UseAccountReturn;
  export function useModal(): UseModalReturn;
  export function useSignMessage(): UseSignMessageReturn;
  export function useWallet(): UseWalletReturn;
  export function useViemClient(config?: {
    address?: `0x${string}`;
    walletClientConfig?: any;
  }): UseViemClientReturn;
  export function useViemAccount(): UseViemAccountReturn;

  // Component exports
  export const ParaProvider: React.ComponentType<ParaProviderProps>;

  // Default export (ParaWeb)
  const ParaWeb: any;
  export default ParaWeb;
}

// Para SDK EVM submodule declarations
declare module "@getpara/react-sdk/evm" {
  // Viem account hook return type with proper Para SDK structure
  export interface UseViemAccountReturn {
    viemAccount: {
      address: `0x${string}`;
      nonceManager?: any;
      sign?: (parameters: { hash: `0x${string}` }) => Promise<`0x${string}`>;
      signAuthorization?: (parameters: any) => Promise<any>;
      signMessage: (parameters: { message: any }) => Promise<`0x${string}`>;
      signTransaction: (transaction: any, options?: any) => Promise<`0x${string}`>;
      signTypedData: (parameters: any) => Promise<`0x${string}`>;
      publicKey: `0x${string}`;
      source: string;
      type: "local";
    } | null | undefined;
    isLoading: boolean;
  }

  // EVM-specific hooks
  export function useViemAccount(params?: { address?: `0x${string}` }): UseViemAccountReturn;
  export function useViemClient(config?: any): any;
}