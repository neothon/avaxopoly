import {
  activateSession,
  advanceGameTurn,
  buildSettlementPayload,
  createSession,
  registerDeposit,
  resolveHumanDecision,
  sessionSnapshot,
  swapTokens,
  type GameSession,
  type TokenLedger,
  type TokenSymbol
} from "@avaxopoly/shared";
import { Interface, JsonRpcProvider, ZeroAddress, parseUnits } from "ethers";
import { randomBytes } from "node:crypto";

import type { ServerConfig } from "./config";
import { GAME_BANK_ABI } from "./gameBankAbi";
import { signSettlement } from "./settlement";

interface DepositInput {
  token: TokenSymbol;
  amount: number;
  txHash?: string;
}

export class SessionStore {
  private readonly sessions = new Map<string, GameSession>();

  private readonly provider?: JsonRpcProvider;

  private readonly depositInterface = new Interface(GAME_BANK_ABI);

  constructor(private readonly config: ServerConfig) {
    if (config.rpcUrl) {
      this.provider = new JsonRpcProvider(config.rpcUrl);
    }
  }

  create(playerAddress: string, playerName?: string) {
    const sessionId = `0x${randomBytes(32).toString("hex")}`;
    const session = createSession({
      id: sessionId,
      playerAddress,
      playerName,
      config: {
        swapRates: this.config.swapRates
      }
    });
    this.sessions.set(session.id, session);
    return sessionSnapshot(session);
  }

  get(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }
    return sessionSnapshot(session);
  }

  async activate(sessionId: string, deposits: DepositInput[]) {
    const session = this.requireSession(sessionId);
    const human = session.players[0];
    if (!human?.address) {
      throw new Error("Human address missing from session.");
    }

    const verified = await this.verifyDeposits(sessionId, human.address, deposits);
    const ledger = deposits.reduce<TokenLedger>(
      (accumulator, deposit) => {
        accumulator[deposit.token] += deposit.amount;
        return accumulator;
      },
      {
        AVAX: 0,
        COQ: 0,
        KET: 0,
        NOCHILL: 0
      }
    );

    verified.forEach((deposit) => registerDeposit(session, deposit.token, deposit.amount, deposit.txHash));
    activateSession(session, ledger);
    return sessionSnapshot(session);
  }

  play(sessionId: string) {
    const session = this.requireSession(sessionId);
    advanceGameTurn(session);
    return sessionSnapshot(session);
  }

  decide(sessionId: string, action: "buy" | "skip" | "settle-debt") {
    const session = this.requireSession(sessionId);
    resolveHumanDecision(session, action);
    return sessionSnapshot(session);
  }

  swap(sessionId: string, fromToken: TokenSymbol, toToken: TokenSymbol, amount: number) {
    const session = this.requireSession(sessionId);
    swapTokens(session, "player", fromToken, toToken, amount);
    return sessionSnapshot(session);
  }

  async settlement(sessionId: string) {
    const session = this.requireSession(sessionId);
    const signedPayload = await signSettlement(session, this.config);
    return {
      session: sessionSnapshot(session),
      settlement: signedPayload ?? buildSettlementPayload(session)
    };
  }

  private requireSession(sessionId: string): GameSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }
    return session;
  }

  private async verifyDeposits(sessionId: string, playerAddress: string, deposits: DepositInput[]) {
    if (!this.provider || !this.config.gameBankAddress) {
      return deposits;
    }

    for (const deposit of deposits) {
      if (!deposit.txHash) {
        throw new Error(`Missing tx hash for ${deposit.token} deposit verification.`);
      }
      const receipt = await this.provider.getTransactionReceipt(deposit.txHash);
      if (!receipt) {
        throw new Error(`Receipt not found for ${deposit.txHash}.`);
      }

      const expectedToken =
        deposit.token === "AVAX" ? ZeroAddress : this.config.tokenAddresses[deposit.token];

      const matchedLog = receipt.logs.find((log) => {
        if (log.address.toLowerCase() !== this.config.gameBankAddress?.toLowerCase()) {
          return false;
        }
        try {
          const parsed = this.depositInterface.parseLog(log);
          if (!parsed || parsed.name !== "DepositReceived") {
            return false;
          }
          return (
            String(parsed.args.player).toLowerCase() === playerAddress.toLowerCase() &&
            String(parsed.args.sessionId).toLowerCase() === sessionId.toLowerCase() &&
            String(parsed.args.token).toLowerCase() === expectedToken?.toLowerCase() &&
            String(parsed.args.amount) === parseUnits(deposit.amount.toFixed(2), 18).toString()
          );
        } catch {
          return false;
        }
      });

      if (!matchedLog) {
        throw new Error(`Deposit ${deposit.txHash} did not match the expected session or amount.`);
      }
    }

    return deposits;
  }
}
