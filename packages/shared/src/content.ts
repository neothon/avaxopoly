import type { BoardTile, CardDefinition, NarrativeMoment } from "./types";

export const NARRATIVE_MOMENTS: NarrativeMoment[] = [
  {
    id: "wrathank-grift",
    title: "Wrathank's Grift",
    description: "An Avalanche lore tile about surviving the kind of move everyone saw coming too late.",
    tags: ["lore", "violet", "avalanche-native"]
  },
  {
    id: "coinbase-transfer",
    title: "Sends 30M to Coinbase",
    description: "The board's version of a market-wide blood pressure spike.",
    tags: ["fud", "market", "avalanche-native"]
  },
  {
    id: "community-fud-cycle",
    title: "Community FUD Cycle",
    description: "The mood swings but the chain keeps producing blocks.",
    tags: ["fud", "community", "avalanche-native"]
  },
  {
    id: "rug-pulled",
    title: "Rug Pulled",
    description: "Go directly to jail. Do not pass Enter the Arena.",
    tags: ["risk", "jail", "avalanche-native"]
  },
  {
    id: "twitt-fud",
    title: "@twitt_tr FUDs Your Project",
    description: "The timeline turns and the board punishes you immediately.",
    tags: ["fud", "jail", "timeline"]
  },
  {
    id: "liquidity-pool",
    title: "Liquidity Pool",
    description: "Fines and chaos accumulate until someone lands here.",
    tags: ["defi", "bank", "avalanche-native"]
  },
  {
    id: "inscription-gas-spike",
    title: "Inscription Gas Spike",
    description: "Just when you thought fees were quiet.",
    tags: ["fees", "infra", "avalanche-native"]
  },
  {
    id: "avalore",
    title: "Avalore",
    description: "Quest energy hits the turn log as a recognizable Avalanche-native moment.",
    tags: ["gaming", "quest", "avalanche-native"]
  },
  {
    id: "avery",
    title: "Avery",
    description: "A strategic voice enters the timeline and improves the odds for one round.",
    tags: ["alpha", "community", "avalanche-native"]
  },
  {
    id: "voh",
    title: "VOH",
    description: "Late-night Avalanche-native momentum arrives as a lore moment rather than a live token.",
    tags: ["spaces", "community", "avalanche-native"]
  },
  {
    id: "hcash",
    title: "HCash",
    description: "A cautionary narrative card moment that affects mood and treasury.",
    tags: ["lore", "cards", "avalanche-native"]
  },
  {
    id: "bands",
    title: "BANDS",
    description: "Bears and Salmons keep their place on the board, with BANDS preserved as a native reference.",
    tags: ["nft", "gaming", "avalanche-native"]
  }
];

export const BOARD_TILES: BoardTile[] = [
  {
    index: 0,
    name: "Enter the Arena",
    kind: "go",
    description: "Collect 200 AVAX when you pass or land here."
  },
  {
    index: 1,
    name: "LFJ",
    kind: "property",
    description: "DEX culture starts the loop.",
    group: "DEXs",
    cost: 60,
    baseRent: 2,
    monopolyRent: 4,
    rentToken: "KET"
  },
  {
    index: 2,
    name: "L1 Rewards",
    kind: "card",
    description: "Draw an Avalanche rewards moment.",
    deck: "rewards"
  },
  {
    index: 3,
    name: "Blackhole",
    kind: "property",
    description: "Another DEX stop on the brown row.",
    group: "DEXs",
    cost: 60,
    baseRent: 4,
    monopolyRent: 10,
    rentToken: "KET"
  },
  {
    index: 4,
    name: "Staking Tax",
    kind: "tax",
    description: "Pay 200 AVAX into the Liquidity Pool.",
    amount: 200
  },
  {
    index: 5,
    name: "DFK Chain",
    kind: "rail",
    description: "L1 rail equivalent. Rent is always paid in AVAX.",
    cost: 200,
    rentSteps: [25, 50, 100, 200]
  },
  {
    index: 6,
    name: "Benqi",
    kind: "property",
    description: "Lending and incentives tile.",
    group: "Lending",
    cost: 100,
    baseRent: 6,
    monopolyRent: 12,
    rentToken: "KET"
  },
  {
    index: 7,
    name: "Core Wallet",
    kind: "bonus",
    description: "A lightweight recovery moment instead of a blank tile.",
    effect: {
      id: "core-wallet",
      description: "Collect 100 AVAX from the bank."
    }
  },
  {
    index: 8,
    name: "Aave V3",
    kind: "property",
    description: "Another lending stop.",
    group: "Lending",
    cost: 100,
    baseRent: 6,
    monopolyRent: 18,
    rentToken: "KET"
  },
  {
    index: 9,
    name: "Avax Rush",
    kind: "property",
    description: "Collect 500 AVAX when you land here, plus 50 AVAX if you already own Lending.",
    group: "Lending",
    cost: 120,
    baseRent: 8,
    monopolyRent: 20,
    rentToken: "KET"
  },
  {
    index: 10,
    name: "@twitt_tr FUDs Your Project",
    kind: "goToJail",
    description: "Go directly to jail.",
    momentIds: ["twitt-fud"]
  },
  {
    index: 11,
    name: "Coq Inu",
    kind: "property",
    description: "Meme rent is paid in COQ.",
    group: "Meme",
    cost: 140,
    baseRent: 10,
    monopolyRent: 20,
    rentToken: "COQ"
  },
  {
    index: 12,
    name: "Chainlink Oracle",
    kind: "utility",
    description: "Pay four times the dice roll in AVAX.",
    cost: 150,
    rollMultiplier: 4
  },
  {
    index: 13,
    name: "Avax Has No Chill",
    kind: "property",
    description: "The timeline heats up and rent is paid in NOCHILL.",
    group: "Meme",
    cost: 140,
    baseRent: 10,
    monopolyRent: 22,
    rentToken: "NOCHILL"
  },
  {
    index: 14,
    name: "Yellow Ket",
    kind: "property",
    description: "The final meme lane slot uses KET.",
    group: "Meme",
    cost: 160,
    baseRent: 12,
    monopolyRent: 25,
    rentToken: "KET"
  },
  {
    index: 15,
    name: "Beam L1",
    kind: "rail",
    description: "Another L1 rail equivalent.",
    cost: 200,
    rentSteps: [25, 50, 100, 200]
  },
  {
    index: 16,
    name: "Joepegs",
    kind: "property",
    description: "NFT marketplace row begins.",
    group: "NFT",
    cost: 180,
    baseRent: 14,
    monopolyRent: 28,
    rentToken: "KET"
  },
  {
    index: 17,
    name: "L1 Rewards",
    kind: "card",
    description: "Draw an Avalanche rewards moment.",
    deck: "rewards"
  },
  {
    index: 18,
    name: "Bears and Salmons",
    kind: "property",
    description: "BANDS stays present as lore while this NFT tile keeps the original board slot.",
    group: "NFT",
    cost: 180,
    baseRent: 14,
    monopolyRent: 30,
    rentToken: "KET",
    momentIds: ["bands"]
  },
  {
    index: 19,
    name: "Pharaoh",
    kind: "property",
    description: "The last DEX stop closes the early game loop.",
    group: "DEXs",
    cost: 120,
    baseRent: 6,
    monopolyRent: 12,
    rentToken: "KET"
  },
  {
    index: 20,
    name: "Liquidity Pool",
    kind: "freeParking",
    description: "Collect the pooled AVAX fines if the pool has funds.",
    momentIds: ["liquidity-pool"]
  },
  {
    index: 21,
    name: "DeFi Kingdoms",
    kind: "property",
    description: "Gaming row begins.",
    group: "Gaming",
    cost: 220,
    baseRent: 18,
    monopolyRent: 36,
    rentToken: "KET"
  },
  {
    index: 22,
    name: "Community FUD Cycle",
    kind: "card",
    description: "Draw a community/fud moment.",
    deck: "community",
    momentIds: ["community-fud-cycle"]
  },
  {
    index: 23,
    name: "Salvor",
    kind: "property",
    description: "Gaming row continues.",
    group: "Gaming",
    cost: 220,
    baseRent: 18,
    monopolyRent: 40,
    rentToken: "KET"
  },
  {
    index: 24,
    name: "Off The Grid",
    kind: "property",
    description: "A higher-stakes gaming lane.",
    group: "Gaming",
    cost: 240,
    baseRent: 20,
    monopolyRent: 45,
    rentToken: "KET"
  },
  {
    index: 25,
    name: "Dexalot L1",
    kind: "rail",
    description: "L1 rail equivalent.",
    cost: 200,
    rentSteps: [25, 50, 100, 200]
  },
  {
    index: 26,
    name: "Ferdy Fish",
    kind: "property",
    description: "Violet row starts with native lore.",
    group: "Lore",
    cost: 260,
    baseRent: 22,
    monopolyRent: 44,
    rentToken: "AVAX"
  },
  {
    index: 27,
    name: "AVAX Foundation",
    kind: "property",
    description: "Institutional backbone of the board.",
    group: "Lore",
    cost: 260,
    baseRent: 22,
    monopolyRent: 46,
    rentToken: "AVAX"
  },
  {
    index: 28,
    name: "The Arena",
    kind: "bonus",
    description: "A lore tile that rewards momentum.",
    effect: {
      id: "the-arena",
      description: "Collect 120 AVAX from the bank."
    }
  },
  {
    index: 29,
    name: "Wrathank's Grift",
    kind: "property",
    description: "Late-violet Avalanche lore.",
    group: "Lore",
    cost: 280,
    baseRent: 24,
    monopolyRent: 50,
    rentToken: "AVAX",
    momentIds: ["wrathank-grift"]
  },
  {
    index: 30,
    name: "Rug Pulled",
    kind: "goToJail",
    description: "Go directly to jail.",
    momentIds: ["rug-pulled"]
  },
  {
    index: 31,
    name: "GMX",
    kind: "property",
    description: "Perps and culture lane starts.",
    group: "Culture",
    cost: 300,
    baseRent: 26,
    monopolyRent: 52,
    rentToken: "KET"
  },
  {
    index: 32,
    name: "L1 Rewards",
    kind: "card",
    description: "Draw an Avalanche rewards moment.",
    deck: "rewards"
  },
  {
    index: 33,
    name: "sAVAX",
    kind: "property",
    description: "Green row stays in the culture lane for MVP.",
    group: "Culture",
    cost: 300,
    baseRent: 26,
    monopolyRent: 54,
    rentToken: "KET"
  },
  {
    index: 34,
    name: "AVAX Validators",
    kind: "rail",
    description: "Final L1 rail equivalent.",
    cost: 200,
    rentSteps: [25, 50, 100, 200]
  },
  {
    index: 35,
    name: "Giraffe Comics",
    kind: "property",
    description: "Culture row closes here.",
    group: "Culture",
    cost: 320,
    baseRent: 28,
    monopolyRent: 58,
    rentToken: "KET"
  },
  {
    index: 36,
    name: "Sends 30M to Coinbase",
    kind: "bonus",
    description: "A market shock tile that taxes confidence.",
    effect: {
      id: "coinbase-transfer",
      description: "Pay 150 AVAX into the Liquidity Pool."
    },
    momentIds: ["coinbase-transfer"]
  },
  {
    index: 37,
    name: "Core Wallet",
    kind: "property",
    description: "Infrastructure row begins.",
    group: "Infrastructure",
    cost: 350,
    baseRent: 35,
    monopolyRent: 70,
    rentToken: "AVAX"
  },
  {
    index: 38,
    name: "Inscription Gas Spike",
    kind: "tax",
    description: "Pay 100 AVAX into the Liquidity Pool.",
    amount: 100,
    momentIds: ["inscription-gas-spike"]
  },
  {
    index: 39,
    name: "Avalanche L1",
    kind: "property",
    description: "The most valuable infrastructure tile on the board.",
    group: "Infrastructure",
    cost: 400,
    baseRent: 50,
    monopolyRent: 100,
    rentToken: "AVAX"
  }
];

export const COMMUNITY_DECK: CardDefinition[] = [
  {
    id: "market-panic",
    deck: "community",
    title: "Market panic after a large transfer",
    description: "Lose 150 AVAX to the Liquidity Pool.",
    effects: [{ type: "debit", token: "AVAX", amount: 150, toFreeParking: true }],
    momentId: "coinbase-transfer"
  },
  {
    id: "stupifff-alpha",
    deck: "community",
    title: "@Stupifff shares alpha",
    description: "Earn 100 AVAX from the bank. If you own any Culture property, earn an extra 50 AVAX.",
    effects: [
      { type: "credit", token: "AVAX", amount: 100 },
      { type: "conditionalCredit", token: "AVAX", amount: 50, propertyGroup: "Culture" }
    ]
  },
  {
    id: "neothon-good-vibes",
    deck: "community",
    title: "@0xNeothon spreads good vibes",
    description: "Collect 100 AVAX from the bank.",
    effects: [{ type: "credit", token: "AVAX", amount: 100 }]
  },
  {
    id: "justn-photog",
    deck: "community",
    title: "@JustnThePhotog threatens to cut it off",
    description: "Lose 100 AVAX.",
    effects: [{ type: "debit", token: "AVAX", amount: 100, toFreeParking: true }]
  },
  {
    id: "polypup-experiment",
    deck: "community",
    title: "@PolyPup1 launches an onchain experiment",
    description: "Earn 100 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 100 }]
  },
  {
    id: "avalore-quest",
    deck: "community",
    title: "Avalore questline trends",
    description: "Collect 80 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 80 }],
    momentId: "avalore"
  },
  {
    id: "avery-alpha",
    deck: "community",
    title: "Avery drops strategy alpha",
    description: "Collect 60 AVAX and 15 KET.",
    effects: [
      { type: "credit", token: "AVAX", amount: 60 },
      { type: "credit", token: "KET", amount: 15 }
    ],
    momentId: "avery"
  },
  {
    id: "voh-spaces",
    deck: "community",
    title: "VOH keeps the late-night timeline alive",
    description: "Collect 50 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 50 }],
    momentId: "voh"
  },
  {
    id: "hcash-rumors",
    deck: "community",
    title: "HCash rumors spread",
    description: "Pay 60 AVAX into the Liquidity Pool.",
    effects: [{ type: "debit", token: "AVAX", amount: 60, toFreeParking: true }],
    momentId: "hcash"
  },
  {
    id: "bands-floor-bid",
    deck: "community",
    title: "BANDS defend the floor bid",
    description: "Collect 70 AVAX if you own any NFT property.",
    effects: [{ type: "conditionalCredit", token: "AVAX", amount: 70, propertyGroup: "NFT" }],
    momentId: "bands"
  },
  {
    id: "community-problem",
    deck: "community",
    title: "Community is the Problem",
    description: "Pay 90 AVAX.",
    effects: [{ type: "debit", token: "AVAX", amount: 90, toFreeParking: true }]
  },
  {
    id: "nochill-weekend",
    deck: "community",
    title: "Avax Has No Chill weekend",
    description: "Collect 40 NOCHILL.",
    effects: [{ type: "credit", token: "NOCHILL", amount: 40 }]
  }
];

export const REWARDS_DECK: CardDefinition[] = [
  {
    id: "etf-filing",
    deck: "rewards",
    title: "Institutional ETF filing",
    description: "Collect 300 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 300 }]
  },
  {
    id: "arena-pump",
    deck: "rewards",
    title: "Arena pump",
    description: "Collect 150 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 150 }]
  },
  {
    id: "validator-rewards",
    deck: "rewards",
    title: "Validator rewards",
    description: "Collect 100 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 100 }]
  },
  {
    id: "gas-fees",
    deck: "rewards",
    title: "Gas fees",
    description: "Pay 25 AVAX per active player.",
    effects: [{ type: "perPlayerDebit", token: "AVAX", amount: 25 }]
  },
  {
    id: "coq-season",
    deck: "rewards",
    title: "COQ season returns",
    description: "Collect 40 COQ.",
    effects: [{ type: "credit", token: "COQ", amount: 40 }]
  },
  {
    id: "ket-rotation",
    deck: "rewards",
    title: "KET rotation hits the timeline",
    description: "Collect 30 KET.",
    effects: [{ type: "credit", token: "KET", amount: 30 }]
  },
  {
    id: "nochill-bid",
    deck: "rewards",
    title: "NOCHILL survives the weekend",
    description: "Collect 35 NOCHILL.",
    effects: [{ type: "credit", token: "NOCHILL", amount: 35 }]
  },
  {
    id: "avalore-reward",
    deck: "rewards",
    title: "Avalore daily reward",
    description: "Collect 75 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 75 }],
    momentId: "avalore"
  },
  {
    id: "avery-path",
    deck: "rewards",
    title: "Avery guides the path",
    description: "Move to Enter the Arena and collect GO reward.",
    effects: [{ type: "move", tileIndex: 0, collectGo: true }],
    momentId: "avery"
  },
  {
    id: "voh-open-mic",
    deck: "rewards",
    title: "VOH open mic keeps morale high",
    description: "Collect 65 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 65 }],
    momentId: "voh"
  }
];

