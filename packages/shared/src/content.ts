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
    title: "Community is the Problem",
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
    id: "avery-nose-clip",
    title: "Avery's Nose Clip",
    description: "A legendary bit enters the board as a momentum tile instead of a second Arena.",
    tags: ["community", "lore", "avalanche-native"]
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
  },
  {
    id: "stupifff-alpha",
    title: "@Stupifff shares alpha",
    description: "The kind of timeline post that sends a whole group chat back onchain.",
    tags: ["community", "alpha", "cards"]
  },
  {
    id: "neothon-good-vibes",
    title: "@0xNeothon spreads good vibes",
    description: "For one brief moment the Avalanche timeline becomes a pleasant place to be.",
    tags: ["community", "cards", "positive"]
  },
  {
    id: "justn-photog",
    title: "@JustnThePhotog threatens to cut it off",
    description: "A reminder that content, morale, and market structure are more correlated than they should be.",
    tags: ["community", "cards", "fud"]
  },
  {
    id: "polypup-experiment",
    title: "@PolyPup1 launches an onchain experiment",
    description: "Avalanche-native curiosity pays out when someone ships instead of posting.",
    tags: ["builder", "cards", "onchain"]
  },
  {
    id: "community-problem",
    title: "Community is the Problem",
    description: "A legendary phrase enters the room and suddenly everyone gets defensive.",
    tags: ["lore", "cards", "community"]
  },
  {
    id: "coq-season",
    title: "COQ season returns",
    description: "Meme gravity reasserts itself and nobody even pretends to resist.",
    tags: ["meme", "cards", "coq"]
  },
  {
    id: "ket-rotation",
    title: "KET rotation hits the timeline",
    description: "The board catches one of those rotations that feels obvious only after it happens.",
    tags: ["meme", "cards", "ket"]
  },
  {
    id: "nochill-weekend",
    title: "Avax Has No Chill weekend",
    description: "Posting volume, stress levels, and meme conviction all climb together.",
    tags: ["meme", "cards", "nochill"]
  },
  {
    id: "etf-filing",
    title: "Institutional ETF filing",
    description: "Everyone starts speaking in inflows, narratives, and inevitable adoption charts.",
    tags: ["institutional", "cards", "rewards"]
  },
  {
    id: "arena-pump",
    title: "Arena pump",
    description: "Momentum returns and the board briefly feels like it was always destined to work.",
    tags: ["arena", "cards", "rewards"]
  },
  {
    id: "validator-rewards",
    title: "Validator rewards",
    description: "The quiet, dependable side of Avalanche gets its moment on stage.",
    tags: ["validator", "cards", "rewards"]
  },
  {
    id: "gas-fees",
    title: "Gas fees",
    description: "Even on the good days, the chain reminds you that activity is never free.",
    tags: ["fees", "cards", "rewards"]
  }
];

export const BOARD_TILES: BoardTile[] = [
  {
    index: 0,
    name: "Enter the Arena",
    kind: "go",
    description: "Collect 20 AVAX when you pass or land here."
  },
  {
    index: 1,
    name: "LFJ",
    kind: "property",
    description: "DEX culture starts the loop.",
    group: "DEXs",
    cost: 12,
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
    cost: 12,
    baseRent: 3,
    monopolyRent: 6,
    rentToken: "KET"
  },
  {
    index: 4,
    name: "Staking Tax",
    kind: "tax",
    description: "Pay 20 AVAX into the Liquidity Pool.",
    amount: 20
  },
  {
    index: 5,
    name: "DFK Chain",
    kind: "rail",
    description: "L1 rail equivalent. Rent is always paid in AVAX.",
    cost: 25,
    rentSteps: [6, 12, 24, 40]
  },
  {
    index: 6,
    name: "Benqi",
    kind: "property",
    description: "Lending and incentives tile.",
    group: "Lending",
    cost: 18,
    baseRent: 4,
    monopolyRent: 8,
    rentToken: "KET"
  },
  {
    index: 7,
    name: "@twitt_tr FUDs Your Project",
    kind: "card",
    description: "Draw from Community / FUD and brace for the timeline.",
    deck: "community",
    momentIds: ["twitt-fud"]
  },
  {
    index: 8,
    name: "Aave V3",
    kind: "property",
    description: "Another lending stop.",
    group: "Lending",
    cost: 18,
    baseRent: 4,
    monopolyRent: 10,
    rentToken: "KET"
  },
  {
    index: 9,
    name: "Avax Rush",
    kind: "property",
    description: "Collect 25 AVAX when you land here, plus 5 AVAX if you already own Lending.",
    group: "Lending",
    cost: 22,
    baseRent: 5,
    monopolyRent: 12,
    rentToken: "KET"
  },
  {
    index: 10,
    name: "Jail",
    kind: "jail",
    description: "Just visiting, unless the timeline threw you in here."
  },
  {
    index: 11,
    name: "Coq Inu",
    kind: "property",
    description: "Meme rent is paid in COQ.",
    group: "Meme",
    cost: 28,
    baseRent: 6,
    monopolyRent: 12,
    rentToken: "COQ"
  },
  {
    index: 12,
    name: "Chainlink Oracle",
    kind: "utility",
    description: "Pay three times the dice roll in AVAX.",
    cost: 30,
    rollMultiplier: 3
  },
  {
    index: 13,
    name: "Avax Has No Chill",
    kind: "property",
    description: "The timeline heats up and rent is paid in NOCHILL.",
    group: "Meme",
    cost: 28,
    baseRent: 6,
    monopolyRent: 13,
    rentToken: "NOCHILL"
  },
  {
    index: 14,
    name: "Yellow Ket",
    kind: "property",
    description: "The final meme lane slot uses KET.",
    group: "Meme",
    cost: 32,
    baseRent: 7,
    monopolyRent: 15,
    rentToken: "KET"
  },
  {
    index: 15,
    name: "Beam L1",
    kind: "rail",
    description: "Another L1 rail equivalent.",
    cost: 25,
    rentSteps: [6, 12, 24, 40]
  },
  {
    index: 16,
    name: "Blaze",
    kind: "property",
    description: "Blaze takes the old Joepegs slot in the NFT row.",
    group: "NFT",
    cost: 36,
    baseRent: 8,
    monopolyRent: 16,
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
    cost: 36,
    baseRent: 8,
    monopolyRent: 17,
    rentToken: "KET",
    momentIds: ["bands"]
  },
  {
    index: 19,
    name: "Pharaoh",
    kind: "property",
    description: "The last DEX stop closes the early game loop.",
    group: "DEXs",
    cost: 24,
    baseRent: 5,
    monopolyRent: 9,
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
    cost: 44,
    baseRent: 10,
    monopolyRent: 20,
    rentToken: "KET"
  },
  {
    index: 22,
    name: "Community is the Problem",
    kind: "card",
    description: "Draw a community/fud moment.",
    deck: "community",
    momentIds: ["community-problem"]
  },
  {
    index: 23,
    name: "Salvor",
    kind: "property",
    description: "Gaming row continues.",
    group: "Gaming",
    cost: 44,
    baseRent: 10,
    monopolyRent: 22,
    rentToken: "KET"
  },
  {
    index: 24,
    name: "Off The Grid",
    kind: "property",
    description: "A higher-stakes gaming lane.",
    group: "Gaming",
    cost: 48,
    baseRent: 12,
    monopolyRent: 24,
    rentToken: "KET"
  },
  {
    index: 25,
    name: "Dexalot L1",
    kind: "rail",
    description: "L1 rail equivalent.",
    cost: 25,
    rentSteps: [6, 12, 24, 40]
  },
  {
    index: 26,
    name: "Ferdy Fish",
    kind: "property",
    description: "Violet row starts with native lore.",
    group: "Lore",
    cost: 52,
    baseRent: 12,
    monopolyRent: 25,
    rentToken: "AVAX"
  },
  {
    index: 27,
    name: "AVAX Foundation",
    kind: "property",
    description: "Institutional backbone of the board.",
    group: "Lore",
    cost: 52,
    baseRent: 12,
    monopolyRent: 26,
    rentToken: "AVAX"
  },
  {
    index: 28,
    name: "Avery's Nose Clip",
    kind: "bonus",
    description: "A lore tile that rewards momentum without duplicating Arena.",
    effect: {
      id: "avery-nose-clip",
      description: "Collect 18 AVAX from the bank."
    },
    momentIds: ["avery-nose-clip"]
  },
  {
    index: 29,
    name: "Wrathank's Grift",
    kind: "property",
    description: "Late-violet Avalanche lore.",
    group: "Lore",
    cost: 56,
    baseRent: 14,
    monopolyRent: 28,
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
    cost: 60,
    baseRent: 14,
    monopolyRent: 30,
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
    cost: 60,
    baseRent: 14,
    monopolyRent: 31,
    rentToken: "KET"
  },
  {
    index: 34,
    name: "AVAX Validators",
    kind: "rail",
    description: "Final L1 rail equivalent.",
    cost: 25,
    rentSteps: [6, 12, 24, 40]
  },
  {
    index: 35,
    name: "Giraffe Comics",
    kind: "property",
    description: "Culture row closes here.",
    group: "Culture",
    cost: 64,
    baseRent: 16,
    monopolyRent: 32,
    rentToken: "KET"
  },
  {
    index: 36,
    name: "Sends 30M to Coinbase",
    kind: "bonus",
    description: "A market shock tile that taxes confidence.",
    effect: {
      id: "coinbase-transfer",
      description: "Pay 24 AVAX into the Liquidity Pool."
    },
    momentIds: ["coinbase-transfer"]
  },
  {
    index: 37,
    name: "Core Wallet",
    kind: "property",
    description: "Infrastructure row begins.",
    group: "Infrastructure",
    cost: 84,
    baseRent: 18,
    monopolyRent: 36,
    rentToken: "AVAX"
  },
  {
    index: 38,
    name: "Inscription Gas Spike",
    kind: "tax",
    description: "Pay 12 AVAX into the Liquidity Pool.",
    amount: 12,
    momentIds: ["inscription-gas-spike"]
  },
  {
    index: 39,
    name: "VOH",
    kind: "property",
    description: "VOH takes the old Avalanche L1 slot as the top-end late-night culture tile.",
    group: "Infrastructure",
    cost: 99,
    baseRent: 24,
    monopolyRent: 48,
    rentToken: "AVAX",
    momentIds: ["voh"]
  }
];

export const COMMUNITY_DECK: CardDefinition[] = [
  {
    id: "market-panic",
    deck: "community",
    title: "Market panic after a large transfer",
    description: "Lose 30 AVAX to the Liquidity Pool.",
    effects: [{ type: "debit", token: "AVAX", amount: 30, toFreeParking: true }],
    momentId: "coinbase-transfer"
  },
  {
    id: "stupifff-alpha",
    deck: "community",
    title: "@Stupifff shares alpha",
    description: "Earn 18 AVAX from the bank. If you own any Culture property, earn an extra 8 AVAX.",
    effects: [
      { type: "credit", token: "AVAX", amount: 18 },
      { type: "conditionalCredit", token: "AVAX", amount: 8, propertyGroup: "Culture" }
    ],
    momentId: "stupifff-alpha"
  },
  {
    id: "neothon-good-vibes",
    deck: "community",
    title: "@0xNeothon spreads good vibes",
    description: "Collect 16 AVAX from the bank.",
    effects: [{ type: "credit", token: "AVAX", amount: 16 }],
    momentId: "neothon-good-vibes"
  },
  {
    id: "justn-photog",
    deck: "community",
    title: "@JustnThePhotog threatens to cut it off",
    description: "Lose 18 AVAX.",
    effects: [{ type: "debit", token: "AVAX", amount: 18, toFreeParking: true }],
    momentId: "justn-photog"
  },
  {
    id: "polypup-experiment",
    deck: "community",
    title: "@PolyPup1 launches an onchain experiment",
    description: "Earn 16 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 16 }],
    momentId: "polypup-experiment"
  },
  {
    id: "avalore-quest",
    deck: "community",
    title: "Avalore questline trends",
    description: "Collect 14 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 14 }],
    momentId: "avalore"
  },
  {
    id: "avery-alpha",
    deck: "community",
    title: "Avery drops strategy alpha",
    description: "Collect 12 AVAX and 6 KET.",
    effects: [
      { type: "credit", token: "AVAX", amount: 12 },
      { type: "credit", token: "KET", amount: 6 }
    ],
    momentId: "avery"
  },
  {
    id: "voh-spaces",
    deck: "community",
    title: "VOH keeps the late-night timeline alive",
    description: "Collect 10 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 10 }],
    momentId: "voh"
  },
  {
    id: "hcash-rumors",
    deck: "community",
    title: "HCash rumors spread",
    description: "Pay 12 AVAX into the Liquidity Pool.",
    effects: [{ type: "debit", token: "AVAX", amount: 12, toFreeParking: true }],
    momentId: "hcash"
  },
  {
    id: "bands-floor-bid",
    deck: "community",
    title: "BANDS defend the floor bid",
    description: "Collect 14 AVAX if you own any NFT property.",
    effects: [{ type: "conditionalCredit", token: "AVAX", amount: 14, propertyGroup: "NFT" }],
    momentId: "bands"
  },
  {
    id: "community-problem",
    deck: "community",
    title: "Community is the Problem",
    description: "Pay 16 AVAX.",
    effects: [{ type: "debit", token: "AVAX", amount: 16, toFreeParking: true }],
    momentId: "community-problem"
  },
  {
    id: "nochill-weekend",
    deck: "community",
    title: "Avax Has No Chill weekend",
    description: "Collect 12 NOCHILL.",
    effects: [{ type: "credit", token: "NOCHILL", amount: 12 }],
    momentId: "nochill-weekend"
  }
];

export const REWARDS_DECK: CardDefinition[] = [
  {
    id: "etf-filing",
    deck: "rewards",
    title: "Institutional ETF filing",
    description: "Collect 40 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 40 }],
    momentId: "etf-filing"
  },
  {
    id: "arena-pump",
    deck: "rewards",
    title: "Arena pump",
    description: "Collect 18 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 18 }],
    momentId: "arena-pump"
  },
  {
    id: "validator-rewards",
    deck: "rewards",
    title: "Validator rewards",
    description: "Collect 15 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 15 }],
    momentId: "validator-rewards"
  },
  {
    id: "gas-fees",
    deck: "rewards",
    title: "Gas fees",
    description: "Pay 6 AVAX per active player.",
    effects: [{ type: "perPlayerDebit", token: "AVAX", amount: 6 }],
    momentId: "gas-fees"
  },
  {
    id: "coq-season",
    deck: "rewards",
    title: "COQ season returns",
    description: "Collect 12 COQ.",
    effects: [{ type: "credit", token: "COQ", amount: 12 }],
    momentId: "coq-season"
  },
  {
    id: "ket-rotation",
    deck: "rewards",
    title: "KET rotation hits the timeline",
    description: "Collect 10 KET.",
    effects: [{ type: "credit", token: "KET", amount: 10 }],
    momentId: "ket-rotation"
  },
  {
    id: "nochill-bid",
    deck: "rewards",
    title: "NOCHILL survives the weekend",
    description: "Collect 10 NOCHILL.",
    effects: [{ type: "credit", token: "NOCHILL", amount: 10 }],
    momentId: "nochill-weekend"
  },
  {
    id: "avalore-reward",
    deck: "rewards",
    title: "Avalore daily reward",
    description: "Collect 16 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 16 }],
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
    description: "Collect 14 AVAX.",
    effects: [{ type: "credit", token: "AVAX", amount: 14 }],
    momentId: "voh"
  }
];
