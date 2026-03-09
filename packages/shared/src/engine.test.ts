import { describe, expect, it } from "vitest";

import { NARRATIVE_MOMENTS } from "./content";
import {
  activateSession,
  buildSettlementPayload,
  createSession,
  liquidationPayout,
  swapTokens
} from "./engine";

describe("shared game content", () => {
  it("includes the requested Avalanche-native moments as data", () => {
    const ids = NARRATIVE_MOMENTS.map((moment) => moment.id);
    expect(ids).toContain("avalore");
    expect(ids).toContain("avery");
    expect(ids).toContain("voh");
    expect(ids).toContain("hcash");
    expect(ids).toContain("bands");
  });
});

describe("shared game engine", () => {
  it("activates a session and supports fixed-rate swaps", () => {
    const session = createSession({
      id: "0x1111111111111111111111111111111111111111111111111111111111111111",
      playerAddress: "0x000000000000000000000000000000000000dEaD"
    });

    activateSession(session, {
      AVAX: 100,
      COQ: 0,
      KET: 0,
      NOCHILL: 0
    });

    swapTokens(session, "player", "AVAX", "COQ", 10);
    const player = session.players[0];

    expect(player?.balances.AVAX).toBe(90);
    expect(player?.balances.COQ).toBe(50);
  });

  it("builds a settlement payload with property liquidation value", () => {
    const session = createSession({
      id: "0x2222222222222222222222222222222222222222222222222222222222222222",
      playerAddress: "0x000000000000000000000000000000000000dEaD"
    });

    activateSession(session, {
      AVAX: 100,
      COQ: 0,
      KET: 0,
      NOCHILL: 0
    });

    const player = session.players[0];
    if (!player) {
      throw new Error("Missing player");
    }
    player.properties.push(1);
    player.balances.AVAX = 80;
    session.status = "game_over";

    expect(liquidationPayout(session).AVAX).toBe(110);
    expect(buildSettlementPayload(session).playerAddress).toBe("0x000000000000000000000000000000000000dEaD");
  });
});

