# Sponsor Transactions with Libraries

> Enable gasless transactions using paymasters with various AA providers

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

Enable gasless transactions for users with sponsored gas fees using popular AA providers + Para. This guide covers how to configure gas sponsorship with various smart account libraries.

## Prerequisites

You need a Para-enabled smart account client configured with your AA provider. Gas sponsorship is typically configured during the initial client setup.

<Card title="Setup Smart Account Libraries" description="Configure Para with your AA provider before sponsoring transactions" href="/v2/react/guides/web3-operations/evm/smart-accounts/setup-libraries" />

## Sponsor Transactions

<Tabs>
  <Tab title="Alchemy">
    ```typescript
    import { createModularAccountAlchemyClient } from "@account-kit/smart-contracts";
    import { WalletClientSigner } from "@aa-sdk/core";
    import { alchemy } from "@account-kit/infra";

    // Gas sponsorship is enabled via the policyId parameter
    const client = await createModularAccountAlchemyClient({
      transport: alchemy({ rpcUrl: ALCHEMY_RPC_URL }),
      chain: CHAIN,
      signer: walletClientSigner, // Para-enabled WalletClientSigner
      policyId: GAS_POLICY_ID,    // ← Enables gas sponsorship
      salt,
    });

    // The gas is automatically sponsored based on your policy
    const userOpHash = await client.sendUserOperation({
      uo: {
        target: "0x...",          // Recipient address
        data: "0x",               // Transaction data
        value: 0n                 // ETH value to send
      }
    });

    // Wait for the transaction to be mined
    const receipt = await client.waitForUserOperationReceipt({ hash: userOpHash });
    ```

  </Tab>

  <Tab title="Biconomy">
    ```typescript
    import { createSmartAccountClient } from '@biconomy/account';

    // Gas sponsorship is enabled via the paymasterUrl parameter
    const smartAccountClient = await createSmartAccountClient({
      signer: walletClient,       // Para-enabled WalletClient
      chainId: chain.id,
      bundlerUrl,
      paymasterUrl,               // ← Enables gas sponsorship
    });

    // Specify SPONSORED mode in paymasterServiceData
    const transaction = {
      to: "0x...",                // Recipient address
      data: "0x",                 // Transaction data
      value: "0"                  // ETH value as string
    };

    const userOpResponse = await smartAccountClient.sendTransaction(
      transaction,
      {
        paymasterServiceData: {
          mode: "SPONSORED"       // ← Request gas sponsorship
        }
      }
    );

    const receipt = await userOpResponse.wait();
    ```

  </Tab>

  <Tab title="Gelato">
    ```typescript
    import { createGelatoSmartWalletClient } from "@gelatonetwork/smartwallet";

    // Gas sponsorship is enabled via the Gelato API key
    const smartWalletClient = await createGelatoSmartWalletClient(
      walletClient,               // Para-enabled WalletClient with kernel account
      {
        apiKey: GELATO_API_KEY,   // ← Enables gas sponsorship
      }
    );

    // Gas is automatically sponsored when using the smart wallet client
    const txHash = await smartWalletClient.sendTransaction({
      to: "0x...",                // Recipient address
      value: 0n,                  // ETH value to send
      data: "0x"                  // Transaction data
    });

    // Wait for the transaction to be mined
    const receipt = await smartWalletClient.waitForTransactionReceipt({
      hash: txHash
    });
    ```

  </Tab>

  <Tab title="Pimlico">
    ```typescript
    import { createSmartAccountClient } from "permissionless";
    import { createPimlicoClient } from "permissionless/clients/pimlico";

    // Create Pimlico client for paymaster operations
    const pimlicoClient = createPimlicoClient({
      transport: http(PIMLICO_URL),
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7"
      }
    });

    // Include paymaster in smart account client
    const smartAccountClient = createSmartAccountClient({
      account: simpleSmartAccount,  // Para-enabled smart account
      chain: CHAIN,
      bundlerTransport: http(PIMLICO_URL),
      paymaster: pimlicoClient,     // ← Enables gas sponsorship
      userOperation: {
        estimateFeesPerGas: async () => {
          return (await pimlicoClient.getUserOperationGasPrice()).fast
        }
      }
    });

    // Gas is automatically sponsored via the paymaster
    const userOpHash = await smartAccountClient.sendUserOperation({
      calls: [{
        to: "0x...",                // Recipient address
        value: 0n,                  // ETH value to send
        data: "0x"                  // Transaction data
      }]
    });

    // Wait for the transaction to be mined
    const receipt = await smartAccountClient.waitForUserOperationReceipt({
      hash: userOpHash
    });
    ```

  </Tab>

  <Tab title="Safe">
    ```typescript
    import { createSmartAccountClient } from "permissionless";
    import { toSafeSmartAccount } from "permissionless/accounts";
    import { createPimlicoClient } from "permissionless/clients/pimlico";

    // Safe uses Pimlico as the paymaster provider
    const pimlicoClient = createPimlicoClient({
      transport: http(PIMLICO_URL),
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7"
      }
    });

    const smartAccountClient = createSmartAccountClient({
      account: safeAccount,         // Para-enabled Safe account
      chain: CHAIN,
      bundlerTransport: http(PIMLICO_URL),
      paymaster: pimlicoClient,     // ← Enables gas sponsorship
      userOperation: {
        estimateFeesPerGas: async () => {
          return (await pimlicoClient.getUserOperationGasPrice()).fast
        }
      }
    });

    // Gas is automatically sponsored via the paymaster
    const userOpHash = await smartAccountClient.sendUserOperation({
      calls: [{
        to: "0x...",                // Recipient address
        value: 0n,                  // ETH value to send
        data: "0x"                  // Transaction data
      }]
    });

    // Wait for the transaction to be mined
    const receipt = await smartAccountClient.waitForUserOperationReceipt({
      hash: userOpHash
    });
    ```

  </Tab>

  <Tab title="Thirdweb">
    ```typescript
    import { smartWallet } from "thirdweb/wallets";
    import { sendTransaction } from "thirdweb";

    // Gas sponsorship is enabled via the sponsorGas flag
    const smartWalletConfig = smartWallet({
      chain: CHAIN,
      sponsorGas: true,             // ← Enables gas sponsorship
      factoryAddress: DEFAULT_ACCOUNT_FACTORY_V0_7,
      overrides: {
        accountSalt: salt,
      },
    });

    // Connect the smart wallet with Para as the signer
    const smartAccount = await smartWalletConfig.connect({
      client: thirdwebClient,
      personalAccount,              // Para-enabled personal account
    });

    // Gas is automatically sponsored when sponsorGas is enabled
    const transaction = {
      chain: CHAIN,
      client: thirdwebClient,
      to: "0x...",                  // Recipient address
      value: 0n,                    // ETH value to send
      data: "0x"                    // Transaction data
    };

    const result = await sendTransaction({
      transaction,
      account: smartAccount         // Uses the sponsored smart wallet
    });

    console.log("Sponsored transaction mined:", result.transactionHash);
    ```

  </Tab>

  <Tab title="ZeroDev">
    ```typescript
    import { createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodevapp/sdk";
    import { http } from "viem";

    // ZeroDev automatically sponsors gas when using their bundler URL
    const kernelClient = createKernelAccountClient({
      account: kernelAccount,       // Para-enabled kernel account
      chain: CHAIN,
      transport: http(
        `https://rpc.zerodev.app/api/v2/bundler/${ZERODEV_PROJECT_ID}`
      ),                            // ← Bundler URL includes sponsorship
    });

    // Optional: For explicit paymaster configuration
    const paymasterClient = createZeroDevPaymasterClient({
      chain: CHAIN,
      transport: http(
        `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_PROJECT_ID}`
      )
    });

    // Gas is automatically sponsored via the ZeroDev infrastructure
    const userOpHash = await kernelClient.sendUserOperation({
      callData: await kernelAccount.encodeCalls([{
        to: "0x...",                // Recipient address
        value: 0n,                  // ETH value to send
        data: "0x"                  // Transaction data
      }])
    });

    // Wait for the transaction to be mined
    const receipt = await kernelClient.waitForUserOperationReceipt({
      hash: userOpHash
    });
    ```

  </Tab>
</Tabs>

## Key Points

- **Gas sponsorship is configured during client setup** - Each provider has a specific parameter or configuration that enables sponsorship (policyId, paymasterUrl, apiKey, etc.)
- **Transactions are automatically sponsored** - Once configured, transactions sent through the smart account client will have their gas fees covered
- **No ETH required in user wallets** - Users can interact with your dApp without holding ETH for gas fees
- **Provider-specific limits may apply** - Check your provider's dashboard for sponsorship limits and policies
- **Smart Wallet Deployment** - Providers automatically handle smart wallet deployment if the account does not exist on first transaction
