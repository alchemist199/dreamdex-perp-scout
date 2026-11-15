# dreamdex-perp-scout

Read-only perp-market scout for [dreamDEX](https://app.testnet.dreamdex.io) on the
Somnia Hideki testnet, built with `@somnia-chain/markets-sdk` (v0.32.1 — the version
the dreamDEX app runs).

It lists every perp market with its pool address, initial margin, funding rate,
index price, open interest and trade count, then spot-checks the first market's
live on-chain state. No signer, no transactions, no private keys — read-only.

Built as proof of building for the
[dreamDEX Perps Builder Bounty](https://dorahacks.io/hackathon/dreamdex-perps-bounty/detail)
on DoraHacks, and as scaffolding for Feedback-track research into the Markets SDK,
the indexer API and the perp pools on Somnia Tokyo testnet.

## Run

```bash
npm install
npm start
```

## Stack

- `@somnia-chain/markets-sdk` 0.32.1
- `viem`
- Indexer: `https://hideki-dev.smk.somnia.host/v1/graphql`
- Chain: Somnia Hideki testnet
