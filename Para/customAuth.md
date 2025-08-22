# Custom Authentication UI with Para Client

> Build custom authentication UI using the Para client directly with custom React Query hooks for maximum control

export const Card = ({imgUrl, title, description, href, horizontal = false, newTab = false}) => {
const [isHovered, setIsHovered] = useState(false);
const baseImageUrl = "https://mintlify.s3-us-west-1.amazonaws.com/getpara";
const handleClick = e => {
e.preventDefault();
if (newTab) {
window.open(href, '\_blank', 'noopener,noreferrer');
} else {
window.location.href = href;
}
};
return <div className={`not-prose relative my-2 p-[1px] rounded-xl transition-all duration-300 ${isHovered ? 'bg-gradient-to-r from-[#FF4E00] to-[#874AE3]' : 'bg-gray-200'}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
<a href={href} onClick={handleClick} className={`not-prose flex ${horizontal ? 'flex-row' : 'flex-col'} font-normal h-full bg-white overflow-hidden w-full cursor-pointer rounded-[11px] no-underline`}>
{imgUrl && <div className={`relative overflow-hidden flex-shrink-0 ${horizontal ? 'w-[30%] rounded-l-[11px]' : 'w-full'}`} onClick={e => e.stopPropagation()}>
<img src={`${baseImageUrl}${imgUrl}`} alt={title} className="w-full h-full object-cover pointer-events-none select-none" draggable="false" />
<div className="absolute inset-0 pointer-events-none" />
</div>}
<div className={`flex-grow px-6 py-5 ${horizontal ? 'w-[70%]' : 'w-full'} flex flex-col ${horizontal && imgUrl ? 'justify-center' : 'justify-start'}`}>
{title && <h2 className="font-semibold text-base text-gray-800 m-0">{title}</h2>}
{description && <div className={`font-normal text-gray-500 re leading-6 ${horizontal || !imgUrl ? 'mt-0' : 'mt-1'}`}>
<p className="m-0 text-xs">{description}</p>
</div>}
</div>
</a>
</div>;
};

export const MethodDocs = ({name, description, parameters = [], returns, deprecated = false, since = null, async = false, static: isStatic = false, tag = null, defaultExpanded = false, id = 'method'}) => {
const [isExpanded, setIsExpanded] = useState(defaultExpanded);
const [isHovered, setIsHovered] = useState(false);
const [isCopied, setIsCopied] = useState(false);
const [hoveredParam, setHoveredParam] = useState(null);
const [hoveredReturn, setHoveredReturn] = useState(false);
const parseMethodName = fullName => {
const match = fullName.match(/^([^(]+)(\()([^)]\*)(\))$/);
if (match) {
return {
name: match[1],
openParen: match[2],
params: match[3],
closeParen: match[4]
};
}
return {
name: fullName,
openParen: '',
params: '',
closeParen: ''
};
};
const methodParts = parseMethodName(name);
const handleCopy = e => {
e.stopPropagation();
navigator.clipboard.writeText(name);
setIsCopied(true);
setTimeout(() => setIsCopied(false), 2000);
};
return <div className={`not-prose rounded-2xl border border-gray-200 overflow-hidden transition-colors duration-200 mb-6 ${isHovered ? 'bg-gray-50' : 'bg-white'}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
<button onClick={() => setIsExpanded(!isExpanded)} className="w-full bg-transparent p-6 border-none text-left cursor-pointer">
<div className="flex items-start justify-between gap-4">
<div className="flex-1 flex flex-col gap-2">
<div className="flex items-center gap-3 flex-wrap">
<div className="flex items-center gap-2">
{async && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-purple-200 text-purple-800 rounded-lg">
async
</span>}
{isStatic && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-violet-200 text-violet-900 rounded-lg">
static
</span>}
{tag && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-teal-200 text-teal-800 rounded-lg">
{tag}
</span>}
</div>

              <code className="text-lg font-mono font-semibold text-gray-900">
                <span>{methodParts.name}</span>
                <span className="text-gray-500 font-normal">{methodParts.openParen}</span>
                <span className="text-blue-600 font-normal">{methodParts.params}</span>
                <span className="text-gray-500 font-normal">{methodParts.closeParen}</span>
              </code>

              {deprecated && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-red-100 text-red-800 rounded-lg flex items-center gap-0.5">
                  ⚠ Deprecated
                </span>}
              {since && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-blue-100 text-blue-800 rounded-lg">
                  Since v{since}
                </span>}
            </div>

            <p className="text-sm text-gray-600 leading-6 m-0">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleCopy} className="p-2 bg-transparent border-none rounded-md cursor-pointer transition-colors duration-200 text-gray-500 hover:bg-gray-100" title="Copy method signature">
              {isCopied ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>}
            </button>

            <span className="text-gray-400">
              {isExpanded ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>}
            </span>
          </div>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out px-6 border-t border-gray-200 ${isExpanded ? 'max-h-[2000px] opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'}`}>
        {parameters.length > 0 && <div className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider m-0">
                Parameters
              </h3>
              <span className="text-xs text-gray-500">({parameters.length})</span>
            </div>
            <div>
              {parameters.map((param, index) => <div key={index} className={`pl-4 border-l-2 transition-colors duration-200 ${hoveredParam === index ? 'border-gray-300' : 'border-gray-200'} ${index < parameters.length - 1 ? 'mb-3' : ''}`} onMouseEnter={() => setHoveredParam(index)} onMouseLeave={() => setHoveredParam(null)}>
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <code className="font-mono text-sm font-medium text-gray-900">
                      {param.name}
                    </code>
                    <span className="text-sm text-gray-500">:</span>
                    <code className="font-mono text-sm text-blue-600 bg-transparent px-1 py-0.5 rounded-md cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-blue-700">
                      {param.type}
                    </code>
                    {param.required && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-yellow-100 text-yellow-800 rounded-lg">
                        Required
                      </span>}
                    {param.optional && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-gray-100 text-gray-600 rounded-lg">
                        Optional
                      </span>}
                  </div>
                  {param.description && <p className="text-sm text-gray-600 mt-1 mb-0">
                      {param.description}
                    </p>}
                  {param.defaultValue !== undefined && <p className="text-sm text-gray-500 mt-1">
                      Default: <code className="font-mono text-[0.625rem] bg-gray-100 px-1.5 py-0.5 rounded-lg">{param.defaultValue}</code>
                    </p>}
                </div>)}
            </div>
          </div>}

        {returns && <div className={`${parameters.length > 0 ? 'mt-6' : 'pt-6'}`}>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider m-0 mb-3">
              Returns
            </h3>
            <div className={`pl-4 border-l-2 transition-colors duration-200 ${hoveredReturn ? 'border-gray-300' : 'border-gray-200'}`} onMouseEnter={() => setHoveredReturn(true)} onMouseLeave={() => setHoveredReturn(false)}>
              <div className="flex items-baseline gap-2 mb-1">
                <code className="font-mono text-sm text-blue-600 bg-transparent px-1 py-0.5 rounded cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-blue-700">
                  {returns.type}
                </code>
              </div>
              {returns.description && <p className="text-sm text-gray-600 mt-1 mb-0">
                  {returns.description}
                </p>}
            </div>
          </div>}
      </div>
    </div>;

};

This guide covers building custom authentication UI using the Para client directly with custom React Query hooks. This approach provides maximum control over authentication flow, caching strategies, and error handling.

<Note>
  For simplified state management with pre-built hooks, see the [React Hooks Approach](guides/custom-ui-hooks).
</Note>

## Prerequisites

You must have a Para account set up with authentication methods enabled in your Developer Portal. Install the Web SDK:

```bash
npm install @getpara/web-sdk @tanstack/react-query
```

## Para Client Setup

First, create a Para client instance that you'll use throughout your application:

```tsx
import { ParaWeb } from "@getpara/web-sdk";

const PARA_API_KEY = process.env.NEXT_PUBLIC_PARA_API_KEY!;

export const para = new ParaWeb(PARA_API_KEY);
```

## Direct Client Methods

<MethodDocs
name="para.signUpOrLogIn({ auth, portalTheme?, useShortUrls? })"
description="Initiates authentication for email or phone number. Returns AuthState indicating whether user needs verification or can proceed to login."
parameters={[
{
name: "auth",
type: "{ email: string } | { phone: `+${number}` }",
required: true,
description: "Authentication method - either email or international phone number"
},
{
name: "portalTheme",
type: "Theme",
optional: true,
description: "Custom theme configuration for Para Portal URLs"
},
{
name: "useShortUrls",
type: "boolean",
optional: true,
description: "Whether to use shortened URLs for Para Portal",
defaultValue: "false"
}
]}
returns={{
  type: "Promise<AuthStateVerify | AuthStateLogin>",
  description: "Promise resolving to AuthState indicating next step in authentication flow"
}}
async={true}
since="2.0.0"
id="para-sign-up-or-log-in"
/>

<MethodDocs
name="para.verifyNewAccount({ verificationCode, portalTheme?, useShortUrls? })"
description="Verifies new account using one-time code sent via email or SMS. Returns AuthStateSignup with passkey/password URLs."
parameters={[
{
name: "verificationCode",
type: "string",
required: true,
description: "Six-digit verification code sent to user's email or phone"
},
{
name: "portalTheme",
type: "Theme",
optional: true,
description: "Custom theme configuration for Para Portal URLs"
},
{
name: "useShortUrls",
type: "boolean",
optional: true,
description: "Whether to use shortened URLs for Para Portal",
defaultValue: "false"
}
]}
returns={{
  type: "Promise<AuthStateSignup>",
  description: "Promise resolving to AuthStateSignup with passkey/password URLs for account creation"
}}
async={true}
since="2.0.0"
id="para-verify-new-account"
/>

<MethodDocs
name="para.waitForLogin({ isCanceled?, onCancel?, onPoll?, skipSessionRefresh? })"
description="Waits for login completion after opening passkey or password URL. Polls for completion and handles cancellation."
parameters={[
{
name: "isCanceled",
type: "() => boolean",
optional: true,
description: "Function to check if login process should be canceled"
},
{
name: "onCancel",
type: "() => void",
optional: true,
description: "Callback function executed when login is canceled"
},
{
name: "onPoll",
type: "() => void",
optional: true,
description: "Callback function executed on each polling interval"
},
{
name: "skipSessionRefresh",
type: "boolean",
optional: true,
description: "Whether to skip automatic session refresh after login",
defaultValue: "false"
}
]}
returns={{
  type: "Promise<{ needsWallet?: boolean; partnerId?: string }>",
  description: "Promise resolving with information about whether wallet creation is needed"
}}
async={true}
since="2.0.0"
id="para-wait-for-login"
/>

<MethodDocs
name="para.createWallet({ type?, skipDistribute? })"
description="Creates a new wallet for the authenticated user. Returns wallet object and optional recovery secret."
parameters={[
{
name: "type",
type: "TWalletType",
optional: true,
description: "Wallet type to create ('EVM' | 'SOLANA' | 'COSMOS')",
defaultValue: "'EVM'"
},
{
name: "skipDistribute",
type: "boolean",
optional: true,
description: "Whether to skip automatic token distribution to new wallet",
defaultValue: "false"
}
]}
returns={{
  type: "Promise<[Wallet, string | undefined]>",
  description: "Promise resolving to tuple of created wallet and optional recovery secret"
}}
async={true}
since="2.0.0"
id="para-create-wallet"
/>

<MethodDocs
name="para.signMessage({ walletId, messageBase64, timeoutMs?, isCanceled?, onCancel?, onPoll? })"
description="Signs a message using the specified wallet. Returns signature or URL for transaction review."
parameters={[
{
name: "walletId",
type: "string",
required: true,
description: "ID of the wallet to use for signing"
},
{
name: "messageBase64",
type: "string",
required: true,
description: "Base64-encoded message to sign"
},
{
name: "timeoutMs",
type: "number",
optional: true,
description: "Timeout in milliseconds for signing operation",
defaultValue: "120000"
},
{
name: "isCanceled",
type: "() => boolean",
optional: true,
description: "Function to check if signing should be canceled"
},
{
name: "onCancel",
type: "() => void",
optional: true,
description: "Callback function executed when signing is canceled"
},
{
name: "onPoll",
type: "() => void",
optional: true,
description: "Callback function executed on each polling interval"
}
]}
returns={{
  type: "Promise<FullSignatureRes>",
  description: "Promise resolving to signature result or transaction review URL"
}}
async={true}
since="2.0.0"
id="para-sign-message"
/>

<MethodDocs
name="para.getWallets()"
description="Retrieves all wallets associated with the current user session."
parameters={[]}
returns={{
  type: "Record<string, Wallet>",
  description: "Object mapping wallet IDs to wallet objects"
}}
since="2.0.0"
id="para-get-wallets"
/>

<MethodDocs
name="para.isFullyLoggedIn()"
description="Checks if the current user is fully authenticated and has an active session."
parameters={[]}
returns={{
  type: "Promise<boolean>",
  description: "Promise resolving to true if user is fully logged in, false otherwise"
}}
async={true}
since="2.0.0"
id="para-is-fully-logged-in"
/>

<MethodDocs
name="para.logout({ clearPregenWallets? })"
description="Signs out the current user and optionally clears pre-generated wallets from device storage."
parameters={[
{
name: "clearPregenWallets",
type: "boolean",
optional: true,
description: "Whether to clear all pre-generated wallets from device storage",
defaultValue: "false"
}
]}
returns={{
  type: "Promise<void>",
  description: "Promise that resolves when logout is complete"
}}
async={true}
since="2.0.0"
id="para-logout"
/>

## Custom Hook Implementation Examples

Here are examples of how to create custom hooks using the Para client directly with React Query:

### Authentication Hook

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { para } from "@/lib/para/client";
import type { AuthState } from "@getpara/web-sdk";

interface SignUpOrLoginParams {
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
}

export const useParaAuth = () => {
  const queryClient = useQueryClient();

  const signUpOrLoginMutation = useMutation({
    mutationFn: async ({
      email,
      phoneNumber,
      countryCode,
    }: SignUpOrLoginParams) => {
      if (email) {
        return await para.signUpOrLogIn({ auth: { email } });
      } else if (phoneNumber && countryCode) {
        const phone = `+${countryCode}${phoneNumber}` as `+${number}`;
        return await para.signUpOrLogIn({ auth: { phone } });
      }
      throw new Error("Either email or phone number is required");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paraAccount"] });
    },
  });

  const verifyAccountMutation = useMutation({
    mutationFn: async ({ verificationCode }: { verificationCode: string }) => {
      return await para.verifyNewAccount({ verificationCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paraAccount"] });
    },
  });

  const waitForLoginMutation = useMutation({
    mutationFn: async (params?: { isCanceled?: () => boolean }) => {
      return await para.waitForLogin(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paraAccount"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async (params?: { clearPregenWallets?: boolean }) => {
      return await para.logout(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  return {
    signUpOrLogin: signUpOrLoginMutation.mutate,
    signUpOrLoginAsync: signUpOrLoginMutation.mutateAsync,
    isSigningUpOrLoggingIn: signUpOrLoginMutation.isPending,
    signUpOrLoginError: signUpOrLoginMutation.error,

    verifyAccount: verifyAccountMutation.mutate,
    verifyAccountAsync: verifyAccountMutation.mutateAsync,
    isVerifyingAccount: verifyAccountMutation.isPending,
    verifyAccountError: verifyAccountMutation.error,

    waitForLogin: waitForLoginMutation.mutate,
    waitForLoginAsync: waitForLoginMutation.mutateAsync,
    isWaitingForLogin: waitForLoginMutation.isPending,
    waitForLoginError: waitForLoginMutation.error,

    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    logoutError: logoutMutation.error,
  };
};
```

### Account State Hook

```tsx
import { useQuery } from "@tanstack/react-query";
import { para } from "@/lib/para/client";

export const useParaAccount = () => {
  const { data: isLoggedIn = false, isLoading: isCheckingLogin } = useQuery({
    queryKey: ["paraAccount", "isLoggedIn"],
    queryFn: async () => {
      return await para.isFullyLoggedIn();
    },
    refetchInterval: 2000,
  });

  const { data: wallets = {}, isLoading: isLoadingWallets } = useQuery({
    queryKey: ["paraAccount", "wallets"],
    queryFn: async () => {
      return para.getWallets();
    },
    enabled: isLoggedIn,
    refetchInterval: 5000,
  });

  const walletsArray = Object.values(wallets);
  const primaryWallet =
    walletsArray.find((wallet) => wallet.type === "EVM") || walletsArray[0];

  return {
    isConnected: isLoggedIn,
    address: primaryWallet?.address,
    isLoading: isCheckingLogin || isLoadingWallets,
    wallets: walletsArray,
    primaryWallet,
  };
};
```

### Wallet Management Hook

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { para } from "@/lib/para/client";
import type { TWalletType } from "@getpara/web-sdk";

interface CreateWalletParams {
  type?: TWalletType;
  skipDistribute?: boolean;
}

export const useParaWallet = () => {
  const queryClient = useQueryClient();

  const createWalletMutation = useMutation({
    mutationFn: async ({
      type = "EVM",
      skipDistribute = false,
    }: CreateWalletParams) => {
      return await para.createWallet({ type, skipDistribute });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paraAccount", "wallets"] });
    },
  });

  return {
    createWallet: createWalletMutation.mutate,
    createWalletAsync: createWalletMutation.mutateAsync,
    isCreatingWallet: createWalletMutation.isPending,
    createWalletError: createWalletMutation.error,
    createdWallet: createWalletMutation.data,
  };
};
```

### Message Signing Hook

```tsx
import { useMutation } from "@tanstack/react-query";
import { para } from "@/lib/para/client";

interface SignMessageParams {
  message: string;
  walletId?: string;
  timeoutMs?: number;
  onPoll?: () => void;
  onCancel?: () => void;
  isCanceled?: () => boolean;
}

export const useParaSignMessage = () => {
  const signMessageMutation = useMutation({
    mutationFn: async ({
      message,
      walletId,
      timeoutMs = 120000,
      ...pollParams
    }: SignMessageParams) => {
      let targetWalletId = walletId;

      if (!targetWalletId) {
        const wallets = para.getWallets();
        const walletsArray = Object.values(wallets);
        const primaryWallet =
          walletsArray.find((w) => w.type === "EVM") || walletsArray[0];

        if (!primaryWallet) {
          throw new Error("No wallet available for signing");
        }

        targetWalletId = primaryWallet.id;
      }

      const messageBase64 = btoa(message);

      return await para.signMessage({
        walletId: targetWalletId,
        messageBase64,
        timeoutMs,
        ...pollParams,
      });
    },
  });

  return {
    signMessage: signMessageMutation.mutate,
    signMessageAsync: signMessageMutation.mutateAsync,
    isSigning: signMessageMutation.isPending,
    signError: signMessageMutation.error,
    signature: signMessageMutation.data,
  };
};
```

## Advanced Custom Hook Examples

### OAuth Authentication Hook

```tsx
import { useMutation } from "@tanstack/react-query";
import { para } from "@/lib/para/client";

export const useParaOAuth = () => {
  const oauthMutation = useMutation({
    mutationFn: async ({
      method,
      onOAuthUrl,
      onOAuthPopup,
      isCanceled,
      onCancel,
      onPoll,
    }: {
      method: "GOOGLE" | "APPLE" | "FACEBOOK" | "DISCORD" | "X";
      onOAuthUrl?: (url: string) => void;
      onOAuthPopup?: (popup: Window) => void;
      isCanceled?: () => boolean;
      onCancel?: () => void;
      onPoll?: () => void;
    }) => {
      return await para.verifyOAuth({
        method,
        onOAuthUrl,
        onOAuthPopup,
        isCanceled,
        onCancel,
        onPoll,
      });
    },
  });

  return {
    authenticateWithOAuth: oauthMutation.mutate,
    authenticateWithOAuthAsync: oauthMutation.mutateAsync,
    isAuthenticating: oauthMutation.isPending,
    authError: oauthMutation.error,
    authResult: oauthMutation.data,
  };
};
```

### Session Management Hook

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { para } from "@/lib/para/client";

export const useParaSession = () => {
  const queryClient = useQueryClient();

  const { data: sessionInfo, isLoading: isLoadingSession } = useQuery({
    queryKey: ["paraSession"],
    queryFn: async () => {
      const isLoggedIn = await para.isFullyLoggedIn();
      if (!isLoggedIn) return null;

      return {
        isActive: true,
        wallets: para.getWallets(),
        timestamp: Date.now(),
      };
    },
    refetchInterval: 30000, // Check session every 30 seconds
  });

  const refreshSessionMutation = useMutation({
    mutationFn: async () => {
      return (await para.refreshSession?.()) || true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paraSession"] });
    },
  });

  const keepAlive = () => {
    if (sessionInfo?.isActive) {
      refreshSessionMutation.mutate();
    }
  };

  return {
    sessionInfo,
    isLoadingSession,
    isSessionActive: !!sessionInfo?.isActive,
    refreshSession: refreshSessionMutation.mutate,
    isRefreshing: refreshSessionMutation.isPending,
    keepAlive,
  };
};
```

### Error Handling Hook

```tsx
import { useCallback } from "react";
import { toast } from "react-hot-toast";

export const useParaErrorHandler = () => {
  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`Para Error ${context ? `(${context})` : ""}:`, error);

    // Handle specific error types
    if (error.message.includes("network")) {
      toast.error("Network error. Please check your connection.");
    } else if (error.message.includes("unauthorized")) {
      toast.error("Authentication expired. Please log in again.");
    } else if (error.message.includes("cancelled")) {
      toast.error("Operation was cancelled.");
    } else {
      toast.error(error.message || "An unexpected error occurred.");
    }
  }, []);

  const withErrorHandling = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>, context?: string) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error as Error, context);
          return undefined;
        }
      };
    },
    [handleError]
  );

  return { handleError, withErrorHandling };
};
```

## Benefits of Direct Client Approach

1. **Full Control**: Complete control over state management and caching strategies
2. **Custom Return Interfaces**: Design return interfaces that match your application's needs
3. **Enhanced Error Handling**: Add custom error processing and retry logic
4. **Flexible Polling**: Implement custom polling behavior for long-running operations
5. **Performance Optimization**: Optimize queries and mutations for your specific use case

## Trade-offs

1. **More Boilerplate**: Requires more code to implement the same functionality
2. **Manual Cache Management**: You need to handle cache invalidation manually
3. **Type Safety**: May need to define custom TypeScript interfaces
4. **Maintenance**: More code to maintain and update as the SDK evolves

## Best Practices

1. **Centralized Client**: Create a single Para client instance and share it across your app
2. **Query Key Consistency**: Use consistent query key patterns for cache management
3. **Error Boundaries**: Implement error boundaries to catch and handle errors gracefully
4. **Loading States**: Provide clear loading states for better user experience
5. **Cache Invalidation**: Invalidate relevant queries after mutations
6. **Type Safety**: Define proper TypeScript interfaces for your custom hooks

## Next Steps

<CardGroup cols={2}>
  <Card title="React Hooks Approach" description="Use pre-built hooks for simplified state management" href="guides/custom-ui-hooks" />

  <Card title="Session Management" description="Learn about managing user sessions and JWT authentication" href="guides/sessions" />
</CardGroup>
