# Sign Messages with Para

> Learn how to sign messages directly using the Para SDK without external Web3 libraries

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

Sign messages and transactions directly with Para's 2-of-2 MPC signing infrastructure. While Para provides direct signing methods, we recommend using Web3 libraries for better type safety and functionality.

## Prerequisites

Before signing messages with Para, ensure you have completed the setup and can access user wallets.

<CardGroup cols={2}>
  <Card title="Setup & Authentication" description="Install Para SDK and authenticate users" href="/v2/react/setup/nextjs" />

  <Card title="Get All Wallets" description="Learn how to retrieve user wallet IDs" href="/v2/react/guides/web3-operations/get-all-wallets" />
</CardGroup>

## Core Signing Methods

Para provides two fundamental signing methods that power all signing operations across the SDK.

### signMessage

The foundation of all Para signing operations. Signs raw bytes of any base64-encoded message using Para's 2-of-2 MPC infrastructure.

<Tabs>
  <Tab title="useSignMessage Hook">
    <MethodDocs
      name="useSignMessage()"
      description="React hook for signing messages with Para's MPC infrastructure"
      async={true}
      tag="hook"
      returns={{
      type: "UseMutationResult<FullSignatureRes>",
      description: "React Query mutation result with signMessage function"
    }}
    />

    ```tsx SignMessageExample.tsx
    import { useSignMessage, useWallet } from '@getpara/react-sdk';

    export default function SignMessageExample() {
      const { mutateAsync: signMessageAsync } = useSignMessage();
      const { data: wallet } = useWallet();

      const handleSign = async () => {
        if (!wallet) {
          console.error('No wallet available');
          return;
        }

        // Replace with your message
        const message = "Hello, Para!";
        const messageBase64 = btoa(message);

        const result = await signMessageAsync({
          walletId: wallet.id,
          messageBase64
        });

        console.log('Signature result:', result);
      };

      return (
        <button onClick={handleSign}>Sign Message</button>
      );
    }
    ```

  </Tab>

  <Tab title="signMessage with Client">
    <MethodDocs
      name="para.signMessage(params)"
      description="Signs a base64-encoded message using Para's MPC infrastructure"
      async={true}
      parameters={[
      {
        name: "params",
        type: "SignMessageParams",
        required: true,
        description: "Signing parameters object"
      },
      {
        name: "params.walletId",
        type: "string",
        required: true,
        description: "ID of the wallet to use for signing"
      },
      {
        name: "params.messageBase64",
        type: "string",
        required: true,
        description: "Base64-encoded message to sign"
      },
      {
        name: "params.timeoutMs",
        type: "number",
        optional: true,
        description: "Timeout duration in milliseconds",
        defaultValue: "120000"
      },
      {
        name: "params.cosmosSignDocBase64",
        type: "string",
        optional: true,
        description: "For Cosmos transactions, the SignDoc as base64"
      },
      {
        name: "params.isCanceled",
        type: "() => boolean",
        optional: true,
        description: "Callback to check if signing should be cancelled"
      }
    ]}
      returns={{
      type: "Promise<FullSignatureRes>",
      description: "Signature result containing the signature data"
    }}
    />

    ```tsx SignMessageWithClient.tsx
    import { useClient, useWallet } from '@getpara/react-sdk';

    export default function SignMessageWithClient() {
      const para = useClient();
      const { data: wallet } = useWallet();

      const handleSign = async () => {
        if (!wallet || !para) {
          console.error('No wallet or Para client available');
          return;
        }

        // Replace with your message
        const message = "Hello, Para!";
        const messageBase64 = btoa(message);

        const result = await para.signMessage({
          walletId: wallet.id,
          messageBase64
        });

        console.log('Signature result:', result);
      };

      return (
        <button onClick={handleSign}>Sign Message</button>
      );
    }
    ```

  </Tab>
</Tabs>

### signTransaction

Para client method for signing **EVM transactions** directly. Only supports RLP-encoded EVM transactions.

<Warning>
  Use Web3 libraries like Viem or Ethers for better type safety and transaction construction. This method is for EVM chains only and does not support Solana or Cosmos transactions.
</Warning>

<Tabs>
  <Tab title="useSignTransaction Hook">
    <MethodDocs
      name="useSignTransaction()"
      description="React hook for signing EVM transactions with Para's MPC infrastructure"
      async={true}
      tag="hook"
      deprecated={true}
      returns={{
      type: "UseMutationResult<FullSignatureRes>",
      description: "React Query mutation result with signTransaction function"
    }}
    />

    ```tsx SignTransactionExample.tsx
    import { useSignTransaction, useWallet } from '@getpara/react-sdk';

    export default function SignTransactionExample() {
      const { mutateAsync: signTransactionAsync } = useSignTransaction();
      const { data: wallet } = useWallet();

      const handleSignTx = async () => {
        if (!wallet) {
          console.error('No wallet available');
          return;
        }

        // Replace with your RLP encoded transaction
        // Use ethers or viem to construct this properly
        const rlpEncodedTx = "0xf86c0a85046c7cfe0083016dea94d1310c1e038bc12865d3d3997275b3e4737c6302880de0b6b3a7640000801ca0f1f8e1bd0770b23de7c54c062ba7a067fa79e1b2457abbb33d1d5d3da117c5ba05d8b420ae9ee4522b061b159244653d2ba6e16cb15e250539354c3d3714ea08a";
        const rlpEncodedTxBase64 = btoa(rlpEncodedTx);

        const result = await signTransactionAsync({
          walletId: wallet.id,
          rlpEncodedTxBase64,
          chainId: "1" // Ethereum mainnet
        });

        console.log('Transaction signature:', result);
      };

      return (
        <button onClick={handleSignTx}>Sign Transaction</button>
      );
    }
    ```

  </Tab>

  <Tab title="signTransaction with Client">
    <MethodDocs
      name="para.signTransaction(params)"
      description="Signs an RLP-encoded EVM transaction using Para's MPC infrastructure"
      async={true}
      deprecated={true}
      parameters={[
      {
        name: "params",
        type: "SignTransactionParams",
        required: true,
        description: "Transaction signing parameters"
      },
      {
        name: "params.walletId",
        type: "string",
        required: true,
        description: "ID of the wallet to use for signing"
      },
      {
        name: "params.rlpEncodedTxBase64",
        type: "string",
        required: true,
        description: "Base64-encoded RLP transaction"
      },
      {
        name: "params.chainId",
        type: "string",
        required: true,
        description: "EVM chain ID"
      },
      {
        name: "params.timeoutMs",
        type: "number",
        optional: true,
        description: "Timeout duration in milliseconds",
        defaultValue: "120000"
      },
      {
        name: "params.isCanceled",
        type: "() => boolean",
        optional: true,
        description: "Callback to check if signing should be cancelled"
      }
    ]}
      returns={{
      type: "Promise<FullSignatureRes>",
      description: "Signature result for the transaction"
    }}
    />

    ```tsx SignTransactionWithClient.tsx
    import { useClient, useWallet } from '@getpara/react-sdk';

    export default function SignTransactionWithClient() {
      const para = useClient();
      const { data: wallet } = useWallet();

      const handleSignTx = async () => {
        if (!wallet || !para) {
          console.error('No wallet or Para client available');
          return;
        }

        // Replace with your RLP encoded transaction
        // Use ethers or viem to construct this properly
        const rlpEncodedTx = "0xf86c0a85046c7cfe0083016dea94d1310c1e038bc12865d3d3997275b3e4737c6302880de0b6b3a7640000801ca0f1f8e1bd0770b23de7c54c062ba7a067fa79e1b2457abbb33d1d5d3da117c5ba05d8b420ae9ee4522b061b159244653d2ba6e16cb15e250539354c3d3714ea08a";
        const rlpEncodedTxBase64 = btoa(rlpEncodedTx);

        const result = await para.signTransaction({
          walletId: wallet.id,
          rlpEncodedTxBase64,
          chainId: "1" // Ethereum mainnet
        });

        console.log('Transaction signature:', result);
      };

      return (
        <button onClick={handleSignTx}>Sign Transaction</button>
      );
    }
    ```

  </Tab>
</Tabs>

## Understanding signMessage

Since `signMessage` signs raw bytes, it can sign any type of data:

- Simple text messages
- EVM transactions
- Solana transactions
- Cosmos transactions
- Typed data (EIP-712)
- Any arbitrary data structure

<Tip>
  While `signMessage` is powerful, using Web3 libraries provides type safety, proper encoding, and chain-specific functionality.
</Tip>

## Next Steps

<CardGroup cols={3}>
  <Card title="Sign with EVM Libraries" description="Use Viem, Ethers, or Web3.js for EVM chains" imgUrl="/images/updated/network-evm.png" href="/v2/react/guides/external-wallets/evm-lite" />

  <Card title="Sign with Solana Libraries" description="Use Solana Web3.js for Solana transactions" imgUrl="/images/updated/network-solana.png" href="/v2/react/guides/external-wallets/solana-lite" />

  <Card title="Sign with Cosmos Libraries" description="Use CosmJS for Cosmos ecosystem" imgUrl="/images/updated/network-cosmos.png" href="/v2/react/guides/external-wallets/cosmos-lite" />
</CardGroup>
