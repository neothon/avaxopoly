import { buildSettlementPayload, type GameSession } from "@avaxopoly/shared";
import { Wallet, getBytes, hashMessage, parseUnits, solidityPackedKeccak256 } from "ethers";

import type { ServerConfig } from "./config";

function toUnits(amount: number) {
  return parseUnits(amount.toFixed(2), 18);
}

export function settlementDigest(session: GameSession, config: ServerConfig): string {
  const payload = buildSettlementPayload(session);
  if (!config.gameBankAddress) {
    throw new Error("GAME_BANK_ADDRESS is required for settlement signing.");
  }

  return solidityPackedKeccak256(
    ["address", "uint256", "bytes32", "address", "uint256", "uint256", "uint256", "uint256"],
    [
      config.gameBankAddress,
      config.chainId,
      payload.sessionId,
      payload.playerAddress,
      toUnits(payload.payouts.AVAX),
      toUnits(payload.payouts.COQ),
      toUnits(payload.payouts.KET),
      toUnits(payload.payouts.NOCHILL)
    ]
  );
}

export async function signSettlement(session: GameSession, config: ServerConfig) {
  const payload = buildSettlementPayload(session);
  if (!config.gameBankSignerPrivateKey) {
    return payload;
  }

  const signer = new Wallet(config.gameBankSignerPrivateKey);
  const digest = settlementDigest(session, config);
  const signature = await signer.signMessage(getBytes(digest));
  return {
    ...payload,
    signature,
    digest,
    signer: signer.address,
    messageHash: hashMessage(getBytes(digest))
  };
}

