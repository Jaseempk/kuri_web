import { useAccount, useModal } from "@getpara/react-sdk";
import { useMemo, useEffect } from "react";

export interface ParaAccount {
  isConnected: boolean;
  isLoading: boolean;
  user?: {
    email?: string;
  };
  embedded?: {
    wallets?: Array<{
      id: string;
      address: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
}

export interface AuthenticationService {
  isConnected(): boolean;
  getAccount(): ParaAccount | null;
  openAuthModal(): void;
  openAccountModal(): void;
}

// Stable service with singleton pattern to prevent recreation
export class ParaAuthenticationService implements AuthenticationService {
  private static instance: ParaAuthenticationService | null = null;
  private account: ReturnType<typeof useAccount> | null = null;
  private modal: ReturnType<typeof useModal> | null = null;
  
  private constructor() {}
  
  static getInstance(): ParaAuthenticationService {
    if (!this.instance) {
      this.instance = new ParaAuthenticationService();
    }
    return this.instance;
  }
  
  // Update methods for hook values
  updateAccount(account: ReturnType<typeof useAccount>): void {
    this.account = account;
  }
  
  updateModal(modal: ReturnType<typeof useModal>): void {
    this.modal = modal;
  }

  isConnected(): boolean {
    return this.account?.isConnected ?? false;
  }

  getAccount(): ParaAccount | null {
    if (!this.account) return null;
    
    return {
      isConnected: this.account.isConnected ?? false,
      isLoading: this.account.isLoading ?? false,
      user: this.account.user,
      embedded: this.account.embedded,
    };
  }

  openAuthModal(): void {
    this.modal?.openModal({ step: "AUTH_MAIN" });
  }

  openAccountModal(): void {
    this.modal?.openModal({ step: "ACCOUNT_MAIN" });
  }
}

// Hook that provides the authentication service with stable reference
export function useAuthenticationService(): AuthenticationService {
  const account = useAccount();
  const modal = useModal();

  // Get stable singleton instance
  const service = useMemo(() => {
    return ParaAuthenticationService.getInstance();
  }, []);

  // Update service with current hook values
  useEffect(() => {
    service.updateAccount(account);
    service.updateModal(modal);
  }, [service, account, modal]);

  return service;
}
