import cors from "cors";
import express from "express";

import { loadConfig } from "./config";
import { SessionStore } from "./store";

const config = loadConfig();
const store = new SessionStore(config);
const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/config", (_request, response) => {
  response.json({
    chainId: config.chainId,
    gameBankAddress: config.gameBankAddress,
    tokenAddresses: config.tokenAddresses,
    payoutCaps: config.payoutCaps,
    swapRates: config.swapRates
  });
});

app.post("/api/sessions", (request, response, next) => {
  try {
    const { playerAddress, playerName } = request.body as { playerAddress?: string; playerName?: string };
    if (!playerAddress) {
      throw new Error("playerAddress is required.");
    }
    response.status(201).json(store.create(playerAddress, playerName));
  } catch (error) {
    next(error);
  }
});

app.get("/api/sessions/:sessionId", (request, response, next) => {
  try {
    response.json(store.get(request.params.sessionId));
  } catch (error) {
    next(error);
  }
});

app.post("/api/sessions/:sessionId/activate", async (request, response, next) => {
  try {
    const { deposits } = request.body as {
      deposits?: Array<{ token: "AVAX" | "COQ" | "KET" | "NOCHILL"; amount: number; txHash?: string }>;
    };
    if (!deposits?.length) {
      throw new Error("At least one deposit is required.");
    }
    response.json(await store.activate(request.params.sessionId, deposits));
  } catch (error) {
    next(error);
  }
});

app.post("/api/sessions/:sessionId/play", (request, response, next) => {
  try {
    response.json(store.play(request.params.sessionId));
  } catch (error) {
    next(error);
  }
});

app.post("/api/sessions/:sessionId/decision", (request, response, next) => {
  try {
    const { action } = request.body as { action?: "buy" | "skip" | "settle-debt" };
    if (!action) {
      throw new Error("action is required.");
    }
    response.json(store.decide(request.params.sessionId, action));
  } catch (error) {
    next(error);
  }
});

app.post("/api/sessions/:sessionId/swap", (request, response, next) => {
  try {
    const { fromToken, toToken, amount } = request.body as {
      fromToken?: "AVAX" | "COQ" | "KET" | "NOCHILL";
      toToken?: "AVAX" | "COQ" | "KET" | "NOCHILL";
      amount?: number;
    };
    if (!fromToken || !toToken || typeof amount !== "number") {
      throw new Error("fromToken, toToken, and amount are required.");
    }
    response.json(store.swap(request.params.sessionId, fromToken, toToken, amount));
  } catch (error) {
    next(error);
  }
});

app.get("/api/sessions/:sessionId/settlement", async (request, response, next) => {
  try {
    response.json(await store.settlement(request.params.sessionId));
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  response.status(400).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`Avaxopoly server listening on http://localhost:${config.port}`);
});

