import { keccak256, toHex } from "viem";

export function generateSalt(walletId: string, index: number = 0): bigint {
  const salt = BigInt(keccak256(toHex(`${walletId}-${index}`)));
  return salt;
}