export const KuriFactoryABI = [
  { inputs: [], name: "KCF__InvalidInputs", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "marketAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "intervalType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "KuriMarketDeployed",
    type: "event",
  },
  {
    inputs: [
      { internalType: "uint64", name: "kuriAmount", type: "uint64" },
      { internalType: "uint16", name: "kuriParticipantCount", type: "uint16" },
      { internalType: "uint8", name: "intervalType", type: "uint8" },
    ],
    name: "initialiseKuriMarket",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
