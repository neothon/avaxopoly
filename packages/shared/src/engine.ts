import { BOARD_TILES, COMMUNITY_DECK, NARRATIVE_MOMENTS, REWARDS_DECK } from "./content";
import type {
  BoardTile,
  CardDefinition,
  CardEffect,
  DebtState,
  GameConfig,
  GameSession,
  PendingDecision,
  PlayerState,
  SessionSnapshot,
  SettlementPayload,
  TokenLedger,
  TokenSymbol,
  TurnEvent
} from "./types";

export const DEFAULT_GAME_CONFIG: GameConfig = {
  goReward: 200,
  freeParkingEnabled: true,
  jailTurns: 1,
  maxRounds: 20,
  botCount: 3,
  swapRates: {
    COQ: 5,
    KET: 2,
    NOCHILL: 4
  }
};

const HUMAN_PLAYER_ID = "player";

export function createEmptyLedger(): TokenLedger {
  return {
    AVAX: 0,
    COQ: 0,
    KET: 0,
    NOCHILL: 0
  };
}

export function cloneLedger(source: TokenLedger): TokenLedger {
  return {
    AVAX: source.AVAX,
    COQ: source.COQ,
    KET: source.KET,
    NOCHILL: source.NOCHILL
  };
}

export function normalizeLedger(partial?: Partial<TokenLedger>): TokenLedger {
  return {
    AVAX: partial?.AVAX ?? 0,
    COQ: partial?.COQ ?? 0,
    KET: partial?.KET ?? 0,
    NOCHILL: partial?.NOCHILL ?? 0
  };
}

export function ledgerTotal(ledger: TokenLedger, swapRates = DEFAULT_GAME_CONFIG.swapRates): number {
  return roundAmount(
    ledger.AVAX +
      ledger.COQ / swapRates.COQ +
      ledger.KET / swapRates.KET +
      ledger.NOCHILL / swapRates.NOCHILL
  );
}

export function roundAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

function makeEvent(event: Omit<TurnEvent, "id" | "createdAt">): TurnEvent {
  return {
    ...event,
    id: cryptoRandomId(),
    createdAt: new Date().toISOString()
  };
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash || 1;
}

function nextRandom(session: GameSession): number {
  const nextState = (1664525 * session.rngState + 1013904223) % 4294967296;
  session.rngState = nextState;
  return nextState / 4294967296;
}

function rollDice(session: GameSession): [number, number] {
  const first = Math.floor(nextRandom(session) * 6) + 1;
  const second = Math.floor(nextRandom(session) * 6) + 1;
  session.lastDice = [first, second];
  return [first, second];
}

function buildBotName(index: number): string {
  return ["Alpha Bot", "Subnet Bot", "Validator Bot"][index] ?? `Bot ${index + 1}`;
}

function seedBots(depositLedger: TokenLedger, botCount: number): PlayerState[] {
  return Array.from({ length: botCount }, (_, index) => ({
    id: `bot-${index + 1}`,
    name: buildBotName(index),
    type: "bot" as const,
    position: 0,
    balances: cloneLedger(depositLedger),
    properties: [],
    inJailTurns: 0,
    bankrupt: false,
    skippedTurns: 0
  }));
}

function getHuman(session: GameSession): PlayerState {
  const player = session.players.find((candidate) => candidate.id === HUMAN_PLAYER_ID);
  if (!player) {
    throw new Error("Human player not found.");
  }
  return player;
}

function getPlayer(session: GameSession, playerId: string): PlayerState {
  const player = session.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`Player ${playerId} not found.`);
  }
  return player;
}

function pushEvent(session: GameSession, event: Omit<TurnEvent, "id" | "createdAt">): void {
  session.events = [makeEvent(event), ...session.events].slice(0, 80);
  session.updatedAt = new Date().toISOString();
}

function activePlayers(session: GameSession): PlayerState[] {
  return session.players.filter((player) => !player.bankrupt);
}

export function createSession(options: {
  id: string;
  playerAddress: string;
  playerName?: string;
  config?: Partial<GameConfig>;
}): GameSession {
  const config: GameConfig = {
    ...DEFAULT_GAME_CONFIG,
    ...options.config,
    swapRates: {
      ...DEFAULT_GAME_CONFIG.swapRates,
      ...(options.config?.swapRates ?? {})
    }
  };

  const human: PlayerState = {
    id: HUMAN_PLAYER_ID,
    name: options.playerName ?? "Player One",
    type: "human",
    address: options.playerAddress,
    position: 0,
    balances: createEmptyLedger(),
    properties: [],
    inJailTurns: 0,
    bankrupt: false,
    skippedTurns: 0
  };

  const session: GameSession = {
    id: options.id,
    status: "awaiting_deposit",
    board: BOARD_TILES,
    players: [human, ...seedBots(createEmptyLedger(), config.botCount)],
    currentPlayerIndex: 0,
    currentRound: 1,
    freeParkingPool: 0,
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    depositLedger: createEmptyLedger(),
    verifiedDeposits: [],
    config,
    rngState: hashSeed(options.id)
  };

  pushEvent(session, {
    actorId: HUMAN_PLAYER_ID,
    type: "info",
    message: `${human.name} opened an Avaxopoly session.`
  });

  return session;
}

export function activateSession(session: GameSession, depositLedger: TokenLedger): GameSession {
  const normalized = normalizeLedger(depositLedger);
  const total = ledgerTotal(normalized, session.config.swapRates);
  if (total <= 0) {
    throw new Error("Deposit must be greater than zero.");
  }

  const human = getHuman(session);
  human.balances = cloneLedger(normalized);
  session.players = [human, ...seedBots(normalized, session.config.botCount)];
  session.depositLedger = cloneLedger(normalized);
  session.status = "awaiting_player_roll";
  session.currentPlayerIndex = 0;
  session.currentRound = 1;
  pushEvent(session, {
    actorId: HUMAN_PLAYER_ID,
    type: "reward",
    message: `Session funded. Starting bankroll worth ${ledgerTotal(normalized, session.config.swapRates)} AVAX-equivalent.`
  });
  return session;
}

function credit(player: PlayerState, token: TokenSymbol, amount: number): void {
  player.balances[token] = roundAmount(player.balances[token] + amount);
}

function debit(player: PlayerState, token: TokenSymbol, amount: number): boolean {
  if (player.balances[token] + 1e-9 < amount) {
    return false;
  }
  player.balances[token] = roundAmount(player.balances[token] - amount);
  return true;
}

function findTile(tileIndex: number): BoardTile {
  const tile = BOARD_TILES[tileIndex];
  if (!tile) {
    throw new Error(`Tile ${tileIndex} not found.`);
  }
  return tile;
}

function propertyOwner(session: GameSession, tileIndex: number): PlayerState | undefined {
  return session.players.find((player) => player.properties.includes(tileIndex));
}

function ownsGroup(player: PlayerState, group: string): boolean {
  return player.properties.some((tileIndex) => {
    const tile = findTile(tileIndex);
    return "group" in tile && tile.group === group;
  });
}

function ownsFullGroup(session: GameSession, player: PlayerState, group: string): boolean {
  const groupTiles = BOARD_TILES.filter(
    (tile): tile is Extract<BoardTile, { kind: "property" }> => tile.kind === "property" && tile.group === group
  );
  return groupTiles.every((tile) => player.properties.includes(tile.index));
}

function railCount(session: GameSession, player: PlayerState): number {
  return player.properties.filter((tileIndex) => findTile(tileIndex).kind === "rail").length;
}

function attemptAutoSwap(
  session: GameSession,
  player: PlayerState,
  targetToken: TokenSymbol,
  targetAmount: number
): boolean {
  if (targetToken === "AVAX") {
    return false;
  }
  const current = player.balances[targetToken];
  if (current >= targetAmount) {
    return true;
  }
  const needed = targetAmount - current;
  const requiredAvax = roundAmount(needed / session.config.swapRates[targetToken]);
  if (player.balances.AVAX + 1e-9 < requiredAvax) {
    return false;
  }
  debit(player, "AVAX", requiredAvax);
  credit(player, targetToken, needed);
  pushEvent(session, {
    actorId: player.id,
    type: "swap",
    message: `${player.name} swapped ${requiredAvax} AVAX into ${needed} ${targetToken}.`
  });
  return true;
}

function bankruptcyValue(session: GameSession, player: PlayerState): number {
  const propertyValue = player.properties.reduce((sum, tileIndex) => {
    const tile = findTile(tileIndex);
    if ("cost" in tile) {
      return sum + tile.cost * 0.5;
    }
    return sum;
  }, 0);
  return ledgerTotal(player.balances, session.config.swapRates) + propertyValue;
}

function markBankrupt(session: GameSession, player: PlayerState, reason: string): void {
  player.bankrupt = true;
  player.properties = [];
  player.balances = createEmptyLedger();
  pushEvent(session, {
    actorId: player.id,
    type: "bankrupt",
    message: `${player.name} went bankrupt after ${reason}.`
  });
}

function resolveDebt(
  session: GameSession,
  player: PlayerState,
  debt: DebtState
): { paid: boolean; pendingDecision?: PendingDecision } {
  const payee = debt.payeeId ? getPlayer(session, debt.payeeId) : undefined;
  if (player.balances[debt.token] < debt.amount && player.type === "bot") {
    attemptAutoSwap(session, player, debt.token, debt.amount);
  }

  if (player.balances[debt.token] < debt.amount) {
    if (player.type === "human") {
      return {
        paid: false,
        pendingDecision: {
          kind: "raise-liquidity",
          debt
        }
      };
    }
    if (bankruptcyValue(session, player) <= 0) {
      markBankrupt(session, player, debt.reason);
      return { paid: false };
    }
    if (!attemptAutoSwap(session, player, debt.token, debt.amount)) {
      markBankrupt(session, player, debt.reason);
      return { paid: false };
    }
  }

  if (!debit(player, debt.token, debt.amount)) {
    if (player.type === "human") {
      return {
        paid: false,
        pendingDecision: {
          kind: "raise-liquidity",
          debt
        }
      };
    }
    markBankrupt(session, player, debt.reason);
    return { paid: false };
  }

  if (payee) {
    credit(payee, debt.token, debt.amount);
  } else if (debt.token === "AVAX") {
    session.freeParkingPool = roundAmount(session.freeParkingPool + debt.amount);
  }
  pushEvent(session, {
    actorId: player.id,
    type: debt.payeeId ? "rent" : "penalty",
    message: `${player.name} paid ${debt.amount} ${debt.token}${payee ? ` to ${payee.name}` : ""}.`
  });
  return { paid: true };
}

function applyCardEffect(
  session: GameSession,
  player: PlayerState,
  effect: CardEffect
): PendingDecision | undefined {
  switch (effect.type) {
    case "credit":
      credit(player, effect.token, effect.amount);
      pushEvent(session, {
        actorId: player.id,
        type: "reward",
        message: `${player.name} received ${effect.amount} ${effect.token}.`
      });
      return undefined;
    case "debit": {
      const result = resolveDebt(session, player, {
        token: effect.token,
        amount: effect.amount,
        reason: "a drawn card"
      });
      return result.pendingDecision;
    }
    case "perPlayerDebit": {
      const amount = effect.amount * activePlayers(session).length;
      const result = resolveDebt(session, player, {
        token: effect.token,
        amount,
        reason: "network-wide fees"
      });
      return result.pendingDecision;
    }
    case "conditionalCredit":
      if (ownsGroup(player, effect.propertyGroup)) {
        credit(player, effect.token, effect.amount);
        pushEvent(session, {
          actorId: player.id,
          type: "reward",
          message: `${player.name} triggered a ${effect.propertyGroup} bonus for ${effect.amount} ${effect.token}.`
        });
      }
      return undefined;
    case "move":
      movePlayer(session, player, effect.tileIndex, effect.collectGo ?? false);
      return undefined;
    case "goToJail":
      sendToJail(session, player);
      return undefined;
  }
}

function drawCard(session: GameSession, deck: CardDefinition["deck"]): CardDefinition {
  const cards = deck === "community" ? COMMUNITY_DECK : REWARDS_DECK;
  const index = Math.floor(nextRandom(session) * cards.length);
  const card = cards[index];
  if (!card) {
    throw new Error(`No cards found for deck ${deck}.`);
  }
  return card;
}

function movePlayer(session: GameSession, player: PlayerState, tileIndex: number, collectGo = false): void {
  if (collectGo || tileIndex < player.position) {
    credit(player, "AVAX", session.config.goReward);
    pushEvent(session, {
      actorId: player.id,
      type: "reward",
      message: `${player.name} collected ${session.config.goReward} AVAX for passing Enter the Arena.`
    });
  }
  player.position = tileIndex;
  pushEvent(session, {
    actorId: player.id,
    type: "move",
    message: `${player.name} moved to ${findTile(tileIndex).name}.`,
    tileIndex
  });
}

function sendToJail(session: GameSession, player: PlayerState): void {
  player.position = 10;
  player.inJailTurns = session.config.jailTurns;
  pushEvent(session, {
    actorId: player.id,
    type: "penalty",
    message: `${player.name} was sent to jail.`,
    tileIndex: 10
  });
}

function handleBonusTile(session: GameSession, player: PlayerState, tile: Extract<BoardTile, { kind: "bonus" }>): void {
  switch (tile.effect.id) {
    case "avax-rush": {
      credit(player, "AVAX", 500);
      const bonus = ownsGroup(player, "Lending") ? 50 : 0;
      if (bonus > 0) {
        credit(player, "AVAX", bonus);
      }
      pushEvent(session, {
        actorId: player.id,
        type: "reward",
        message: `${player.name} hit Avax Rush and collected ${500 + bonus} AVAX.`
      });
      return;
    }
    case "core-wallet":
      credit(player, "AVAX", 100);
      pushEvent(session, {
        actorId: player.id,
        type: "reward",
        message: `${player.name} found 100 AVAX through Core Wallet.`
      });
      return;
    case "the-arena":
      credit(player, "AVAX", 120);
      pushEvent(session, {
        actorId: player.id,
        type: "reward",
        message: `${player.name} soaked up momentum in The Arena for 120 AVAX.`
      });
      return;
    case "coinbase-transfer": {
      const result = resolveDebt(session, player, {
        token: "AVAX",
        amount: 150,
        reason: "Sends 30M to Coinbase"
      });
      if (result.pendingDecision) {
        session.pendingDecision = result.pendingDecision;
        session.status = "awaiting_player_swap";
      }
      return;
    }
  }
}

function propertyRent(session: GameSession, owner: PlayerState, tile: BoardTile, diceTotal: number): DebtState | undefined {
  if (tile.kind === "property") {
    const rent = ownsFullGroup(session, owner, tile.group) ? tile.monopolyRent : tile.baseRent;
    return {
      token: tile.rentToken,
      amount: rent,
      payeeId: owner.id,
      reason: `landing on ${tile.name}`
    };
  }
  if (tile.kind === "rail") {
    const owned = Math.max(1, railCount(session, owner));
    const rent = tile.rentSteps[Math.min(owned, tile.rentSteps.length) - 1] ?? tile.rentSteps[0];
    return {
      token: "AVAX",
      amount: rent,
      payeeId: owner.id,
      reason: `landing on ${tile.name}`
    };
  }
  if (tile.kind === "utility") {
    return {
      token: "AVAX",
      amount: tile.rollMultiplier * diceTotal,
      payeeId: owner.id,
      reason: `landing on ${tile.name}`
    };
  }
  return undefined;
}

function handleLanding(
  session: GameSession,
  player: PlayerState,
  tile: BoardTile,
  diceTotal: number
): PendingDecision | undefined {
  if (tile.kind === "go") {
    credit(player, "AVAX", session.config.goReward);
    pushEvent(session, {
      actorId: player.id,
      type: "reward",
      message: `${player.name} landed on Enter the Arena and collected ${session.config.goReward} AVAX.`
    });
    return undefined;
  }

  if (tile.kind === "tax") {
    const result = resolveDebt(session, player, {
      token: "AVAX",
      amount: tile.amount,
      reason: `landing on ${tile.name}`
    });
    return result.pendingDecision;
  }

  if (tile.kind === "freeParking") {
    if (session.freeParkingPool > 0 && session.config.freeParkingEnabled) {
      const payout = session.freeParkingPool;
      session.freeParkingPool = 0;
      credit(player, "AVAX", payout);
      pushEvent(session, {
        actorId: player.id,
        type: "reward",
        message: `${player.name} collected ${payout} AVAX from the Liquidity Pool.`
      });
    }
    return undefined;
  }

  if (tile.kind === "goToJail") {
    sendToJail(session, player);
    return undefined;
  }

  if (tile.kind === "card") {
    const card = drawCard(session, tile.deck);
    pushEvent(session, {
      actorId: player.id,
      type: "card",
      message: `${player.name} drew "${card.title}".`,
      momentId: card.momentId,
      cardId: card.id
    });
    for (const effect of card.effects) {
      const pending = applyCardEffect(session, player, effect);
      if (pending) {
        return pending;
      }
    }
    return undefined;
  }

  if (tile.kind === "bonus") {
    handleBonusTile(session, player, tile);
    return session.pendingDecision;
  }

  if (tile.kind === "property" || tile.kind === "rail" || tile.kind === "utility") {
    const owner = propertyOwner(session, tile.index);
    if (!owner) {
      if (player.type === "human" && tile.cost <= player.balances.AVAX) {
        return {
          kind: "buy-property",
          tileIndex: tile.index,
          cost: tile.cost
        };
      }
      if (player.type === "bot" && tile.cost <= player.balances.AVAX) {
        buyProperty(session, player.id, tile.index);
      }
      return undefined;
    }

    if (owner.id === player.id) {
      return undefined;
    }

    const debt = propertyRent(session, owner, tile, diceTotal);
    if (!debt) {
      return undefined;
    }
    const result = resolveDebt(session, player, debt);
    return result.pendingDecision;
  }

  return undefined;
}

function moveByRoll(session: GameSession, player: PlayerState, diceTotal: number): BoardTile {
  const nextPosition = (player.position + diceTotal) % BOARD_TILES.length;
  if (player.position + diceTotal >= BOARD_TILES.length) {
    credit(player, "AVAX", session.config.goReward);
    pushEvent(session, {
      actorId: player.id,
      type: "reward",
      message: `${player.name} passed Enter the Arena and collected ${session.config.goReward} AVAX.`
    });
  }
  player.position = nextPosition;
  const tile = findTile(nextPosition);
  pushEvent(session, {
    actorId: player.id,
    type: "move",
    message: `${player.name} moved to ${tile.name}.`,
    tileIndex: tile.index,
    momentId: tile.momentIds?.[0]
  });
  return tile;
}

function advanceTurn(session: GameSession): void {
  const wasLastPlayer = session.currentPlayerIndex === session.players.length - 1;
  session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
  if (wasLastPlayer) {
    session.currentRound += 1;
  }
}

function currentPlayer(session: GameSession): PlayerState {
  const player = session.players[session.currentPlayerIndex];
  if (!player) {
    throw new Error("Current player not found.");
  }
  return player;
}

function takeTurn(session: GameSession, playerId: string): void {
  if (session.status === "game_over") {
    return;
  }
  const player = getPlayer(session, playerId);
  if (player.bankrupt) {
    advanceTurn(session);
    return;
  }

  if (player.skippedTurns > 0) {
    player.skippedTurns -= 1;
    pushEvent(session, {
      actorId: player.id,
      type: "info",
      message: `${player.name} skipped a turn.`
    });
    advanceTurn(session);
    return;
  }

  if (player.inJailTurns > 0) {
    player.inJailTurns -= 1;
    pushEvent(session, {
      actorId: player.id,
      type: "penalty",
      message: `${player.name} is sitting in jail this turn.`
    });
    advanceTurn(session);
    return;
  }

  const [first, second] = rollDice(session);
  const total = first + second;
  pushEvent(session, {
    actorId: player.id,
    type: "roll",
    message: `${player.name} rolled ${first} + ${second} = ${total}.`
  });

  const tile = moveByRoll(session, player, total);
  if (tile.kind === "property" && tile.name === "Avax Rush") {
    handleBonusTile(session, player, {
      ...tile,
      kind: "bonus",
      effect: {
        id: "avax-rush",
        description: "Collect 500 AVAX, plus 50 AVAX if you already own Lending."
      }
    });
  }

  const pendingDecision = handleLanding(session, player, tile, total);
  if (pendingDecision) {
    session.pendingDecision = pendingDecision;
    session.status = pendingDecision.kind === "buy-property" ? "awaiting_player_decision" : "awaiting_player_swap";
    return;
  }

  advanceTurn(session);
}

function maybeEndGame(session: GameSession): void {
  const human = getHuman(session);
  const livingBots = session.players.filter((player) => player.type === "bot" && !player.bankrupt);
  if (human.bankrupt || livingBots.length === 0 || session.currentRound > session.config.maxRounds) {
    const richest = [...session.players].sort(
      (left, right) => bankruptcyValue(session, right) - bankruptcyValue(session, left)
    )[0];
    session.winnerId = richest?.id;
    session.status = "game_over";
    session.pendingDecision = undefined;
    pushEvent(session, {
      actorId: richest?.id,
      type: "settlement",
      message: `${richest?.name ?? "Unknown"} finished with the strongest ledger.`
    });
  }
}

function runBotsUntilHuman(session: GameSession): GameSession {
  while (session.status !== "game_over" && currentPlayer(session).type === "bot") {
    takeTurn(session, currentPlayer(session).id);
    maybeEndGame(session);
  }

  if (session.status !== "game_over" && !session.pendingDecision) {
    session.status = "awaiting_player_roll";
  }

  return session;
}

export function playHumanTurn(session: GameSession): GameSession {
  if (session.status !== "awaiting_player_roll") {
    throw new Error("Human turn cannot be played right now.");
  }
  if (currentPlayer(session).id !== HUMAN_PLAYER_ID) {
    throw new Error("It is not the human player's turn.");
  }
  takeTurn(session, HUMAN_PLAYER_ID);
  maybeEndGame(session);
  if (session.status === "awaiting_player_roll") {
    return runBotsUntilHuman(session);
  }
  return session;
}

export function buyProperty(session: GameSession, playerId: string, tileIndex: number): GameSession {
  const player = getPlayer(session, playerId);
  const tile = findTile(tileIndex);
  if (!(tile.kind === "property" || tile.kind === "rail" || tile.kind === "utility")) {
    throw new Error("Tile is not purchasable.");
  }
  if (propertyOwner(session, tileIndex)) {
    throw new Error("Tile is already owned.");
  }
  if (!debit(player, "AVAX", tile.cost)) {
    throw new Error("Not enough AVAX to buy this tile.");
  }
  player.properties.push(tileIndex);
  pushEvent(session, {
    actorId: player.id,
    type: "purchase",
    message: `${player.name} bought ${tile.name} for ${tile.cost} AVAX.`,
    tileIndex
  });
  return session;
}

export function resolveHumanDecision(session: GameSession, action: "buy" | "skip" | "settle-debt"): GameSession {
  const pending = session.pendingDecision;
  if (!pending) {
    throw new Error("No pending decision to resolve.");
  }
  const player = getHuman(session);

  if (pending.kind === "buy-property") {
    if (action === "buy") {
      buyProperty(session, player.id, pending.tileIndex);
    } else if (action !== "skip") {
      throw new Error("Invalid action for property decision.");
    }
    session.pendingDecision = undefined;
    advanceTurn(session);
    maybeEndGame(session);
    return runBotsUntilHuman(session);
  }

  if (pending.kind === "raise-liquidity") {
    if (action !== "settle-debt") {
      throw new Error("Debt decisions must be settled after swapping.");
    }
    const result = resolveDebt(session, player, pending.debt);
    if (result.pendingDecision) {
      session.pendingDecision = result.pendingDecision;
      session.status = "awaiting_player_swap";
      return session;
    }
    session.pendingDecision = undefined;
    advanceTurn(session);
    maybeEndGame(session);
    return runBotsUntilHuman(session);
  }

  return session;
}

export function swapTokens(
  session: GameSession,
  playerId: string,
  fromToken: TokenSymbol,
  toToken: TokenSymbol,
  amount: number
): GameSession {
  if (fromToken === toToken) {
    throw new Error("Swap tokens must be different.");
  }
  if (amount <= 0) {
    throw new Error("Swap amount must be positive.");
  }
  const player = getPlayer(session, playerId);
  if (player.balances[fromToken] < amount) {
    throw new Error(`Not enough ${fromToken} to swap.`);
  }

  let avaxValue = amount;
  if (fromToken !== "AVAX") {
    avaxValue = roundAmount(amount / session.config.swapRates[fromToken]);
  }
  const output =
    toToken === "AVAX" ? avaxValue : roundAmount(avaxValue * session.config.swapRates[toToken]);

  debit(player, fromToken, amount);
  credit(player, toToken, output);

  pushEvent(session, {
    actorId: player.id,
    type: "swap",
    message: `${player.name} swapped ${amount} ${fromToken} for ${output} ${toToken}.`
  });

  return session;
}

export function sessionSnapshot(session: GameSession): SessionSnapshot {
  return {
    session,
    moments: NARRATIVE_MOMENTS,
    communityDeck: COMMUNITY_DECK,
    rewardsDeck: REWARDS_DECK
  };
}

export function liquidationPayout(session: GameSession): TokenLedger {
  const player = getHuman(session);
  const payouts = cloneLedger(player.balances);
  const liquidationValue = player.properties.reduce((sum, tileIndex) => {
    const tile = findTile(tileIndex);
    return "cost" in tile ? sum + tile.cost * 0.5 : sum;
  }, 0);
  payouts.AVAX = roundAmount(payouts.AVAX + liquidationValue);
  return payouts;
}

export function buildSettlementPayload(session: GameSession): SettlementPayload {
  const player = getHuman(session);
  if (!player.address) {
    throw new Error("Player address is missing.");
  }
  if (session.status !== "game_over") {
    throw new Error("Session is not finished.");
  }
  return {
    sessionId: session.id,
    playerAddress: player.address,
    payouts: liquidationPayout(session)
  };
}

export function registerDeposit(
  session: GameSession,
  token: TokenSymbol,
  amount: number,
  txHash?: string
): GameSession {
  session.verifiedDeposits.push({ token, amount, txHash });
  return session;
}

export function getNarrativeMoment(id?: string) {
  return NARRATIVE_MOMENTS.find((moment) => moment.id === id);
}
