export const kuriABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "marketId",
        type: "string",
      },
    ],
    name: "getKuriData",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "kuriAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalParticipantsCount",
            type: "uint256",
          },
          {
            internalType: "uint8",
            name: "state",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "nextRaffleTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "nextIntervalDepositTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "launchPeriod",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
          {
            internalType: "uint8",
            name: "intervalType",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "intervalCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "currentInterval",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "winnerAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "winnerAmount",
            type: "uint256",
          },
        ],
        internalType: "struct KuriData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "intervalType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "intervalCount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "launchPeriod",
        type: "uint256",
      },
    ],
    name: "initializeKuri",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "marketId",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "marketId",
        type: "string",
      },
    ],
    name: "claimWinnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
