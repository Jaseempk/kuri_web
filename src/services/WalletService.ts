import {
  getSmartWalletAddressCached,
  clearSmartWalletCache,
} from "../utils/smartWalletMapping";
import type { ParaAccount } from "./AuthenticationService";

export interface SmartWallet {
  address: `0x${string}`;
  walletId: string;
  eoaAddress: `0x${string}`;
}

export interface WalletService {
  resolveSmartWallet(
    paraAccount: ParaAccount,
    signMessageAsync: any
  ): Promise<SmartWallet>;
  getCachedAddress(walletId: string): `0x${string}` | null;
  clearCache(): void;
  onWalletResolved(callback: (wallet: SmartWallet | null) => void): () => void;
}

export class AlchemyWalletService implements WalletService {
  private listeners = new Set<(wallet: SmartWallet | null) => void>();
  private currentWallet: SmartWallet | null = null;

  async resolveSmartWallet(
    paraAccount: ParaAccount,
    signMessageAsync: any
  ): Promise<SmartWallet> {
    if (!paraAccount.embedded?.wallets?.[0]) {
      throw new Error("No embedded wallet found in Para account");
    }

    const wallet = paraAccount.embedded.wallets[0];
    const walletId = wallet.id;
    const eoaAddress = wallet.address as `0x${string}`;

    try {
      // Use existing cached resolution logic
      const smartAddress = await getSmartWalletAddressCached(
        walletId,
        eoaAddress,
        signMessageAsync
      );
      console.log("Resolved smart wallet address:", smartAddress);

      const smartWallet: SmartWallet = {
        address: smartAddress,
        walletId,
        eoaAddress,
      };

      // Update current wallet and notify listeners
      this.currentWallet = smartWallet;
      this.notifyListeners();

      return smartWallet;
    } catch (error) {
      console.error("Failed to resolve smart wallet:", error);

      // Clear current wallet on error and notify
      this.currentWallet = null;
      this.notifyListeners();

      throw error;
    }
  }

  getCachedAddress(walletId: string): `0x${string}` | null {
    // This would require extending smartWalletMapping to expose cache lookup
    // For now, return null to force resolution
    return null;
  }

  clearCache(): void {
    clearSmartWalletCache();
    this.currentWallet = null;
    this.notifyListeners();
  }

  onWalletResolved(callback: (wallet: SmartWallet | null) => void): () => void {
    this.listeners.add(callback);

    // Return cleanup function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentWallet);
      } catch (error) {
        console.error("WalletService listener error:", error);
      }
    });
  }

  // Get current wallet without resolution
  getCurrentWallet(): SmartWallet | null {
    return this.currentWallet;
  }
}

// Singleton instance
let walletServiceInstance: AlchemyWalletService | null = null;

export function getWalletService(): AlchemyWalletService {
  if (!walletServiceInstance) {
    walletServiceInstance = new AlchemyWalletService();
  }
  return walletServiceInstance;
}
