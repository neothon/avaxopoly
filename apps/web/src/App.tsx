import {
  SUPPORTED_TOKENS,
  type CardDefinition,
  type GameSession,
  type SessionSnapshot,
  type TokenLedger,
  type TokenSymbol
} from "@avaxopoly/shared";
import { startTransition, useEffect, useState, useDeferredValue } from "react";
import { useAccount, useConnect, useDisconnect, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { zeroAddress } from "viem";

import { BoardScene } from "./components/BoardScene";
import { erc20Abi, gameBankAbi, toTokenUnits } from "./lib/contracts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

interface BackendConfig {
  chainId: number;
  gameBankAddress?: string;
  tokenAddresses: Record<Exclude<TokenSymbol, "AVAX">, string | undefined>;
  payoutCaps: TokenLedger;
  swapRates: { COQ: number; KET: number; NOCHILL: number };
}

interface SettlementResponse {
  settlement: {
    sessionId: string;
    playerAddress: string;
    payouts: TokenLedger;
    signature?: `0x${string}`;
  };
}

const emptyDepositForm: Record<TokenSymbol, string> = {
  AVAX: "1000",
  COQ: "250",
  KET: "200",
  NOCHILL: "200"
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ error: "Request failed." }))) as { error?: string };
    throw new Error(body.error ?? "Request failed.");
  }
  return response.json() as Promise<T>;
}

function formatLedger(ledger: TokenLedger) {
  return SUPPORTED_TOKENS.map((token) => `${token}: ${ledger[token].toFixed(2)}`).join(" | ");
}

export default function App() {
  const [backendConfig, setBackendConfig] = useState<BackendConfig>();
  const [snapshot, setSnapshot] = useState<SessionSnapshot>();
  const [depositForm, setDepositForm] = useState(emptyDepositForm);
  const [swapForm, setSwapForm] = useState<{ fromToken: TokenSymbol; toToken: TokenSymbol; amount: string }>({
    fromToken: "AVAX",
    toToken: "COQ",
    amount: "10"
  });
  const [settlement, setSettlement] = useState<SettlementResponse["settlement"]>();
  const [statusMessage, setStatusMessage] = useState<string>("Load config to begin.");
  const [busy, setBusy] = useState(false);

  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const deferredEvents = useDeferredValue(snapshot?.session.events ?? []);

  useEffect(() => {
    void request<BackendConfig>("/api/config")
      .then((data) => {
        startTransition(() => {
          setBackendConfig(data);
          setStatusMessage("Backend config loaded.");
        });
      })
      .catch((error: Error) => setStatusMessage(error.message));
  }, []);

  const session: GameSession | undefined = snapshot?.session;
  const player = session?.players.find((candidate) => candidate.id === "player");
  const cardCatalog: CardDefinition[] = snapshot
    ? [...snapshot.communityDeck, ...snapshot.rewardsDeck]
    : [];
  const latestCardEvent = session?.events.find((event) => event.type === "card" && event.cardId);
  const latestCard = cardCatalog.find((card) => card.id === latestCardEvent?.cardId);
  const latestMoment = snapshot?.moments.find(
    (moment) => moment.id === latestCard?.momentId || moment.id === latestCardEvent?.momentId
  );

  function runAction(action: () => Promise<void>) {
    return () => {
      void action().catch((error: Error) => {
        setStatusMessage(error.message);
        setBusy(false);
      });
    };
  }

  async function ensureFuji() {
    if (chainId === avalancheFuji.id) {
      return;
    }
    await switchChainAsync({ chainId: avalancheFuji.id });
  }

  async function createSession() {
    if (!address) {
      throw new Error("Connect a wallet first.");
    }
    setBusy(true);
    try {
      await ensureFuji();
      const nextSnapshot = await request<SessionSnapshot>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          playerAddress: address
        })
      });
      startTransition(() => {
        setSnapshot(nextSnapshot);
        setSettlement(undefined);
        setStatusMessage("Session created. Fund it to begin.");
      });
    } finally {
      setBusy(false);
    }
  }

  async function activateSession() {
    if (!session) {
      throw new Error("Create a session first.");
    }

    const deposits = SUPPORTED_TOKENS.map((token) => ({
      token,
      amount: Number(depositForm[token] || "0")
    })).filter((deposit) => deposit.amount > 0);

    if (!deposits.length) {
      throw new Error("Enter at least one deposit amount.");
    }

    setBusy(true);
    try {
      await ensureFuji();
      const txHashes: Array<{ token: TokenSymbol; amount: number; txHash?: `0x${string}` }> = [];

      if (backendConfig?.gameBankAddress && publicClient) {
        for (const deposit of deposits) {
          if (deposit.token !== "AVAX") {
            const tokenAddress = backendConfig.tokenAddresses[deposit.token];
            if (!tokenAddress) {
              throw new Error(`Token address missing for ${deposit.token}.`);
            }
            const approveHash = await writeContractAsync({
              abi: erc20Abi,
              address: tokenAddress as `0x${string}`,
              functionName: "approve",
              args: [backendConfig.gameBankAddress as `0x${string}`, toTokenUnits(deposit.amount)]
            });
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
          }

          const depositHash = await writeContractAsync({
            abi: gameBankAbi,
            address: backendConfig.gameBankAddress as `0x${string}`,
            functionName: "deposit",
            args: [
              session.id as `0x${string}`,
              deposit.token === "AVAX"
                ? zeroAddress
                : (backendConfig.tokenAddresses[deposit.token] as `0x${string}`),
              toTokenUnits(deposit.amount)
            ],
            value: deposit.token === "AVAX" ? toTokenUnits(deposit.amount) : undefined
          });
          await publicClient.waitForTransactionReceipt({ hash: depositHash });
          txHashes.push({ ...deposit, txHash: depositHash });
        }
      } else {
        txHashes.push(...deposits);
      }

      const nextSnapshot = await request<SessionSnapshot>(`/api/sessions/${session.id}/activate`, {
        method: "POST",
        body: JSON.stringify({
          deposits: txHashes
        })
      });
      startTransition(() => {
        setSnapshot(nextSnapshot);
        setStatusMessage(
          backendConfig?.gameBankAddress
            ? "Session activated from onchain deposits."
            : "Session activated in demo mode. Add bank config to use Fuji deposits."
        );
      });
    } finally {
      setBusy(false);
    }
  }

  async function playRound() {
    if (!session) return;
    setBusy(true);
    try {
      const nextSnapshot = await request<SessionSnapshot>(`/api/sessions/${session.id}/play`, {
        method: "POST"
      });
      startTransition(() => {
        setSnapshot(nextSnapshot);
        setStatusMessage("Round processed.");
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitDecision(action: "buy" | "skip" | "settle-debt") {
    if (!session) return;
    setBusy(true);
    try {
      const nextSnapshot = await request<SessionSnapshot>(`/api/sessions/${session.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ action })
      });
      startTransition(() => {
        setSnapshot(nextSnapshot);
        setStatusMessage(`Decision processed: ${action}.`);
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitSwap() {
    if (!session) return;
    setBusy(true);
    try {
      const nextSnapshot = await request<SessionSnapshot>(`/api/sessions/${session.id}/swap`, {
        method: "POST",
        body: JSON.stringify({
          fromToken: swapForm.fromToken,
          toToken: swapForm.toToken,
          amount: Number(swapForm.amount || "0")
        })
      });
      startTransition(() => {
        setSnapshot(nextSnapshot);
        setStatusMessage(`Swapped ${swapForm.amount} ${swapForm.fromToken}.`);
      });
    } finally {
      setBusy(false);
    }
  }

  async function fetchSettlement() {
    if (!session) return;
    setBusy(true);
    try {
      const response = await request<SettlementResponse>(`/api/sessions/${session.id}/settlement`);
      startTransition(() => {
        setSettlement(response.settlement);
        setStatusMessage("Settlement preview loaded.");
      });
    } finally {
      setBusy(false);
    }
  }

  async function finalizeOnchain() {
    if (!backendConfig?.gameBankAddress || !publicClient || !settlement?.signature) {
      throw new Error("Settlement signature or bank address missing.");
    }
    setBusy(true);
    try {
      await ensureFuji();
      const hash = await writeContractAsync({
        abi: gameBankAbi,
        address: backendConfig.gameBankAddress as `0x${string}`,
        functionName: "finalize",
        args: [
          settlement.sessionId as `0x${string}`,
          toTokenUnits(settlement.payouts.AVAX),
          toTokenUnits(settlement.payouts.COQ),
          toTokenUnits(settlement.payouts.KET),
          toTokenUnits(settlement.payouts.NOCHILL),
          settlement.signature
        ]
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatusMessage("Settlement finalized onchain.");
    } finally {
      setBusy(false);
    }
  }

  async function withdrawOnchain() {
    if (!backendConfig?.gameBankAddress || !publicClient || !settlement) {
      throw new Error("Settlement or bank address missing.");
    }
    setBusy(true);
    try {
      await ensureFuji();
      const hash = await writeContractAsync({
        abi: gameBankAbi,
        address: backendConfig.gameBankAddress as `0x${string}`,
        functionName: "withdraw",
        args: [settlement.sessionId as `0x${string}`]
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatusMessage("Withdrawal complete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Avalanche-native board game MVP</p>
          <h1>Avaxopoly</h1>
          <p className="subtitle">
            Single-player Three.js board. Offchain rules. Fuji escrow and payout.
          </p>
        </div>
        <div className="wallet-box">
          {isConnected ? (
            <>
              <span>{address}</span>
              <button onClick={() => disconnect()}>Disconnect</button>
            </>
          ) : (
            connectors.map((connector) => (
              <button key={connector.uid} onClick={() => connect({ connector })} disabled={isConnecting}>
                Connect {connector.name}
              </button>
            ))
          )}
        </div>
      </section>

      <section className="status-row">
        <span>{statusMessage}</span>
        <span>{busy ? "Working..." : "Idle"}</span>
      </section>

      <section className="layout">
        <div className="board-panel">
          <BoardScene session={session} />
        </div>

        <div className="sidebar">
          <article className="panel">
            <h2>Session</h2>
            <p>Chain: {backendConfig?.chainId ?? "loading"} | Wallet: {isConnected ? "connected" : "not connected"}</p>
            <p>Bank: {backendConfig?.gameBankAddress ?? "demo mode until configured"}</p>
            <button onClick={runAction(createSession)} disabled={!isConnected || busy}>
              Create session
            </button>
          </article>

          <article className="panel">
            <h2>Fund Session</h2>
            <p>Real-value deposits use the Fuji GameBank. Without config, this falls back to demo activation.</p>
            <div className="token-grid">
              {SUPPORTED_TOKENS.map((token) => (
                <label key={token}>
                  <span>{token}</span>
                  <input
                    value={depositForm[token]}
                    onChange={(event) =>
                      setDepositForm((current) => ({
                        ...current,
                        [token]: event.target.value
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <button onClick={runAction(activateSession)} disabled={!session || busy || !isConnected}>
              Activate session
            </button>
          </article>

          <article className="panel">
            <h2>Player Ledger</h2>
            <p>{player ? formatLedger(player.balances) : "No active player ledger yet."}</p>
            <p>Free Parking pool: {session ? session.freeParkingPool.toFixed(2) : "0.00"} AVAX</p>
            <p>Round: {session?.currentRound ?? 0}</p>
            <p>Status: {session?.status ?? "idle"}</p>
            <button onClick={runAction(playRound)} disabled={!session || session.status !== "awaiting_player_roll" || busy}>
              Play round
            </button>
          </article>

          {session?.pendingDecision?.kind === "buy-property" ? (
            <article className="panel emphasis">
              <h2>Buy Decision</h2>
              <p>
                Buy tile #{session.pendingDecision.tileIndex} for {session.pendingDecision.cost} AVAX?
              </p>
              <div className="actions">
                <button onClick={runAction(async () => submitDecision("buy"))} disabled={busy}>
                  Buy
                </button>
                <button onClick={runAction(async () => submitDecision("skip"))} disabled={busy}>
                  Skip
                </button>
              </div>
            </article>
          ) : null}

          {session?.pendingDecision?.kind === "raise-liquidity" ? (
            <article className="panel emphasis">
              <h2>Raise Liquidity</h2>
              <p>
                Owe {session.pendingDecision.debt.amount} {session.pendingDecision.debt.token} for{" "}
                {session.pendingDecision.debt.reason}.
              </p>
              <div className="token-grid">
                <label>
                  <span>From</span>
                  <select
                    value={swapForm.fromToken}
                    onChange={(event) =>
                      setSwapForm((current) => ({
                        ...current,
                        fromToken: event.target.value as TokenSymbol
                      }))
                    }
                  >
                    {SUPPORTED_TOKENS.map((token) => (
                      <option key={token}>{token}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>To</span>
                  <select
                    value={swapForm.toToken}
                    onChange={(event) =>
                      setSwapForm((current) => ({
                        ...current,
                        toToken: event.target.value as TokenSymbol
                      }))
                    }
                  >
                    {SUPPORTED_TOKENS.map((token) => (
                      <option key={token}>{token}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Amount</span>
                  <input
                    value={swapForm.amount}
                    onChange={(event) =>
                      setSwapForm((current) => ({
                        ...current,
                        amount: event.target.value
                      }))
                    }
                  />
                </label>
              </div>
              <div className="actions">
                <button onClick={runAction(submitSwap)} disabled={busy}>
                  Swap
                </button>
                <button onClick={runAction(async () => submitDecision("settle-debt"))} disabled={busy}>
                  Pay debt
                </button>
              </div>
            </article>
          ) : null}

          <article className="panel">
            <h2>Settlement</h2>
            <p>Load settlement once the session reaches game over.</p>
            <button onClick={runAction(fetchSettlement)} disabled={!session || session.status !== "game_over" || busy}>
              Preview settlement
            </button>
            {settlement ? (
              <>
                <p>{formatLedger(settlement.payouts)}</p>
                <div className="actions">
                  <button onClick={runAction(finalizeOnchain)} disabled={!settlement.signature || !backendConfig?.gameBankAddress || busy}>
                    Finalize onchain
                  </button>
                  <button onClick={runAction(withdrawOnchain)} disabled={!backendConfig?.gameBankAddress || busy}>
                    Withdraw
                  </button>
                </div>
              </>
            ) : null}
          </article>
        </div>
      </section>

      <section className="bottom-grid">
        <article className="panel card-preview">
          <h2>Last Drawn Card</h2>
          {latestCard ? (
            <div className="card-surface">
              <span className={`card-badge card-badge-${latestCard.deck}`}>
                {latestCard.deck === "community" ? "Community / FUD" : "L1 Rewards"}
              </span>
              <h3>{latestCard.title}</h3>
              <p>{latestCard.description}</p>
              {latestMoment ? <small>Moment: {latestMoment.title}</small> : null}
            </div>
          ) : (
            <p>No card drawn yet. Land on a card tile to reveal one here.</p>
          )}
        </article>

        <article className="panel">
          <h2>Turn Log</h2>
          <div className="log-list">
            {deferredEvents.map((event) => (
              <div key={event.id} className="log-item">
                <strong>{event.type}</strong>
                <span>{event.message}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Narrative Moments</h2>
          <div className="moment-list">
            {(snapshot?.moments ?? []).map((moment) => (
              <div key={moment.id} className="moment-item">
                <strong>{moment.title}</strong>
                <p>{moment.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
