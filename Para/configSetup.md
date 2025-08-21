# Configure RPC Endpoints

> Set up custom RPC endpoints and handle network switching with Web3 libraries

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

Configure custom RPC endpoints for different networks and handle network switching dynamically. This guide uses public testnet RPCs for demonstration.

## Prerequisites

You need to start with setting up your Web3 librarie clients with Para. This guide assumes you have already configured your Para instance and are ready to integrate with Ethers.js, Viem, or Wagmi.

<Card title="Setup Web3 Libraries" description="Configure Ethers.js, Viem, or Wagmi with Para before proceeding" href="/v2/react/guides/web3-operations/evm/setup-libraries" />

## Configure Custom RPC Endpoints

<Tabs>
  <Tab title="Ethers.js">
    ```typescript
    import { ethers } from "ethers";
    import { ParaEthersSigner } from "@getpara/ethers-v6-integration";

    // Public testnet RPC endpoints
    const rpcEndpoints = {
      11155111: "https://ethereum-sepolia-rpc.publicnode.com", // Sepolia
      80002: "https://polygon-amoy-bor-rpc.publicnode.com", // Polygon Amoy
      421614: "https://arbitrum-sepolia-rpc.publicnode.com", // Arbitrum Sepolia
      11155420: "https://optimism-sepolia-rpc.publicnode.com" // Optimism Sepolia
    };

    function getProvider(chainId: number) {
      const rpcUrl = rpcEndpoints[chainId];
      if (!rpcUrl) {
        throw new Error(`No RPC endpoint configured for chain ${chainId}`);
      }

      // Create provider with static network to avoid additional network calls
      return new ethers.JsonRpcProvider(rpcUrl, chainId, {
        staticNetwork: true
      });
    }

    async function switchNetwork(para: any, chainId: number) {
      const provider = getProvider(chainId);
      const signer = new ParaEthersSigner(para, provider);

      // Verify network connection
      const network = await provider.getNetwork();
      console.log("Connected to", network.name, "chain ID:", network.chainId);

      return { provider, signer };
    }
    ```

  </Tab>

  <Tab title="Viem">
    ```typescript
    import { createPublicClient, createWalletClient, http } from "viem";
    import { sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia } from "viem/chains";
    import { createParaViemClient, createParaAccount } from "@getpara/viem-v2-integration";

    // Chain configurations for testnets
    const chains = {
      11155111: sepolia,
      80002: polygonAmoy,
      421614: arbitrumSepolia,
      11155420: optimismSepolia
    };

    // Public testnet RPC endpoints
    const rpcEndpoints = {
      [sepolia.id]: "https://ethereum-sepolia-rpc.publicnode.com",
      [polygonAmoy.id]: "https://polygon-amoy-bor-rpc.publicnode.com",
      [arbitrumSepolia.id]: "https://arbitrum-sepolia-rpc.publicnode.com",
      [optimismSepolia.id]: "https://optimism-sepolia-rpc.publicnode.com"
    };

    async function switchNetwork(para: any, chainId: number) {
      const chain = chains[chainId];
      if (!chain) {
        throw new Error(`Chain ${chainId} not supported`);
      }

      // Create transport with custom RPC
      const transport = http(rpcEndpoints[chainId]);

      // Public client for reading data
      const publicClient = createPublicClient({
        chain,
        transport
      });

      // Wallet client for transactions
      const account = await createParaAccount(para);
      const walletClient = createParaViemClient(para, {
        account,
        chain,
        transport
      });

      return { publicClient, walletClient };
    }
    ```

  </Tab>

  <Tab title="Wagmi">
    ```typescript
    import { createConfig, http } from "wagmi";
    import { sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia } from "wagmi/chains";
    import { paraConnector } from "@getpara/wagmi-v2-integration";

    function createWagmiConfig(para: any) {
      // Define chains you want to support
      const chains = [sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia] as const;

      // Create Para connector
      const connector = paraConnector({
        para,
        chains,
        appName: "Your App" // Replace with your app name
      });

      // Create config with modern transports approach
      return createConfig({
        chains,
        connectors: [connector],
        transports: {
          // Public testnet RPC endpoints
          [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
          [polygonAmoy.id]: http("https://polygon-amoy-bor-rpc.publicnode.com"),
          [arbitrumSepolia.id]: http("https://arbitrum-sepolia-rpc.publicnode.com"),
          [optimismSepolia.id]: http("https://optimism-sepolia-rpc.publicnode.com")
        }
      });
    }
    ```

  </Tab>
</Tabs>

## Next Steps

<CardGroup cols={3}>
  <Card title="Query Balances" description="Check ETH and token balances across networks" href="/v2/react/guides/web3-operations/evm/query-balances" icon="coins" />

  <Card title="Send Tokens" description="Transfer assets on configured networks" href="/v2/react/guides/web3-operations/evm/send-tokens" icon="paper-plane" />

  <Card title="Estimate Gas" description="Calculate gas costs for transactions" href="/v2/react/guides/web3-operations/evm/estimate-gas" icon="gas-pump" />
</CardGroup>
