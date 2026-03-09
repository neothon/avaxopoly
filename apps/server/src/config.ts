import "dotenv/config";

import { DEFAULT_GAME_CONFIG, SUPPORTED_TOKENS, type TokenSymbol } from "@avaxopoly/shared";

function requireNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return parsed;
}

export interface ServerConfig {
  port: number;
  corsOrigin: string;
  rpcUrl?: string;
  gameBankAddress?: string;
  gameBankSignerPrivateKey?: string;
  chainId: number;
  tokenAddresses: Record<Exclude<TokenSymbol, "AVAX">, string | undefined>;
  payoutCaps: Record<TokenSymbol, number>;
  swapRates: {
    COQ: number;
    KET: number;
    NOCHILL: number;
  };
}

export function loadConfig(): ServerConfig {
  return {
    port: requireNumber(process.env.PORT, 8787),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    rpcUrl: process.env.AVALANCHE_RPC_URL,
    gameBankAddress: process.env.GAME_BANK_ADDRESS,
    gameBankSignerPrivateKey: process.env.GAME_BANK_SIGNER_PRIVATE_KEY,
    chainId: requireNumber(process.env.FUJI_CHAIN_ID, 43113),
    tokenAddresses: {
      COQ: process.env.COQ_TOKEN_ADDRESS,
      KET: process.env.KET_TOKEN_ADDRESS,
      NOCHILL: process.env.NOCHILL_TOKEN_ADDRESS
    },
    payoutCaps: {
      AVAX: requireNumber(process.env.AVAX_PAYOUT_CAP, 5000),
      COQ: requireNumber(process.env.COQ_PAYOUT_CAP, 25000),
      KET: requireNumber(process.env.KET_PAYOUT_CAP, 25000),
      NOCHILL: requireNumber(process.env.NOCHILL_PAYOUT_CAP, 25000)
    },
    swapRates: {
      COQ: requireNumber(process.env.SWAP_RATE_COQ, DEFAULT_GAME_CONFIG.swapRates.COQ),
      KET: requireNumber(process.env.SWAP_RATE_KET, DEFAULT_GAME_CONFIG.swapRates.KET),
      NOCHILL: requireNumber(process.env.SWAP_RATE_NOCHILL, DEFAULT_GAME_CONFIG.swapRates.NOCHILL)
    }
  };
}

export const TOKEN_LIST = SUPPORTED_TOKENS;

