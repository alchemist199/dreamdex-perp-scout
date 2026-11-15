# Perps docs say only BTC and ETH are live, but 60 perp markets are

Severity: normal
Area: docs

## Steps to reproduce

1. Open the SDK perps docs at https://prd.smk.somnia.host/docs/typescript/perps. It says: "Perps are live on testnet: `BTC/USDSO:USDSO` and `ETH/USDSO:USDSO`".
2. On the Somnia Tokyo testnet (Hideki, chain 50383), call `client.listPerpMarkets({ limit: 100 })` from `@somnia-chain/markets-sdk` 0.32.1 (indexer `https://hideki-dev.smk.somnia.host/v1/graphql`).
3. Count the markets and compare with the docs.

## Expected

The docs should list the live markets, or at least not contradict them. A developer reading the perps page should learn which markets exist before writing a bot.

## Actual

60 perp markets are live, not 2. Besides BTC (1,759,033 trades) and ETH (907,704 trades), the live set includes SOL (707,058), HYPE (669,580), NEAR (542,236), XRP, DOGE, ADA, BNB, LINK, AVAX, SUI, TAO, WLD, XLM, ZEC, PUMP, 1000PEPE, VVV, LIT, ZRO, commodities (WTI, XAG, XAU) and equities (GOOGL, TSLA, HYNX, MSTR, MRVL, LITE, INTC, HOOD, COIN, AMD, ADLT). They all share MarginBank `0x478769E1177C0773c43A593DCCc4Ad15F15F1394`, with `initialMarginBps` of 250 (20x), 500 (10x), 1000 (5x) or 2000 (2.5x). The set also includes test and load markets (T-series pools and LOADTEST), which the docs don't mention either.

The same "only BTC and ETH" wording shows up on the SDK docs index page (https://prd.smk.somnia.host/docs/typescript). The perps page is the one that states it outright.

## Evidence

- Docs (https://prd.smk.somnia.host/docs/typescript/perps): "Perps are live on testnet: `BTC/USDSO:USDSO` and `ETH/USDSO:USDSO`, backed by PerpPool CLOBs riding the same shared OrderBook core as spot and binary."
- `listPerpMarkets({ limit: 100 })` response (2026-11-15 around 09:47 WIB, SDK 0.32.1): 60 rows. Symbols: BTC, ETH, SOL, XRP, DOGE, ADA, BNB, LINK, AVAX, SUI, TAO, WLD, NEAR, XLM, ZEC, PUMP, 1000PEPE, VVV, LIT, ZRO, WTI, XAG, XAU, GOOGL, TSLA, HYNX, MSTR, MRVL, LITE, INTC, HOOD, COIN, AMD, ADLT, plus T581A66, T481A66, T381A66, T281A66, T181A66, T5C1033…, T580E00…, T5AADFF… and LOADTEST (5 pools, same symbol, different pool addresses).
- The dreamDEX testnet app's own docs (https://app.testnet.dreamdex.io/docs/trading/perps-testnet/margin-and-liquidations) already describe the wider market set, so the SDK docs page is the stale one.

## Environment

- SDK version: `@somnia-chain/markets-sdk` 0.32.1 (the version the dreamDEX app runs; latest on npm is 0.33.0)
- Network: Somnia Tokyo testnet (Hideki, chain 50383)
- Wallet address: 0xa505479a6410a848d41fc0f495e431e558233ff3
- Date observed: 2026-11-15 around 09:47 WIB

## Suggested fix

Update the perps docs page to describe the live market set, or point at `listPerpMarkets` as the source of truth, instead of hard-coding "BTC and ETH". If the extra markets are intentional but unlisted, say so and explain their status (for example which ones are load-test pools).

## Duplicate check

I searched the public `somnia-chain/dreamdex-bot-kit` repo for `listPerpMarkets` and "perp markets" and found nothing. The `somnia-chain/somnia-markets` repo returns 404 through the GitHub API (private or renamed), so I could not search its tracker. Other bounty submissions are not public, so I can't rule out someone else reporting the same thing today. This is the most visible of the three issues, so it's also the most likely to be reported by someone else.
