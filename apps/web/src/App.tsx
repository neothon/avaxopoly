import {
  SUPPORTED_TOKENS,
  type CardDefinition,
  type GameSession,
  type SessionSnapshot,
  type TokenLedger,
  type TokenSymbol
} from "@avaxopoly/shared";
import { startTransition, useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { zeroAddress } from "viem";

import { BoardScene } from "./components/BoardScene";
import { resolveArtwork, tokenIconBySymbol } from "./lib/art";
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
  AVAX: "90",
  COQ: "40",
  KET: "30",
  NOCHILL: "30"
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function randomDicePair(): [number, number] {
  return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
}

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

function tokenLabel(ledger: TokenLedger, token: TokenSymbol) {
  return `${token} ${ledger[token].toFixed(0)}`;
}

function actionTitle(session?: GameSession) {
  if (!session) {
    return "Create a session to begin.";
  }
  if (session.pendingDecision?.kind === "buy-property") {
    return "Choose whether to buy the landed tile.";
  }
  if (session.pendingDecision?.kind === "raise-liquidity") {
    return "Swap into the right token, then settle the debt.";
  }
  if (session.status === "awaiting_bot_turn") {
    return "Bots are taking their turns one at a time.";
  }
  if (session.status === "game_over") {
    return "The session is over. Preview and settle the final payout.";
  }
  return "Roll dice to advance the round.";
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
  const [showLog, setShowLog] = useState(true);
  const [showStory, setShowStory] = useState(true);
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
  const [showCardReveal, setShowCardReveal] = useState(false);
  const [activeReveal, setActiveReveal] = useState<{ kind: "card" | "property"; eventId: string }>();
  const [rollAnimation, setRollAnimation] = useState<{
    actor: string;
    values: [number, number];
    phase: "rolling" | "frozen";
  }>();
  const snapshotRef = useRef<SessionSnapshot>();
  const botLoopPausedByCardRef = useRef(false);

  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

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
  const activeRevealEvent = activeReveal
    ? session?.events.find((event) => event.id === activeReveal.eventId)
    : undefined;
  const revealedCard = cardCatalog.find((card) => card.id === activeRevealEvent?.cardId);
  const revealedPurchaseTile =
    activeReveal?.kind === "property" && activeRevealEvent?.tileIndex !== undefined
      ? session?.board.find((tile) => tile.index === activeRevealEvent.tileIndex)
      : undefined;
  const latestHighlightCard = cardCatalog.find((card) => card.id === latestCardEvent?.cardId);
  const latestRevealMoment = snapshot?.moments.find(
    (moment) => moment.id === revealedCard?.momentId || moment.id === activeRevealEvent?.momentId || moment.id === revealedPurchaseTile?.momentIds?.[0]
  );
  const pendingBuyTile =
    session?.pendingDecision?.kind === "buy-property"
      ? session.board.find((tile) => tile.index === session.pendingDecision.tileIndex)
      : undefined;
  const buyTileArt = resolveArtwork({
    tileName: pendingBuyTile?.name,
    momentId: pendingBuyTile?.momentIds?.[0]
  });
  const cardArt = resolveArtwork({
    cardTitle: revealedCard?.title,
    momentId: revealedCard?.momentId,
    eventMessage: activeRevealEvent?.message
  });
  const purchaseArt = resolveArtwork({
    tileName: revealedPurchaseTile?.name,
    momentId: revealedPurchaseTile?.momentIds?.[0],
    eventMessage: activeRevealEvent?.message
  });
  const storyEvents =
    session?.events
      .filter((event) => {
        if (activeReveal?.eventId && event.id === activeReveal.eventId) {
          return false;
        }
        if (
          event.cardId ||
          event.momentId ||
          event.type === "purchase" ||
          (event.type === "info" && event.tileIndex !== undefined && event.message.includes("passed on"))
        ) {
          return true;
        }
        if (event.tileIndex === undefined) {
          return false;
        }
        const tile = session.board.find((candidate) => candidate.index === event.tileIndex);
        return Boolean(tile?.momentIds?.length);
      })
      .map((event) => {
        const card = cardCatalog.find((candidate) => candidate.id === event.cardId);
        const tile = event.tileIndex !== undefined ? session.board.find((candidate) => candidate.index === event.tileIndex) : undefined;
        const moment = snapshot?.moments.find(
          (candidate) =>
            candidate.id === card?.momentId || candidate.id === event.momentId || candidate.id === tile?.momentIds?.[0]
        );
        return {
          event,
          card,
          tile,
          moment,
          art: resolveArtwork({
            tileName: tile?.name,
            cardTitle: card?.title,
            momentId: moment?.id,
            eventMessage: event.message
          })
        };
      }) ?? [];

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  function latestRollEventForSnapshot(candidate?: SessionSnapshot) {
    return candidate?.session.events.find((event) => event.type === "roll" && event.actorId);
  }

  function latestCardEventForSnapshot(candidate?: SessionSnapshot) {
    return candidate?.session.events.find((event) => event.type === "card" && event.cardId);
  }

  function latestPurchaseEventForSnapshot(candidate?: SessionSnapshot) {
    return candidate?.session.events.find(
      (event) =>
        event.tileIndex !== undefined &&
        (event.type === "purchase" || (event.type === "info" && event.message.includes("passed on")))
    );
  }

  async function playDiceSequence(actor: string, values: [number, number]) {
    setRollAnimation({
      actor,
      values: randomDicePair(),
      phase: "rolling"
    });
    const interval = window.setInterval(() => {
      setRollAnimation((current) =>
        current
          ? {
              ...current,
              values: randomDicePair(),
              phase: "rolling"
            }
          : current
      );
    }, 95);
    await wait(900);
    window.clearInterval(interval);
    setRollAnimation({
      actor,
      values,
      phase: "frozen"
    });
    await wait(520);
    setRollAnimation(undefined);
  }

  async function animateTurnSnapshot(nextSnapshot: SessionSnapshot, message: string) {
    const previousSnapshot = snapshotRef.current;
    const previousRollId = latestRollEventForSnapshot(previousSnapshot)?.id;
    const nextRollEvent = latestRollEventForSnapshot(nextSnapshot);
    const previousCardEventId = latestCardEventForSnapshot(previousSnapshot)?.id;
    const nextCardEvent = latestCardEventForSnapshot(nextSnapshot);
    const previousPurchaseEventId = latestPurchaseEventForSnapshot(previousSnapshot)?.id;
    const nextPurchaseEvent = latestPurchaseEventForSnapshot(nextSnapshot);

    if (nextRollEvent?.id && nextRollEvent.id !== previousRollId && nextSnapshot.session.lastDice) {
      const actor = nextSnapshot.session.players.find((candidate) => candidate.id === nextRollEvent.actorId)?.name ?? "Unknown";
      await playDiceSequence(actor, nextSnapshot.session.lastDice);
    }

    startTransition(() => {
      setSnapshot(nextSnapshot);
      setStatusMessage(message);
    });

    const positionsChanged = previousSnapshot
      ? previousSnapshot.session.players.some(
          (candidate, index) => candidate.position !== nextSnapshot.session.players[index]?.position
        )
      : true;

    if (positionsChanged) {
      await wait(1250);
    }

    if (
      nextCardEvent?.id &&
      nextCardEvent.id !== previousCardEventId
    ) {
      botLoopPausedByCardRef.current = true;
      setActiveReveal({ kind: "card", eventId: nextCardEvent.id });
      setShowStory(true);
      setShowCardReveal(true);
      return true;
    }

    if (
      nextPurchaseEvent?.id &&
      nextPurchaseEvent.id !== previousPurchaseEventId
    ) {
      botLoopPausedByCardRef.current = true;
      setActiveReveal({ kind: "property", eventId: nextPurchaseEvent.id });
      setShowStory(true);
      setShowCardReveal(true);
      return true;
    }

    return false;
  }

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
        setSessionDrawerOpen(true);
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
        setSessionDrawerOpen(false);
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
      let nextSnapshot = await request<SessionSnapshot>(`/api/sessions/${session.id}/play`, {
        method: "POST"
      });
      const blockedByCard = await animateTurnSnapshot(nextSnapshot, "Round processed.");
      if (blockedByCard) {
        return;
      }

      while (nextSnapshot.session.status === "awaiting_bot_turn") {
        await wait(260);
        nextSnapshot = await request<SessionSnapshot>(`/api/sessions/${session.id}/play`, {
          method: "POST"
        });
        const actor = latestRollEventForSnapshot(nextSnapshot)?.actorId;
        const actorName = nextSnapshot.session.players.find((candidate) => candidate.id === actor)?.name ?? "Bot";
        const botBlockedByCard = await animateTurnSnapshot(nextSnapshot, `${actorName} acted.`);
        if (botBlockedByCard) {
          return;
        }
      }
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
      if (nextSnapshot.session.status === "awaiting_bot_turn") {
        await playRoundFromBots(nextSnapshot);
      }
    } finally {
      setBusy(false);
    }
  }

  async function playRoundFromBots(initialSnapshot: SessionSnapshot) {
    let nextSnapshot: SessionSnapshot | undefined = initialSnapshot;
    while (nextSnapshot?.session.status === "awaiting_bot_turn") {
      await wait(260);
      nextSnapshot = await request<SessionSnapshot>(`/api/sessions/${initialSnapshot.session.id}/play`, {
        method: "POST"
      });
      const actor = latestRollEventForSnapshot(nextSnapshot)?.actorId;
      const actorName = nextSnapshot.session.players.find((candidate) => candidate.id === actor)?.name ?? "Bot";
      const blockedByCard = await animateTurnSnapshot(nextSnapshot, `${actorName} acted.`);
      if (blockedByCard) {
        return;
      }
    }
  }

  async function resumeBotTurnsAfterCard() {
    const currentSnapshot = snapshotRef.current;
    setShowCardReveal(false);
    setActiveReveal(undefined);
    if (!currentSnapshot || currentSnapshot.session.status !== "awaiting_bot_turn" || !botLoopPausedByCardRef.current) {
      botLoopPausedByCardRef.current = false;
      return;
    }

    botLoopPausedByCardRef.current = false;
    setBusy(true);
    try {
      await playRoundFromBots(currentSnapshot);
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
    <main className="experience-shell">
      <div className="canvas-stage">
        <BoardScene session={session} highlightedDeck={latestHighlightCard?.deck} />
        <div className="stage-vignette" />

        <header className="hud-brand">
          <div>
            <p className="hud-eyebrow">Round {session?.currentRound ?? 0}</p>
            <h1>AVAXOPOLY</h1>
            <p className="hud-subtitle">{session?.status?.replaceAll("_", " ") ?? "awaiting setup"}</p>
          </div>
        </header>

        <div className="hud-toolbar">
          <button className={`toolbar-button ${showLog ? "is-active" : ""}`} onClick={() => setShowLog((current) => !current)}>
            Log
          </button>
          <button className={`toolbar-button ${showStory ? "is-active" : ""}`} onClick={() => setShowStory((current) => !current)}>
            Story
          </button>
          <button className={`toolbar-button ${sessionDrawerOpen ? "is-active" : ""}`} onClick={() => setSessionDrawerOpen((current) => !current)}>
            Session
          </button>
          <div className="wallet-pills wallet-pills-toolbar">
            {isConnected ? (
              <button className="hud-chip" onClick={() => disconnect()}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </button>
            ) : (
              connectors.map((connector) => (
                <button key={connector.uid} className="hud-chip" onClick={() => connect({ connector })} disabled={isConnecting}>
                  {connector.name}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="hud-status-line">
          <span>{statusMessage}</span>
          <span>{busy ? "Working..." : "Idle"}</span>
        </div>

        {showLog ? (
          <section className="floating-panel floating-log">
            <h2>Turn Log</h2>
            <div className="overlay-list">
              {(session?.events ?? []).slice(0, 8).map((event) => (
                <div key={event.id} className={`overlay-item ${event.actorId === "player" ? "overlay-item-player" : ""}`}>
                  <strong>{event.type}</strong>
                  {event.actorId === "player" ? <span className="overlay-pill">Player</span> : null}
                  <span>{event.message}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {showStory ? (
          <section className="floating-panel floating-story">
            <h2>Story</h2>
            {storyEvents.length ? (
              <div className="story-list">
                {storyEvents.map(({ event, card, tile, moment, art }) => (
                  <div key={event.id} className="story-card">
                    <div className={art ? "story-card-top" : "story-card-top story-card-top-no-art"}>
                      {art ? (
                        <div className="story-thumb">
                          <img src={art} alt={moment?.title ?? card?.title ?? tile?.name ?? "Story art"} />
                        </div>
                      ) : null}
                      <div className="story-copy">
                        {card ? (
                          <span className={`card-badge card-badge-${card.deck}`}>
                            {card.deck === "community" ? "Community / FUD" : "L1 Rewards"}
                          </span>
                        ) : event.type === "purchase" || (event.type === "info" && event.message.includes("passed on")) ? (
                          <span className="card-badge card-badge-purchase">Purchase</span>
                        ) : tile ? (
                          <span className="card-badge card-badge-rewards">Board Lore</span>
                        ) : null}
                        <h3>{moment?.title ?? card?.title ?? tile?.name ?? "Avalanche story beat"}</h3>
                        <p>{moment?.description ?? card?.description ?? tile?.description ?? event.message}</p>
                      </div>
                    </div>
                    <small>{event.message}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="story-empty">The story panel updates when you hit a lore tile or draw a themed card.</p>
            )}
          </section>
        ) : null}

        <aside className={`session-drawer ${sessionDrawerOpen ? "is-open" : ""}`}>
          <div className="session-drawer-inner">
            <div className="session-drawer-header">
              <div>
                <h2>Session</h2>
                <p>Chain: {backendConfig?.chainId ?? "loading"} | Wallet: {isConnected ? "connected" : "not connected"}</p>
              </div>
              <button className="drawer-close" onClick={() => setSessionDrawerOpen(false)}>
                ×
              </button>
            </div>

            <div className="wallet-address">{address ?? "Connect a wallet to create a session."}</div>

            <button className="primary-wide" onClick={runAction(createSession)} disabled={!isConnected || busy}>
              Create Session
            </button>

            <section className="drawer-section">
              <h3>Fund Session</h3>
              <div className="drawer-grid">
                {SUPPORTED_TOKENS.map((token) => (
                  <label key={token} className="drawer-token-card">
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
              <button className="primary-wide" onClick={runAction(activateSession)} disabled={!session || busy || !isConnected}>
                Activate Session
              </button>
            </section>

            <section className="drawer-section">
              <h3>Settlement</h3>
              <p>Load settlement once the session reaches game over.</p>
              <button className="secondary-wide" onClick={runAction(fetchSettlement)} disabled={!session || session.status !== "game_over" || busy}>
                Preview Settlement
              </button>
              {settlement ? (
                <div className="settlement-box">
                  {SUPPORTED_TOKENS.map((token) => (
                    <div key={token} className="settlement-row">
                      <span>{token}</span>
                      <strong>{settlement.payouts[token].toFixed(2)}</strong>
                    </div>
                  ))}
                  <button className="secondary-wide" onClick={runAction(finalizeOnchain)} disabled={!settlement.signature || !backendConfig?.gameBankAddress || busy}>
                    Finalize Onchain
                  </button>
                  <button className="secondary-wide" onClick={runAction(withdrawOnchain)} disabled={!backendConfig?.gameBankAddress || busy}>
                    Withdraw
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </aside>

        {player ? (
          <div className="bankroll-rack">
            {SUPPORTED_TOKENS.map((token) => (
              <div key={token} className={`token-pill token-${token.toLowerCase()}`}>
                <img className="token-glyph-image" src={tokenIconBySymbol[token]} alt={token} />
                {tokenLabel(player.balances, token)}
              </div>
            ))}
          </div>
        ) : null}

        <div className="action-dock">
          <p>{rollAnimation ? `${rollAnimation.actor} is rolling...` : actionTitle(session)}</p>

          {rollAnimation ? (
            <div className={`roll-inline roll-inline-${rollAnimation.phase}`}>
              <small>{rollAnimation.actor}</small>
              <div className="roll-inline-dice">
                <span>{rollAnimation.values[0]}</span>
                <span>{rollAnimation.values[1]}</span>
              </div>
              <strong>{rollAnimation.values[0] + rollAnimation.values[1]}</strong>
            </div>
          ) : null}

          {!rollAnimation && session?.status === "awaiting_player_roll" ? (
            <button className="roll-button" onClick={runAction(playRound)} disabled={busy}>
              Roll Dice
            </button>
          ) : null}

          {!rollAnimation && session?.status === "game_over" && !session.pendingDecision ? (
            <button className="roll-button" onClick={runAction(fetchSettlement)} disabled={busy}>
              Preview Payout
            </button>
          ) : null}
        </div>

        {session?.pendingDecision?.kind === "buy-property" ? (
          <div className="decision-overlay">
            <div className="decision-panel">
              {buyTileArt ? (
                <div className="panel-art panel-art-large">
                  <img src={buyTileArt} alt={pendingBuyTile?.name ?? "Tile art"} />
                </div>
              ) : null}
              <span className="card-badge card-badge-rewards">Property Decision</span>
              <h3>{pendingBuyTile?.name ?? "Buy this tile?"}</h3>
              <p>{pendingBuyTile?.description ?? "Decide whether to add this property to your portfolio."}</p>
              <div className="decision-metrics">
                <div className="decision-metric">
                  <span>Cost</span>
                  <strong>{session.pendingDecision.cost} AVAX</strong>
                </div>
                <div className="decision-metric">
                  <span>Wallet</span>
                  <strong>{player?.balances.AVAX.toFixed(0) ?? "0"} AVAX</strong>
                </div>
              </div>
              <div className="dock-actions">
                <button className="primary-wide" onClick={runAction(async () => submitDecision("buy"))} disabled={busy}>
                  Buy Tile
                </button>
                <button className="secondary-wide" onClick={runAction(async () => submitDecision("skip"))} disabled={busy}>
                  Skip
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {session?.pendingDecision?.kind === "raise-liquidity" ? (
          <div className="decision-overlay">
            <div className="decision-panel">
              <span className="card-badge card-badge-community">Raise Liquidity</span>
              <h3>Settle {session.pendingDecision.debt.token} debt</h3>
              <p>{session.pendingDecision.debt.reason}</p>
              <div className="decision-metrics">
                <div className="decision-metric">
                  <span>Need</span>
                  <strong>
                    {session.pendingDecision.debt.amount} {session.pendingDecision.debt.token}
                  </strong>
                </div>
                <div className="decision-metric">
                  <span>Action</span>
                  <strong>Swap then pay</strong>
                </div>
              </div>
              <div className="swap-dock">
                <div className="swap-controls">
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
                  <input
                    value={swapForm.amount}
                    onChange={(event) =>
                      setSwapForm((current) => ({
                        ...current,
                        amount: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="dock-actions">
                  <button className="primary-wide" onClick={runAction(submitSwap)} disabled={busy}>
                    Swap
                  </button>
                  <button className="secondary-wide" onClick={runAction(async () => submitDecision("settle-debt"))} disabled={busy}>
                    Pay Debt
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showCardReveal && (revealedCard || revealedPurchaseTile) ? (
          <div className="card-overlay">
            <div className="card-reveal">
              {(activeReveal?.kind === "card" ? cardArt : purchaseArt) ? (
                <div className="panel-art panel-art-large">
                  <img src={activeReveal?.kind === "card" ? cardArt : purchaseArt} alt={revealedCard?.title ?? revealedPurchaseTile?.name ?? "Reveal art"} />
                </div>
              ) : null}
              {activeReveal?.kind === "card" && revealedCard ? (
                <>
                  <span className={`card-badge card-badge-${revealedCard.deck}`}>
                    {revealedCard.deck === "community" ? "Community Card" : "L1 Rewards"}
                  </span>
                  <div className="card-icon">{revealedCard.deck === "community" ? "!" : "★"}</div>
                  <h3>{revealedCard.title}</h3>
                  <p>{revealedCard.description}</p>
                </>
              ) : revealedPurchaseTile ? (
                <>
                  <span className="card-badge card-badge-purchase">Property Action</span>
                  <div className="card-icon">+</div>
                  <h3>{revealedPurchaseTile.name}</h3>
                  <p>{activeRevealEvent?.message}</p>
                </>
              ) : null}
              {latestRevealMoment ? <small>{latestRevealMoment.title}</small> : null}
              {activeReveal ? (
                <button className="primary-wide" onClick={runAction(resumeBotTurnsAfterCard)} disabled={busy}>
                  Dismiss
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

      </div>
    </main>
  );
}
