# Para with Biconomy MEE and EIP-7702

## Overview

This guide demonstrates how to combine **Para's session-based authentication** with **Biconomy's MEE (Modular Execution Environment)** and **Nexus smart accounts** to enable EIP-7702 gas abstracted transactions.

You'll learn how to:

- Create smart accounts using EIP-7702 delegation
- Execute batched transactions with gas abstraction
- Use Para sessions for seamless user experience
- Handle cross-chain operations

<Info>
  **What is EIP-7702?**
  EIP-7702 allows EOAs (Externally Owned Accounts) to temporarily delegate their execution to smart contract code, enabling smart account features without deploying a separate contract.
</Info>

## Prerequisites

- Node.js 18+ installed
- Basic understanding of Ethereum and smart contracts
- Express.js server setup
- Para API key
- RPC endpoint for Arbitrum Sepolia

## Installation

Install the required dependencies:

<CodeGroup>
  ```bash npm
  npm install @biconomy/abstractjs @getpara/server-sdk @getpara/viem-v2-integration viem express
  ```

```bash yarn
yarn add @biconomy/abstractjs @getpara/server-sdk @getpara/viem-v2-integration viem express
```

```bash pnpm
pnpm add @biconomy/abstractjs @getpara/server-sdk @getpara/viem-v2-integration viem express
```

</CodeGroup>

## Environment Setup

Create a `.env` file with the following variables:

```bash .env
PARA_API_KEY=your_para_api_key
PARA_ENVIRONMENT=BETA
BICONOMY_ARBITRUM_SEPOLIA_RPC=https://arbitrum-sepolia.infura.io/v3/YOUR_INFURA_KEY
NODE_ENV=development
```

<Warning>
  Keep your API keys secure and never commit them to version control.
</Warning>

## Implementation

### Step 1: Import Dependencies

Create your handler file and import the necessary packages:

```typescript handler.ts
import type { Request, Response } from "express";

import {
  createMeeClient,
  toMultichainNexusAccount,
  getMEEVersion,
  MEEVersion,
} from "@biconomy/abstractjs";

import { Para as ParaServer, Environment } from "@getpara/server-sdk";
import { createParaAccount } from "@getpara/viem-v2-integration";

import { arbitrumSepolia } from "viem/chains";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  type LocalAccount,
  type WalletClient,
} from "viem";

import Example from "../../artifacts/Example.json";
import {
  customSignAuthorization,
  customSignMessage,
} from "../../utils/signature-utils.js";
```

### Step 2: Define Constants

Set up your contract details and Nexus implementation:

```typescript constants.ts
const EXAMPLE_CONTRACT_ADDRESS = "0x7920b6d8b07f0b9a3b96f238c64e022278db1419";
const EXAMPLE_ABI =
  Example["contracts"]["contracts/Example.sol:Example"]["abi"];

// Biconomy Nexus implementation address
const NEXUS_IMPLEMENTATION = "0x000000004F43C49e93C970E84001853a70923B03";
```

<Tip>
  The Nexus implementation address is the same across all chains. This is the smart contract code that will be delegated to your EOA.
</Tip>

### Step 3: Create the Handler Function

```typescript handler.ts
export async function biconomyEip7702SignHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = req.body.session as string | undefined;

    if (!session) {
      res.status(400).json({
        error: "Missing session",
        message: "Provide `session` in the request body.",
      });
      return;
    }

    // Environment variable validation
    const paraApiKey = process.env.PARA_API_KEY;
    const rpcUrl = process.env.BICONOMY_ARBITRUM_SEPOLIA_RPC;
    const env = (process.env.PARA_ENVIRONMENT as Environment) || Environment.BETA;

    if (!paraApiKey || !rpcUrl) {
      res.status(500).json({
        error: "Missing environment variables",
        message: "Missing required environment variables (PARA_API_KEY, BICONOMY_ARBITRUM_SEPOLIA_RPC).",
      });
      return;
    }
```

### Step 4: Initialize Para and Create Account

```typescript para-setup.ts
// Initialize Para server and import session
const para = new ParaServer(env, paraApiKey);
await para.importSession(session);

// Create Para account with custom signature methods
const viemParaAccount: LocalAccount = createParaAccount(para);
viemParaAccount.signMessage = async ({ message }) =>
  customSignMessage(para, message);
viemParaAccount.signAuthorization = async (authorization) =>
  customSignAuthorization(para, authorization);
```

### Step 5: Set Up Clients

```typescript clients.ts
// Create public client
const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(rpcUrl),
});

// Create wallet client for signing authorization
const walletClient: WalletClient = createWalletClient({
  account: viemParaAccount,
  chain: arbitrumSepolia,
  transport: http(rpcUrl),
});
```

### Step 6: Sign EIP-7702 Authorization

This is the key step that enables EIP-7702 functionality:

```typescript authorization.ts
// Sign EIP-7702 authorization to delegate to Nexus implementation
const authorization = await walletClient.signAuthorization({
  contractAddress: NEXUS_IMPLEMENTATION,
  chainId: 0, // 0 means any chain
});
```

<Info>
  Setting `chainId: 0` allows the authorization to work across any chain, providing maximum flexibility.
</Info>

### Step 7: Create Nexus Account

```typescript nexus-account.ts
// Create multichain Nexus account with EIP-7702 delegation
// Use the EOA address as accountAddress to enable EIP-7702 flow
const nexusAccount = await toMultichainNexusAccount({
  chainConfigurations: [
    {
      chain: arbitrumSepolia,
      transport: http(rpcUrl),
      version: getMEEVersion(MEEVersion.V2_1_0),
    },
  ],
  signer: walletClient,
  accountAddress: viemParaAccount.address, // Use EOA address for EIP-7702
});
```

<Warning>
  **Critical**: Set `accountAddress` to the EOA address (not undefined) to enable EIP-7702 delegation mode.
</Warning>

### Step 8: Create MEE Client and Execute Transaction

```typescript execution.ts
// Create MEE client for gasless execution
const meeClient = await createMeeClient({
  account: nexusAccount,
});

// Prepare batched calls
const calls = Array.from({ length: 5 }, (_, i) => i + 1).map((x) => ({
  to: EXAMPLE_CONTRACT_ADDRESS as `0x${string}`,
  value: 0n,
  data: encodeFunctionData({
    abi: EXAMPLE_ABI,
    functionName: "changeX",
    args: [x],
  }),
}));

// Execute the transaction using MEE with EIP-7702 delegation
const { hash } = await meeClient.execute({
  // Required for EIP-7702 flows
  authorization,
  delegate: true,

  // Optional: Specify fee token for gas abstraction
  // feeToken: {
  //   address: "0xYourERC20TokenAddress", // e.g., USDC
  //   chainId: arbitrumSepolia.id,
  // },

  instructions: [
    {
      chainId: arbitrumSepolia.id,
      calls: calls,
    },
  ],
});
```

### Step 9: Handle Response

```typescript response.ts
    // Wait for transaction receipt
    const receipt = await meeClient.waitForSupertransactionReceipt({
      hash,
      timeout: 30000,
    });

    res.status(200).json({
      message: "User operation batch sent using Biconomy MEE + Nexus EIP-7702 + Para (session-based) with viem signer.",
      nexusAccount: nexusAccount.addressOn(arbitrumSepolia.id, true),
      originalEOA: viemParaAccount.address,
      transactionHash: hash,
      receipt: {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
        status: receipt.status,
      },
      eip7702Info: {
        note: "Your EOA has been temporarily upgraded to a smart account using EIP-7702",
        sameAddress: nexusAccount.addressOn(arbitrumSepolia.id, true) === viemParaAccount.address,
        implementation: NEXUS_IMPLEMENTATION,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        error: "Biconomy EIP-7702 transaction failed",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } else {
      res.status(500).json({
        error: "Unknown error occurred",
        details: String(error),
      });
    }
  }
}
```

## Testing

### Request Format

Send a POST request to your handler endpoint:

```json
{
  "session": "your_para_session_token"
}
```

### Expected Response

```json
{
  "message": "User operation batch sent using Biconomy MEE + Nexus EIP-7702 + Para (session-based) with viem signer.",
  "nexusAccount": "0x...",
  "originalEOA": "0x...",
  "transactionHash": "0x...",
  "receipt": {
    "hash": "0x...",
    "blockNumber": "123456",
    "gasUsed": "150000",
    "status": "success"
  },
  "eip7702Info": {
    "note": "Your EOA has been temporarily upgraded to a smart account using EIP-7702",
    "sameAddress": true,
    "implementation": "0x000000004F43C49e93C970E84001853a70923B03"
  }
}
```

## Advanced Features

### Gas Abstraction with ERC-20 Tokens

Enable users to pay gas fees with any ERC-20 token:

```typescript gas-abstraction.ts
const { hash } = await meeClient.execute({
  authorization,
  delegate: true,
  feeToken: {
    address: "0xA0b86a33E6417c1c6A7e2b3a6C7Ce7B4d15E1E3A", // USDC on Arbitrum
    chainId: arbitrumSepolia.id,
  },
  instructions: [
    /* your instructions */
  ],
});
```

### Cross-Chain Execution

Execute transactions across multiple chains in a single call:

```typescript cross-chain.ts
import { optimism, base } from "viem/chains";

const nexusAccount = await toMultichainNexusAccount({
  chainConfigurations: [
    {
      chain: arbitrumSepolia,
      transport: http(rpcUrl),
      version: getMEEVersion(MEEVersion.V2_1_0),
    },
    {
      chain: optimism,
      transport: http(),
      version: getMEEVersion(MEEVersion.V2_1_0),
    },
    {
      chain: base,
      transport: http(),
      version: getMEEVersion(MEEVersion.V2_1_0),
    },
  ],
  signer: walletClient,
  accountAddress: viemParaAccount.address,
});

const { hash } = await meeClient.execute({
  authorization,
  delegate: true,
  instructions: [
    {
      chainId: arbitrumSepolia.id,
      calls: [
        /* Arbitrum calls */
      ],
    },
    {
      chainId: optimism.id,
      calls: [
        /* Optimism calls */
      ],
    },
  ],
});
```

### Runtime Parameter Injection

Use dynamic values in your transactions:

```typescript runtime-params.ts
import {
  runtimeERC20BalanceOf,
  greaterThanOrEqualTo,
} from "@biconomy/abstractjs";
import { erc20Abi } from "viem";

const runtimeInstruction = await nexusAccount.buildComposable({
  type: "default",
  data: {
    abi: erc20Abi,
    functionName: "transfer",
    chainId: arbitrumSepolia.id,
    to: "0xUSDCAddress",
    args: [
      "0xRecipientAddress",
      runtimeERC20BalanceOf({
        targetAddress: nexusAccount.addressOn(arbitrumSepolia.id, true),
        tokenAddress: "0xUSDCAddress",
        constraints: [greaterThanOrEqualTo(1n)],
      }),
    ],
  },
});
```

## Troubleshooting

<AccordionGroup>
  <Accordion title="Authorization signature fails">
    Ensure your `customSignAuthorization` function properly handles EIP-7702 authorization format:

    ```typescript
    export async function customSignAuthorization(para: ParaServer, authorization: any) {
      // Implementation should handle EIP-7702 authorization structure
      return await para.signAuthorization(authorization);
    }
    ```

  </Accordion>

  <Accordion title="Transaction fails with 'delegate: true'">
    * Verify the authorization was signed correctly
    * Ensure `accountAddress` is set to the EOA address
    * Check that the Nexus implementation address is correct
  </Accordion>

  <Accordion title="Gas estimation errors">
    Try specifying a fee token or ensure the account has sufficient balance for gas:

    ```typescript
    feeToken: {
      address: "0xYourTokenAddress",
      chainId: arbitrumSepolia.id,
    }
    ```

  </Accordion>
</AccordionGroup>
