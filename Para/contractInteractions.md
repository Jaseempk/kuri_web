# Interact with Contracts

> Read and write smart contract data and handle events using Web3 libraries

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

Read data from smart contracts and execute write operations using Para's wallet infrastructure.

## Prerequisites

You need Web3 libraries configured with Para authentication.

<Card title="Setup Web3 Libraries" description="Configure Ethers.js, Viem, or Wagmi with Para before proceeding" href="/v2/react/guides/web3-operations/evm/setup-libraries" />

## Read Contract Data

<Tabs>
  <Tab title="Ethers.js">
    ```typescript
    import { ethers } from "ethers";

    const CONTRACT_ABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function totalSupply() view returns (uint256)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)"
    ];

    async function readContractData(
      provider: ethers.Provider,
      contractAddress: string,
      userAddress: string
    ) {
      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        provider
      );

      const [balance, totalSupply, name, symbol, decimals] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.totalSupply(),
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      return {
        balance: ethers.formatUnits(balance, decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        name,
        symbol,
        decimals
      };
    }
    ```

  </Tab>

  <Tab title="Viem">
    ```typescript
    import { formatUnits } from "viem";

    const CONTRACT_ABI = [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ type: "uint256" }]
      },
      {
        name: "totalSupply",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint256" }]
      },
      {
        name: "name",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "string" }]
      },
      {
        name: "symbol",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "string" }]
      },
      {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint8" }]
      }
    ] as const;

    async function readContractData(
      publicClient: any,
      contractAddress: `0x${string}`,
      userAddress: `0x${string}`
    ) {
      const results = await publicClient.multicall({
        contracts: [
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "balanceOf",
            args: [userAddress]
          },
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "totalSupply"
          },
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "name"
          },
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "symbol"
          },
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "decimals"
          }
        ]
      });

      const [balance, totalSupply, name, symbol, decimals] = results.map(r => r.result);

      return {
        balance: formatUnits(balance, decimals),
        totalSupply: formatUnits(totalSupply, decimals),
        name,
        symbol,
        decimals
      };
    }
    ```

  </Tab>

  <Tab title="Wagmi">
    ```typescript
    import { useContractReads } from "wagmi";
    import { formatUnits } from "viem";

    const CONTRACT_ABI = [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ type: "uint256" }]
      },
      {
        name: "totalSupply",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint256" }]
      },
      {
        name: "name",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "string" }]
      },
      {
        name: "symbol",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "string" }]
      },
      {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint8" }]
      }
    ] as const;

    function ContractData({
      contractAddress,
      userAddress
    }: {
      contractAddress: `0x${string}`;
      userAddress: `0x${string}`;
    }) {
      const { data, isLoading } = useContractReads({
        contracts: [
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "balanceOf",
            args: [userAddress]
          },
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "totalSupply"
          },
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "name"
          },
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "symbol"
          },
          {
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: "decimals"
          }
        ]
      });

      if (isLoading) return <div>Loading...</div>;

      const [balance, totalSupply, name, symbol, decimals] =
        data?.map(d => d.result) || [];

      return (
        <div>
          <p>Token: {name} ({symbol})</p>
          <p>Balance: {formatUnits(balance || 0n, decimals || 18)}</p>
          <p>Total Supply: {formatUnits(totalSupply || 0n, decimals || 18)}</p>
        </div>
      );
    }
    ```

  </Tab>
</Tabs>

## Write Contract Data

<Tabs>
  <Tab title="Ethers.js">
    ```typescript
    const STAKING_ABI = [
      "function stake(uint256 amount) payable",
      "function unstake(uint256 amount)",
      "function getStakedBalance(address user) view returns (uint256)",
      "event Staked(address indexed user, uint256 amount)",
      "event Unstaked(address indexed user, uint256 amount)"
    ];

    async function stakeTokens(
      signer: any,
      contractAddress: string,
      amount: string,
      decimals: number
    ) {
      try {
        const contract = new ethers.Contract(
          contractAddress,
          STAKING_ABI,
          signer
        );

        const parsedAmount = ethers.parseUnits(amount, decimals);

        const tx = await contract.stake(parsedAmount);
        console.log("Staking transaction:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed");

        const stakedEvent = receipt.logs.find(
          log => log.topics[0] === contract.interface.getEvent("Staked").topicHash
        );

        if (stakedEvent) {
          const parsedEvent = contract.interface.parseLog(stakedEvent);
          console.log("Staked amount:", parsedEvent.args.amount.toString());
        }

        const newBalance = await contract.getStakedBalance(
          await signer.getAddress()
        );

        return {
          hash: tx.hash,
          stakedAmount: ethers.formatUnits(newBalance, decimals)
        };
      } catch (error) {
        console.error("Staking failed:", error);
        throw error;
      }
    }
    ```

  </Tab>

  <Tab title="Viem">
    ```typescript
    import { parseUnits, formatUnits, parseEventLogs } from "viem";

    const STAKING_ABI = [
      {
        name: "stake",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: []
      },
      {
        name: "unstake",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: []
      },
      {
        name: "getStakedBalance",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ type: "uint256" }]
      },
      {
        name: "Staked",
        type: "event",
        inputs: [
          { name: "user", type: "address", indexed: true },
          { name: "amount", type: "uint256" }
        ]
      },
      {
        name: "Unstaked",
        type: "event",
        inputs: [
          { name: "user", type: "address", indexed: true },
          { name: "amount", type: "uint256" }
        ]
      }
    ] as const;

    async function stakeTokens(
      walletClient: any,
      publicClient: any,
      account: any,
      contractAddress: `0x${string}`,
      amount: string,
      decimals: number
    ) {
      try {
        const parsedAmount = parseUnits(amount, decimals);

        const { request } = await publicClient.simulateContract({
          address: contractAddress,
          abi: STAKING_ABI,
          functionName: "stake",
          args: [parsedAmount],
          account
        });

        const hash = await walletClient.writeContract(request);
        console.log("Staking transaction:", hash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash
        });

        const logs = parseEventLogs({
          abi: STAKING_ABI,
          logs: receipt.logs
        });

        const stakedEvent = logs.find(log => log.eventName === "Staked");
        if (stakedEvent) {
          console.log("Staked amount:", stakedEvent.args.amount.toString());
        }

        const newBalance = await publicClient.readContract({
          address: contractAddress,
          abi: STAKING_ABI,
          functionName: "getStakedBalance",
          args: [account.address]
        });

        return {
          hash,
          stakedAmount: formatUnits(newBalance, decimals)
        };
      } catch (error) {
        console.error("Staking failed:", error);
        throw error;
      }
    }
    ```

  </Tab>

  <Tab title="Wagmi">
    ```typescript
    import { 
      usePrepareContractWrite, 
      useContractWrite,
      useWaitForTransaction,
      useContractRead 
    } from "wagmi";
    import { parseUnits, formatUnits } from "viem";

    const STAKING_ABI = [
      {
        name: "stake",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: []
      },
      {
        name: "getStakedBalance",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ type: "uint256" }]
      }
    ] as const;

    function StakeTokens({
      contractAddress,
      userAddress,
      decimals = 18
    }: {
      contractAddress: `0x${string}`;
      userAddress: `0x${string}`;
      decimals?: number;
    }) {
      const amount = "100";

      const { config } = usePrepareContractWrite({
        address: contractAddress,
        abi: STAKING_ABI,
        functionName: "stake",
        args: [parseUnits(amount, decimals)]
      });

      const {
        write: stake,
        data: txData,
        isLoading: isStaking
      } = useContractWrite(config);

      const { isLoading: isConfirming } = useWaitForTransaction({
        hash: txData?.hash
      });

      const { data: stakedBalance } = useContractRead({
        address: contractAddress,
        abi: STAKING_ABI,
        functionName: "getStakedBalance",
        args: [userAddress],
        watch: true
      });

      return (
        <div>
          <p>Staked: {formatUnits(stakedBalance || 0n, decimals)}</p>
          <button
            onClick={() => stake?.()}
            disabled={!stake || isStaking || isConfirming}
          >
            Stake {amount} Tokens
          </button>
          {txData && <p>Transaction: {txData.hash}</p>}
        </div>
      );
    }
    ```

  </Tab>
</Tabs>

## Next Steps

<CardGroup cols={3}>
  <Card title="Watch Events" description="Subscribe to and filter contract events" href="/v2/react/guides/web3-operations/evm/watch-events" icon="eye" />

  <Card title="Manage Allowances" description="Handle token approvals and allowances" href="/v2/react/guides/web3-operations/evm/manage-allowances" icon="shield-check" />

  <Card title="Get Transaction Receipt" description="Parse transaction logs and events" href="/v2/react/guides/web3-operations/evm/get-transaction-receipt" icon="receipt" />
</CardGroup>
