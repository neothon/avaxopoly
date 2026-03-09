import { parseUnits } from "viem";

export const gameBankAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "sessionId", type: "bytes32" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "sessionId", type: "bytes32" },
      { internalType: "uint256", name: "payoutAvax", type: "uint256" },
      { internalType: "uint256", name: "payoutCoq", type: "uint256" },
      { internalType: "uint256", name: "payoutKet", type: "uint256" },
      { internalType: "uint256", name: "payoutNochill", type: "uint256" },
      { internalType: "bytes", name: "serverSig", type: "bytes" }
    ],
    name: "finalize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "sessionId", type: "bytes32" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export const erc20Abi = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export function toTokenUnits(amount: number) {
  return parseUnits(amount.toFixed(2), 18);
}

