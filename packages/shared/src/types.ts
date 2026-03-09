export const SUPPORTED_TOKENS = ["AVAX", "COQ", "KET", "NOCHILL"] as const;

export type TokenSymbol = (typeof SUPPORTED_TOKENS)[number];
export type DeckType = "community" | "rewards";
export type TileKind =
  | "go"
  | "property"
  | "rail"
  | "utility"
  | "tax"
  | "card"
  | "freeParking"
  | "goToJail"
  | "jail"
  | "bonus";

export type TurnEventType =
  | "info"
  | "roll"
  | "move"
  | "purchase"
  | "rent"
  | "swap"
  | "card"
  | "penalty"
  | "reward"
  | "bankrupt"
  | "settlement";

export type GameStatus =
  | "awaiting_deposit"
  | "awaiting_player_roll"
  | "awaiting_player_decision"
  | "awaiting_player_swap"
  | "game_over";

export interface TokenLedger {
  AVAX: number;
  COQ: number;
  KET: number;
  NOCHILL: number;
}

export interface NarrativeMoment {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export interface ConditionalReward {
  propertyGroup?: string;
  token?: TokenSymbol;
  amount: number;
}

export type CardEffect =
  | { type: "credit"; token: TokenSymbol; amount: number }
  | { type: "debit"; token: TokenSymbol; amount: number; toFreeParking?: boolean }
  | { type: "move"; tileIndex: number; collectGo?: boolean }
  | { type: "goToJail" }
  | { type: "perPlayerDebit"; token: TokenSymbol; amount: number }
  | { type: "conditionalCredit"; token: TokenSymbol; amount: number; propertyGroup: string };

export interface CardDefinition {
  id: string;
  deck: DeckType;
  title: string;
  description: string;
  effects: CardEffect[];
  momentId?: string;
}

export interface TileEffect {
  id: "avax-rush" | "core-wallet" | "the-arena" | "coinbase-transfer";
  description: string;
}

export interface BaseTile {
  index: number;
  name: string;
  kind: TileKind;
  description: string;
  momentIds?: string[];
}

export interface PropertyTile extends BaseTile {
  kind: "property";
  group: string;
  cost: number;
  baseRent: number;
  monopolyRent: number;
  rentToken: TokenSymbol;
}

export interface RailTile extends BaseTile {
  kind: "rail";
  cost: number;
  rentSteps: [number, number, number, number];
}

export interface UtilityTile extends BaseTile {
  kind: "utility";
  cost: number;
  rollMultiplier: number;
}

export interface TaxTile extends BaseTile {
  kind: "tax";
  amount: number;
}

export interface CardTile extends BaseTile {
  kind: "card";
  deck: DeckType;
}

export interface BonusTile extends BaseTile {
  kind: "bonus";
  effect: TileEffect;
}

export interface GoTile extends BaseTile {
  kind: "go";
}

export interface FreeParkingTile extends BaseTile {
  kind: "freeParking";
}

export interface JailTile extends BaseTile {
  kind: "jail";
}

export interface GoToJailTile extends BaseTile {
  kind: "goToJail";
}

export type BoardTile =
  | PropertyTile
  | RailTile
  | UtilityTile
  | TaxTile
  | CardTile
  | BonusTile
  | GoTile
  | FreeParkingTile
  | JailTile
  | GoToJailTile;

export interface PlayerState {
  id: string;
  name: string;
  type: "human" | "bot";
  address?: string;
  position: number;
  balances: TokenLedger;
  properties: number[];
  inJailTurns: number;
  bankrupt: boolean;
  skippedTurns: number;
}

export interface DebtState {
  token: TokenSymbol;
  amount: number;
  payeeId?: string;
  reason: string;
}

export type PendingDecision =
  | {
      kind: "buy-property";
      tileIndex: number;
      cost: number;
    }
  | {
      kind: "raise-liquidity";
      debt: DebtState;
    };

export interface TurnEvent {
  id: string;
  actorId?: string;
  type: TurnEventType;
  message: string;
  tileIndex?: number;
  momentId?: string;
  cardId?: string;
  createdAt: string;
}

export interface SwapRates {
  COQ: number;
  KET: number;
  NOCHILL: number;
}

export interface GameConfig {
  goReward: number;
  freeParkingEnabled: boolean;
  jailTurns: number;
  maxRounds: number;
  botCount: number;
  swapRates: SwapRates;
}

export interface SettlementPayload {
  sessionId: string;
  playerAddress: string;
  payouts: TokenLedger;
  signature?: string;
}

export interface GameSession {
  id: string;
  status: GameStatus;
  board: BoardTile[];
  players: PlayerState[];
  currentPlayerIndex: number;
  currentRound: number;
  freeParkingPool: number;
  pendingDecision?: PendingDecision;
  lastDice?: [number, number];
  events: TurnEvent[];
  createdAt: string;
  updatedAt: string;
  winnerId?: string;
  depositLedger: TokenLedger;
  verifiedDeposits: Array<{ token: TokenSymbol; amount: number; txHash?: string }>;
  config: GameConfig;
  rngState: number;
}

export interface SessionSnapshot {
  session: GameSession;
  moments: NarrativeMoment[];
  communityDeck: CardDefinition[];
  rewardsDeck: CardDefinition[];
}
