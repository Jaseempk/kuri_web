# Para Email Authentication Integration TODO

## Project Overview

**Objective**: Implement Para's email authentication system alongside existing ConnectKit, then perform a progressive migration to Para-only authentication for the Kuri Finance application.

**Goal**: Eliminate Web3 friction by allowing users to sign up with email instead of requiring browser wallets, while maintaining all existing contract interaction functionality and backend integrations.

**Strategy**: Progressive implementation with ConnectKit as fallback, ensuring zero disruption to existing users and backend systems.

## Current Kuri Architecture Analysis

### Existing Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Web3**: Wagmi + ConnectKit for wallet connections
- **Chain**: Base Sepolia via Alchemy RPC
- **State Management**: Tanstack Query + Zustand
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase + Custom API for profile management

### Current User Onboarding Flow

1. **Landing Page** (`src/pages/Landing.tsx`) - Educational content + "Get Started" CTA
2. **Wallet Connection** - ConnectKit modal for wallet selection
3. **Profile Creation** (`src/pages/Onboarding.tsx`) - Username, display name, profile picture
4. **Message Signing** - Cryptographic signature for profile authentication
5. **Backend API Integration** - Profile creation with signed message verification
6. **App Access** - Markets, dashboard, circle participation

**Critical Constraint**: Backend integration and profile creation flow must remain unchanged. Para wallets must integrate seamlessly with existing API authentication and message signing patterns.

### Current Web3 Integration Points

- **Config**: `src/config/wagmi.ts` - Wagmi configuration exported for app-wide use
- **Provider**: `src/providers/Web3Provider.tsx` - Wraps app with Web3 context
- **Authentication**: `src/hooks/useApiAuth.ts` - Message signing for API calls
- **Profile Management**: `src/hooks/useUserProfile.ts` - User profile CRUD operations
- **Contract Interactions**: Multiple hooks for Kuri protocol smart contracts

### Current Pain Points

- Users must install browser wallets or mobile wallet apps
- Complex onboarding flow with multiple Web3-specific steps
- Limited to users already familiar with cryptocurrency wallets
- Support burden for wallet connection issues

## Para Architecture Understanding

### Para's Core Components

1. **2-of-2 MPC System**:

   - **User Share**: Stored securely on user's device
   - **Cloud Share**: Managed by Para in hardware security modules (HSMs)
   - **Passkey**: Bridges device security with blockchain compatibility

2. **Email-Based Identity**: Wallets linked to email addresses instead of generated addresses

3. **Universal Embedded Wallets**: Same wallet accessible across all Para-enabled applications

4. **Hardware Security**: Leverages device secure enclaves and biometric authentication

### Para's Email Authentication Flow

1. User enters email address
2. **Email verification (required for Kuri)** - User must verify email before proceeding
3. Biometric authentication setup (Face ID/Touch ID)
4. Automatic MPC wallet generation
5. **Standard Kuri profile creation flow** - Username, display name, profile picture
6. **Existing backend integration** - Same API calls and message signing as ConnectKit
7. App access with full Web3 capabilities

**Key Requirement**: Para email verification must be enforced, and the profile creation flow must remain identical to current implementation to maintain backend compatibility.

### Para's Security Benefits

- **No Single Point of Failure**: Private key never assembled in one location
- **Phishing Resistance**: Email compromise alone cannot access funds
- **Device Loss Protection**: Cloud Share enables wallet recovery
- **Censorship Resistance**: Users can export Cloud Share if needed

## Implementation Plan

### Phase 1: Infrastructure Setup (Para Alongside ConnectKit) ✅

#### 1.1 Dependency Management

- [x] **Keep ConnectKit Dependencies** - Maintain existing ConnectKit for fallback

  ```bash
  # ConnectKit remains installed
  # "connectkit": "^1.7.2" stays in package.json
  ```

- [x] **Install Para Dependencies Alongside**

  ```bash
  npm install @getpara/react-sdk@alpha @getpara/graz@alpha @cosmjs/cosmwasm-stargate @cosmjs/launchpad @cosmjs/proto-signing @cosmjs/stargate @cosmjs/tendermint-rpc @leapwallet/cosmos-social-login-capsule-provider long starknet @farcaster/mini-app-solana @farcaster/miniapp-sdk @farcaster/miniapp-wagmi-connector @solana-mobile/wallet-adapter-mobile @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-walletconnect @solana/web3.js --save-exact
  ```

- [x] **Install Vite Polyfills**
  ```bash
  npm install vite-plugin-node-polyfills --save-dev
  ```

#### 1.2 Configuration Updates

- [x] **Update `vite.config.ts`**

  ```typescript
  import { nodePolyfills } from "vite-plugin-node-polyfills";

  export default defineConfig({
    plugins: [
      react(),
      nodePolyfills({
        include: ["buffer", "crypto", "stream", "util"],
      }),
      // ... existing plugins
    ],
  });
  ```

- [x] **Add Para Postinstall Script to `package.json`**

  ```json
  {
    "scripts": {
      "postinstall": "npx setup-para"
    }
  }
  ```

- [x] **Add Para Environment Variables** (Keep existing ones)

  ```bash
  # Keep existing
  VITE_WALLET_CONNECT_PROJECT_ID=xxx
  VITE_ALCHEMY_API_KEY=xxx

  # Add for Para
  VITE_PARA_API_KEY=your_para_api_key_here
  VITE_ENABLE_PARA_AUTH=true
  VITE_PARA_REQUIRE_EMAIL_VERIFICATION=true
  ```

#### 1.3 Para Developer Portal Setup

- [x] Create account at [developer.getpara.com](https://developer.getpara.com)
- [x] Generate API key for "Kuri Finance" application
- [x] Configure application settings:
  - App name: "Kuri Finance"
  - Domain: Production domain
  - Environment: BETA for development, PROD for production
- [x] Test API key integration

### Phase 2: Build Para Provider (Parallel to ConnectKit) ✅

#### 2.1 Create New Para Provider (Separate File)

- [x] **Create `src/providers/ParaWeb3Provider.tsx` (new file, don't touch existing)**

  ```typescript
  import { WagmiProvider } from "wagmi";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { ParaProvider, Environment } from "@getpara/react-sdk";
  import "@getpara/react-sdk/styles.css";
  import { config } from "../config/wagmi"; // Use same config as existing

  // Reuse existing query client configuration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });

  // Same query defaults as existing
  queryClient.setQueryDefaults(["userMarketData"], {
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  queryClient.setQueryDefaults(["market-metadata"], {
    staleTime: 300000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    retry: 3,
  });

  queryClient.setQueryDefaults(["kuriMarkets"], {
    staleTime: 10000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 3,
  });

  export const ParaWeb3Provider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <ParaProvider
          paraClientConfig={{
            apiKey: import.meta.env.VITE_PARA_API_KEY || "",
            env: Environment.BETA,
          }}
          config={{
            appName: "Kuri Finance",
            requireEmailVerification: true, // Always require email verification for Kuri
          }}
        >
          <WagmiProvider config={config}>{children}</WagmiProvider>
        </ParaProvider>
      </QueryClientProvider>
    );
  };
  ```

#### 2.2 Keep Existing Wagmi Config Unchanged

- [x] **Verify `src/config/wagmi.ts` remains unchanged**
  ```typescript
  // Keep existing implementation exactly as is
  // This ensures all current contract interactions continue working
  // Both ConnectKit and Para wallets will use this same config
  ```

### Phase 3: Build Para Authentication Components (Separate Files) ✅

#### 3.1 Create Para Connect Button (New File)

- [x] **Create `src/components/ui/ParaConnectButton.tsx` (new file, don't modify existing)**

  ```typescript
  import { useModal, useAccount } from "@getpara/react-sdk";
  import { Button } from "./button";

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  export function ParaConnectButton() {
    const { openConnectModal, openWalletModal } = useModal();
    const account = useAccount();

    return (
      <Button
        variant="default"
        size="default"
        onClick={account.isConnected ? openWalletModal : openConnectModal}
        className="hover:bg-white hover:text-[hsl(var(--terracotta))] border border-[hsl(var(--terracotta))]"
      >
        {account.isConnected && account.embedded.wallets?.length
          ? formatAddress(account.embedded.wallets[0].address)
          : "Connect with Email"}
      </Button>
    );
  }
  ```

#### 3.2 Create Para API Authentication Hook (New File)

- [x] **Create `src/hooks/useParaApiAuth.ts` (new file for testing Para separately)**

  ```typescript
  import { useSignMessage, useWallet } from "@getpara/react-sdk";
  import { apiClient } from "../lib/apiClient";

  interface SignedAuth {
    message: string;
    signature: string;
    address: string;
  }

  export const useParaApiAuth = () => {
    const { mutateAsync: signMessage } = useSignMessage();
    const { data: wallet } = useWallet();

    const getSignedAuth = async (
      action: "create_profile" | "create_market"
    ): Promise<SignedAuth> => {
      if (!wallet?.id) {
        throw new Error("Para wallet not connected");
      }

      try {
        // Get message from backend (same API as existing)
        const { message, timestamp } = await apiClient.getAuthMessage(
          action,
          wallet.address
        );

        // Sign with Para (convert to base64 as required)
        const result = await signMessage({
          walletId: wallet.id,
          messageBase64: btoa(message),
        });

        // Return in same format as existing backend expects
        return {
          message,
          signature: result.signature,
          address: wallet.address,
        };
      } catch (error) {
        console.error("Para authentication error:", error);
        throw error;
      }
    };

    return {
      getSignedAuth,
      isConnected: !!wallet?.id,
    };
  };
  ```

#### 3.3 Create Para Profile Hook (New File)

- [x] **Create `src/hooks/useParaUserProfile.ts` (new file for testing Para profile management)**

  ```typescript
  import { useCallback } from "react";
  import { KuriUserProfile } from "../types/user";
  import { useAccount } from "@getpara/react-sdk";
  import { useParaApiAuth } from "./useParaApiAuth";
  import { apiClient } from "../lib/apiClient";
  import { formatErrorForUser } from "../utils/apiErrors";
  import { useQuery } from "@tanstack/react-query";

  export const useParaUserProfile = () => {
    const account = useAccount();
    const address = account.embedded.wallets?.[0]?.address;
    const { getSignedAuth } = useParaApiAuth();

    const {
      data: profile,
      isLoading,
      error,
      refetch: refreshProfile,
    } = useQuery({
      queryKey: ["para-user-profile", address?.toLowerCase()],
      queryFn: () => apiClient.getUserProfile(address!),
      enabled: !!address,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });

    // Same profile update flow as existing - test backend compatibility
    const updateProfile = useCallback(
      async (updates: Partial<KuriUserProfile> & { image?: File }) => {
        if (!address) return;

        try {
          // Same API flow as existing
          const { message, signature } = await getSignedAuth("create_profile");

          // Same backend API call - verify Para signatures work
          const result = await apiClient.createOrUpdateProfile({
            userAddress: address,
            username: updates.username || "",
            displayName: updates.display_name || "",
            image: updates.image,
            message,
            signature,
          });

          await refreshProfile();
          return result;
        } catch (error) {
          console.error("Error updating Para profile:", error);
          throw new Error(formatErrorForUser(error));
        }
      },
      [address, getSignedAuth, refreshProfile]
    );

    return {
      profile,
      isLoading,
      error,
      updateProfile,
      refreshProfile,
      email: account.user?.email,
    };
  };
  ```

### Phase 4: Create Para Testing Environment (Don't Touch Existing) ✅

#### 4.1 Create Para Profile Button (New File)

- [x] **Create `src/components/ui/ParaProfileButton.tsx` (new file for Para testing)**

  ```typescript
  import { Link, useLocation } from "react-router-dom";
  import { useAccount } from "@getpara/react-sdk";
  import { useParaUserProfile } from "../../hooks/useParaUserProfile";
  import { User } from "lucide-react";
  import { Button } from "./button";

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  export function ParaProfileButton() {
    const location = useLocation();
    const account = useAccount();
    const { profile, email } = useParaUserProfile();

    const address = account.embedded.wallets?.[0]?.address;

    const isProfilePath =
      location.pathname.startsWith("/u/") || location.pathname === "/me";

    return (
      <Link to="/me">
        <Button
          variant="outline"
          className={`flex items-center gap-2 hover:bg-[hsl(var(--gold))/10] ${
            isProfilePath
              ? "bg-[hsl(var(--gold))/10] text-[hsl(var(--gold))] border-[hsl(var(--gold))]"
              : "text-muted-foreground"
          }`}
        >
          {profile?.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              alt="Profile"
              className="w-6 h-6 rounded-full border border-[hsl(var(--gold))/20]"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-sm font-medium hidden md:inline">
            {profile?.display_name || email || "My Profile"}
          </span>
          {address && (
            <span className="text-sm text-muted-foreground hidden md:inline">
              ({formatAddress(address)})
            </span>
          )}
        </Button>
      </Link>
    );
  }
  ```

#### 4.2 Create Para Test App (New File)

- [x] **Create `src/ParaTestApp.tsx` (separate app for Para testing)**

  ```typescript
  import { ParaWeb3Provider } from "./providers/ParaWeb3Provider";
  import { ParaConnectButton } from "./components/ui/ParaConnectButton";
  import { ParaProfileButton } from "./components/ui/ParaProfileButton";
  import { useAccount } from "@getpara/react-sdk";

  function ParaTestContent() {
    const account = useAccount();

    return (
      <div className="min-h-screen bg-[#F9F5F1] p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#8B6F47] mb-8">
            Para Integration Test
          </h1>

          {/* Test email verification requirement */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            {account.isConnected ? (
              <div>
                <p className="text-green-600 mb-2">✓ Connected with Para</p>
                <p>Email: {account.user?.email}</p>
                <p>Address: {account.embedded.wallets?.[0]?.address}</p>
                <ParaProfileButton />
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Not connected</p>
                <ParaConnectButton />
              </div>
            )}
          </div>

          {/* Test profile creation flow */}
          {account.isConnected && (
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Testing</h2>
              <p className="text-sm text-gray-600">
                Test profile creation and API integration here
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  export function ParaTestApp() {
    return (
      <ParaWeb3Provider>
        <ParaTestContent />
      </ParaWeb3Provider>
    );
  }
  ```

#### 4.3 Add Para Test Route (Temporary)

- [x] **Add Para test route to main app for development testing**
  ```typescript
  // In main App.tsx or router setup, add temporary route:
  // /para-test -> ParaTestApp component
  // This allows testing Para integration without affecting main app
  ```

### Phase 9: Clean Migration Strategy (Single Switch)

#### 9.1 Pre-Migration Verification

- [ ] **Confirm ConnectKit Remains Fully Functional**

  - Existing users experience no changes
  - All current functionality preserved
  - No regressions in user experience

- [ ] **Complete Para Integration Readiness**
  - All Para features tested and working
  - Backend compatibility confirmed
  - Cross-platform testing completed
  - Email verification process validated

#### 9.2 Migration Execution (One-Time Switch)

- [ ] **Step 1: Update Web3Provider**

  ```typescript
  // Replace entire provider with Para-only implementation
  // Remove ConnectKit provider wrapper
  // Keep Wagmi config unchanged for contract interactions
  ```

- [ ] **Step 2: Replace ConnectButton**

  ```typescript
  // Remove ConnectKit button implementation
  // Use Para connect modal exclusively
  ```

- [ ] **Step 3: Update Account Management**

  ```typescript
  // Replace useAccount calls with Para hooks
  // Remove unified account wrapper
  // Update profile and auth hooks
  ```

- [ ] **Step 4: Remove ConnectKit Dependencies**

  ```bash
  npm uninstall connectkit
  # Remove from package.json completely
  ```

- [ ] **Step 5: Update Environment Variables**
  ```bash
  # Remove: VITE_WALLET_CONNECT_PROJECT_ID
  # Keep: VITE_PARA_API_KEY, VITE_ALCHEMY_API_KEY
  # Remove feature flags (Para becomes default)
  ```

#### 9.3 Post-Migration Validation

- [ ] Verify complete user onboarding flow works
- [ ] Test contract interactions function correctly
- [ ] Confirm profile creation and management works
- [ ] Validate API authentication functions
- [ ] Monitor for any functionality regressions
- [ ] Test email verification enforcement

#### 9.4 Rollback Plan (If Needed)

- [ ] **Immediate Rollback Strategy**

  - Revert to previous git commit
  - Restore ConnectKit dependencies via npm install
  - Switch environment variables back
  - Deploy previous working version

- [ ] **Communication Plan**
  - User notification of temporary issues
  - Clear timeline for resolution
  - Support team briefing on known issues

### Phase 10: Documentation & Communication

#### 9.1 Update Documentation

- [ ] Update README with Para integration details
- [ ] Document new environment variables
- [ ] Create migration guide for developers
- [ ] Update API documentation for Para signatures
- [ ] Document troubleshooting steps

#### 9.2 User Communication

- [ ] Create user guide for email authentication
- [ ] Explain biometric security benefits
- [ ] Document wallet recovery process
- [ ] Create FAQ for common questions
- [ ] Prepare support documentation

## Para SDK Reference

### Key Para Hooks

```typescript
import {
  useModal, // { openConnectModal, openWalletModal }
  useAccount, // Para account state and wallets
  useWallet, // Active wallet details
  useSignMessage, // Message signing functionality
  useClient, // Para client instance
} from "@getpara/react-sdk";
```

### Para Provider Configuration

```typescript
<ParaProvider
  paraClientConfig={{
    apiKey: string,
    env: Environment.BETA | Environment.PROD
  }}
  config={{
    appName: string
  }}
>
```

### Para Account Structure

```typescript
{
  isConnected: boolean,
  embedded: {
    wallets: [{
      id: string,
      address: string,
      // ... other wallet properties
    }]
  },
  user: {
    email: string,
    // ... other user properties
  }
}
```

### Para Message Signing

```typescript
const { mutateAsync: signMessage } = useSignMessage();

const result = await signMessage({
  walletId: string,
  messageBase64: string, // btoa(message)
});

// Result contains signature in Para format
```

## Files That Need Changes

### Core Infrastructure

- [ ] `src/providers/Web3Provider.tsx` - Complete rewrite for Para
- [ ] `src/config/wagmi.ts` - Simplified config export
- [x] `vite.config.ts` - Add Node.js polyfills
- [x] `package.json` - Update dependencies and scripts
- [x] `.env` files - Add Para API key

### Authentication & Accounts

- [ ] `src/components/ui/ConnectButton.tsx` - Para integration
- [ ] `src/components/ui/ProfileButton.tsx` - Display email + address
- [ ] `src/hooks/useApiAuth.ts` - Para message signing
- [ ] `src/hooks/useUserProfile.ts` - Para account integration

### UI Components

- [ ] `src/pages/Landing.tsx` - Update messaging for email auth
- [ ] `src/pages/Onboarding.tsx` - Email-focused copy
- [ ] `src/components/Layout.tsx` - Remove ConnectKit imports

### Testing & Verification

- [ ] All contract hooks - Verify compatibility with Para wallets
- [ ] All transaction flows - Test with Para signing
- [ ] All API calls - Verify Para signature format works

## Files That Stay Unchanged

### Business Logic

- [ ] All market components and logic
- [ ] All contract interaction hooks (useKuriCore, useKuriFactory, etc.)
- [ ] All data processing and market calculations
- [ ] All dashboard and activity tracking components

### Backend Integration

- [ ] API client implementation
- [ ] Backend endpoints and authentication
- [ ] Database schema and queries
- [ ] Image upload and file handling

### UI Components (Most)

- [ ] All form components (Button, Input, etc.)
- [ ] All market cards and market details
- [ ] All modals except authentication-related
- [ ] All chart and data visualization components

## Success Criteria

### Technical Success

- [ ] Users can sign up with only email address
- [ ] Wallets are automatically created via Para MPC
- [ ] All existing contract interactions work unchanged
- [ ] Message signing works for API authentication
- [ ] Profile creation and updates function correctly

### User Experience Success

- [ ] Onboarding time reduced from >2 minutes to <30 seconds
- [ ] Zero wallet installation requirements
- [ ] Biometric authentication works reliably
- [ ] Error states are clear and helpful
- [ ] Performance is equivalent to current implementation

### Business Success

- [ ] Increased conversion rates from landing page
- [ ] Reduced support tickets related to wallet connections
- [ ] Ability to onboard mainstream users unfamiliar with crypto
- [ ] Maintained security and trust in the platform

## Risk Mitigation

### Technical Risks

- **Bundle Size**: Monitor impact of Para dependencies (~5MB increase)
- **Provider Compatibility**: Ensure Wagmi works seamlessly with Para wallets
- **API Reliability**: Plan for Para service downtime scenarios
- **Message Signing**: Handle any format differences between Para and traditional wallets

### Business Risks

- **User Adoption**: Monitor conversion rates and gather user feedback
- **Para Dependency**: Evaluate vendor lock-in implications and exit strategies
- **Email Deliverability**: Ensure Para's email system works reliably across providers

### User Experience Risks

- **Device Compatibility**: Test biometric auth across different devices and browsers
- **Recovery Process**: Ensure wallet recovery works in various scenarios
- **Education**: Clearly communicate the benefits and security of MPC wallets

## Post-Launch Monitoring

### Analytics to Track

- [ ] Email signup conversion rates
- [ ] Wallet creation success rates
- [ ] Biometric authentication adoption
- [ ] Transaction success rates with Para wallets
- [ ] User support ticket volume and types

### Performance Monitoring

- [ ] Page load times with Para SDK
- [ ] Wallet connection speed
- [ ] Transaction signing latency
- [ ] API authentication performance

### User Feedback Collection

- [ ] Survey new users about onboarding experience
- [ ] Monitor support channels for Para-related issues
- [ ] Track user retention rates
- [ ] Collect feedback on biometric authentication experience

---

**Note**: This integration completely removes traditional wallet connections and replaces them with Para's email-based embedded wallets. The result is a significantly improved user experience that removes Web3 friction while maintaining full functionality and security through advanced MPC technology.
