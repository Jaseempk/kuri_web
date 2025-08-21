# Para with React + Vite

> A guide to quickly integrate the Para Modal into your Vite-powered React application.

export const Link = ({href, label}) => {
const [isHovered, setIsHovered] = useState(false);
return <a href={href} className="not-prose inline-block relative text-black font-semibold cursor-pointer border-b-0 no-underline" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
{label}
<span className={`absolute left-0 bottom-0 w-full rounded-sm bg-gradient-to-r from-orange-600 to-purple-600 transition-all duration-300 ${isHovered ? 'h-0.5' : 'h-px'}`} />
</a>;
};

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

This guide will walk you through integrating Para SDK into your **Vite**-powered React application, providing seamless user authentication and wallet management.

## Prerequisites

Before starting, you'll need a Para API key which you can obtain from the <Link href="https://developer.getpara.com">Para Developer Portal</Link>. You can learn to create your account and get your API key from the Developer Portal.

<Card title="Setup Developer Portal" description="Get your API key and configure your developer portal settings" imgUrl="/images/updated/developer-portal-open-graph.png" href="/v2/react/guides/customization/developer-portal-setup" horizontal />

## Installation

Install the Para React SDK and React Query:

<CodeGroup>
  ```bash npm
  npm install @getpara/react-sdk@alpha @tanstack/react-query @getpara/graz@alpha @cosmjs/cosmwasm-stargate @cosmjs/launchpad @cosmjs/proto-signing @cosmjs/stargate @cosmjs/tendermint-rpc @leapwallet/cosmos-social-login-capsule-provider long starknet wagmi viem @farcaster/mini-app-solana @farcaster/miniapp-sdk @farcaster/miniapp-wagmi-connector @solana-mobile/wallet-adapter-mobile @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-walletconnect @solana/web3.js --save-exact
  ```

```bash yarn
yarn add @getpara/react-sdk@alpha @tanstack/react-query @getpara/graz@alpha @cosmjs/cosmwasm-stargate @cosmjs/launchpad @cosmjs/proto-signing @cosmjs/stargate @cosmjs/tendermint-rpc @leapwallet/cosmos-social-login-capsule-provider long starknet wagmi viem @farcaster/mini-app-solana @farcaster/miniapp-sdk @farcaster/miniapp-wagmi-connector @solana-mobile/wallet-adapter-mobile @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-walletconnect @solana/web3.js --exact
```

````bash pnpm
pnpm add @getpara/react-sdk@alpha @tanstack/react-query @getpara/graz@alpha @cosmjs/cosmwasm-stargate @cosmjs/launchpad @cosmjs/proto-signing @cosmjs/stargate @cosmjs/tendermint-rpc @leapwallet/cosmos-social-login-capsule-provider long starknet wagmi viem @farcaster/mini-app-solana @farcaster/miniapp-sdk @farcaster/miniapp-wagmi-connector @solana-mobile/wallet-adapter-mobile @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-walletconnect @solana/web3.js --save-exact

```bash bun
bun add @getpara/react-sdk@alpha @tanstack/react-query @getpara/graz@alpha @cosmjs/cosmwasm-stargate @cosmjs/launchpad @cosmjs/proto-signing @cosmjs/stargate @cosmjs/tendermint-rpc @leapwallet/cosmos-social-login-capsule-provider long starknet wagmi viem @farcaster/mini-app-solana @farcaster/miniapp-sdk @farcaster/miniapp-wagmi-connector @solana-mobile/wallet-adapter-mobile @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-walletconnect @solana/web3.js --exact
````

</CodeGroup>

## Setting Up Polyfills with Vite

Vite requires polyfills for Node.js modules that Para SDK uses. Install the polyfill plugin:

<CodeGroup>
  ```bash npm
  npm install vite-plugin-node-polyfills --save-dev
  ```

```bash yarn
yarn add vite-plugin-node-polyfills -D
```

```bash pnpm
pnpm add vite-plugin-node-polyfills -D
```

```bash bun
bun add -d vite-plugin-node-polyfills
```

</CodeGroup>

Update your `vite.config.js`:

```js vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [react(), nodePolyfills()],
});
```

## Setup Postinstall Script

Add the Para setup script to your `package.json`:

```json package.json
{
  "scripts": {
    "postinstall": "npx setup-para"
  }
}
```

## Create a Providers Component

Create a providers component that will wrap your application:

```jsx src/providers.jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Environment, ParaProvider } from "@getpara/react-sdk";
import "@getpara/react-sdk/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ParaProvider
        paraClientConfig={{
          apiKey: import.meta.env.VITE_PARA_API_KEY || "",
          env: Environment.BETA,
        }}
        config={{
          appName: "Your App Name",
        }}
      >
        {children}
      </ParaProvider>
    </QueryClientProvider>
  );
}
```

<Note>
  Para offers two hosted environments: `Environment.BETA` (alias `Environment.DEVELOPMENT`) for testing, and
  `Environment.PROD` (alias `Environment.PRODUCTION`) for live use. Select the environment that matches your current
  development phase.
</Note>

## Wrap Your App with Providers

Update your main app file:

```jsx src/App.jsx
import { Providers } from "./providers";

function App() {
  return <Providers>{/* Your app content */}</Providers>;
}

export default App;
```

<Info>
  You can learn more about the `ParaProvider` and its definition in the <Link href="/v2/react/guides/hooks/para-provider" label="ParaProvider Hooks Guide" />.
</Info>

## Create a Connect Wallet Component

Now create a component that uses Para hooks to manage wallet connection:

```jsx src/components/ConnectButton.jsx
import { useModal, useAccount } from "@getpara/react-sdk";

export function ConnectButton() {
  const { openConnectModal, openWalletModal } = useModal();
  const account = useAccount();

  return (
    <div>
      {account.isConnected && account.embedded.wallets?.length ? (
        <div>
          <p>Connected: {account.embedded.wallets[0].address}</p>
          <button onClick={openWalletModal}>Manage Wallet</button>
        </div>
      ) : (
        <button onClick={openConnectModal}>Connect Wallet</button>
      )}
    </div>
  );
}
```

<Tip>
  You can learn more about the `useModal` and `useAccount` hooks in the <Link href="/v2/react/guides/hooks/" label="React Hooks Guide" />.
</Tip>

## Example

<Card horizontal title="Vite + React Example" imgUrl="/images/updated/framework-react-vite.png" href="https://github.com/getpara/examples-hub/tree/2.0.0-alpha/web/with-react-vite" description="See a complete Vite React example with Para SDK integration." />

## Next Steps

Success you've set up Para with Vite! Now you can expand your application with wallet connections, account management, and more.

<CardGroup cols={3}>
  <Card title="Build with React Hooks" description="Access account data and wallet operations" imgUrl="/images/updated/general-hooks.png" href="/v2/react/guides/hooks" icon="code" />

  <Card title="Sign Messages & Transactions" description="Learn to sign messages and send transactions" imgUrl="/images/updated/general-signing.png" href="/v2/react/guides/web3-operations/sign-with-para" icon="signature" />

  <Card title="Customize Your Setup" description="Theme the modal and configure advanced options" imgUrl="/images/updated/general-customize.png" href="/v2/react/guides/customization/modal" icon="palette" />
</CardGroup>
