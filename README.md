# Avaxopoly

Bare-minimum Avaxopoly MVP scaffold:

- `apps/web`: React + Three.js frontend with wallet connect, deposit flow, board view, and single-player turn loop
- `apps/server`: authoritative offchain game service with in-memory sessions and settlement signing
- `packages/shared`: data-driven board content, card content, narrative moments, and game engine
- `contracts`: Avalanche Fuji `GameBank` escrow/settlement contract plus mock ERC-20s and tests

## Quick Start

1. Install dependencies with `pnpm install`.
2. Copy environment files:
   - `apps/server/.env.example` to `apps/server/.env`
   - `apps/web/.env.example` to `apps/web/.env`
3. Set Fuji RPC, GameBank address, token addresses, payout caps, swap rates, and WalletConnect project ID.
4. Run the backend with `pnpm dev:server`.
5. Run the frontend with `pnpm dev:web`.

## MVP Scope

- Single human player with 3 scripted bots
- Offchain rules and in-memory sessions
- Onchain Fuji escrow and payout settlement
- Data-driven Avalanche-native board moments and cards
- Supported settlement tokens: `AVAX`, `COQ`, `KET`, `NOCHILL`

## Current Gaps

- Requires real config values for Fuji token addresses and treasury signer
- No persistence layer yet; sessions reset on server restart
- Houses, hotels, auctions, multiplayer, and trading are intentionally out of scope
