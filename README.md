# dreamdex-perp-scout

A small read-only script that lists every perp market on dreamDEX testnet (Somnia Hideki) and prints funding, index price, open interest and trade counts. It also spot-checks one market's live on-chain state.

I wrote it while poking around the Markets SDK for the dreamDEX Perps Builder Bounty. It uses `@somnia-chain/markets-sdk` 0.32.1, the same version the dreamDEX app runs. No wallet, no signing, no transactions. It only reads.

## Run it

```bash
npm install
npm start
```

## What's in here

- `index.mjs` — the scout itself
- `feedback/` — three issues I found while testing the SDK, the indexer and the docs: one about null funding fields on live pools, one about the claimed 10 ms block time, and one about the docs only listing BTC and ETH

## Setup

- SDK: `@somnia-chain/markets-sdk` 0.32.1
- Chain: Somnia Hideki testnet (50383)
- Indexer: https://hideki-dev.smk.somnia.host/v1/graphql
