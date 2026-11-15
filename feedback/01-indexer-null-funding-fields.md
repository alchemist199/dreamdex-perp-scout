# Indexer returns null funding and index fields for live perp pools that have fresh on-chain values

Severity: major
Area: API

## Steps to reproduce

1. Use `@somnia-chain/markets-sdk` 0.32.1 on the Somnia Tokyo testnet (Hideki, chain 50383). The indexer is `https://hideki-dev.smk.somnia.host/v1/graphql`.
2. Call `client.listPerpMarkets({ limit: 100 })`.
3. Look at the rows for pools `0xaa1fdee96042333970950728bbb79afbc6af1c98` (T281A66), `0x2886a8fc3c18ddf019a23623e5f221824e830fe2` (T181A66) and `0x736850b162802db2b54d766c686e65e1b31eb954` (LOADTEST).
4. Read the same pools on-chain over `https://api.hideki2.infra.testnet.somnia.network` with `eth_call`: `getIndexPrice()` / `getIndexPriceUpdatedAt()` and `getCurrentFundingRate()`.

## Expected

The docs say funding and open interest "stream into the perp market row live". A live pool with a fresh on-chain index price should show a funding rate, an index price and the funding window. Every live pool has a funding rate on-chain (1e14 on these pools, the `interestRatePerWindow` parameter) and a funding window of 28800 seconds, so the indexer can know these values even if no `FundingUpdated` event ever fired.

## Actual

All four fields come back null for those pools, even though they are live and their on-chain index prices were updated seconds before I read them:

| Pool | Indexer fundingRate / indexPrice / fundingWindowSec / fundingIntervalSec | On-chain at the same time |
|---|---|---|
| T281A66 `0xaa1f…1c98` (2 trades) | all null | index 1.0203, `updatedAt` 1794710806 (seconds before the read); funding 1e14 |
| T181A66 `0x2886…0fe2` (11 trades) | all null | index 66,466, `updatedAt` 1794710849 (seconds before the read); funding 1e14 |
| LOADTEST `0x7368…b954` (2,498 trades) | all null | funding 1e14 (index 2.4195, `updatedAt` 1794407119, about 3.5 days stale; `tryGetMarkPrice` returns `[false, 0]`, so its mark feed is dead) |

A control pool, T581A66, is filled in correctly (index 66,386.1, `updatedAt` 1794710849, funding 1e14). So the indexer does fill these fields for some pools and quietly leaves them blank for others. The pattern fits "funding data only shows up after a `FundingUpdated` event": the affected pools last had a funding update at creation, about a day and a half before I read them, so no funding row ever existed for them even though the pool is live and the value is right there on-chain.

Why it matters: any client that reads funding from `listPerpMarkets` gets null for these markets, and if it falls back to 0 (the community funding-monitor bot example does exactly this: `market.fundingRate || market.currentFundingRate || 0`), it reports funding as 0.00% instead of the real 0.01% per 8h.

## Evidence

- `listPerpMarkets` response (2026-11-15 around 09:47 WIB, SDK 0.32.1): 60 rows. T281A66, T181A66 and LOADTEST `0x7368…` show `fundingRate: null`, `fundingWindowSec: null`, `fundingIntervalSec: null`, `indexPrice: null`. T281A66 `openInterest: 0`, T181A66 `openInterest: 0`.
- On-chain `eth_call` reads (2026-11-15 around 09:50 WIB, block about 50,562,xxx): T281A66 `getIndexPrice()` = `1.0203e18`, `updatedAt` = 1794710806, `getCurrentFundingRate()` = 1e14. T181A66 `getIndexPrice()` = `6.6466e22`, `updatedAt` = 1794710849, funding = 1e14. LOADTEST `0x7368…` funding = 1e14.
- Sanity check on BTC, ETH and NEAR: the on-chain funding rate matches the indexer's `fundingRate` exactly (BTC 1e14, ETH -329114968578165, NEAR -18191454722485). So the on-chain read is the right source of truth, and the nulls are an indexer gap, not a missing value on-chain.

## Environment

- SDK version: `@somnia-chain/markets-sdk` 0.32.1 (the version the dreamDEX app runs; latest on npm is 0.33.0)
- Network: Somnia Tokyo testnet (Hideki, chain 50383)
- Wallet address: 0xa505479a6410a848d41fc0f495e431e558233ff3
- Date observed: 2026-11-15 around 09:47-09:50 WIB

## Suggested fix

Seed perp market rows from the chain when indexing (the release notes say `loadMarkets()` already does this for discovery): backfill `fundingRate` from `getCurrentFundingRate()`, `indexPrice` from `getIndexPrice()`, and `fundingWindowSec` / `fundingIntervalSec` from `getFundingParameters()` when a pool has never emitted a `FundingUpdated` event, instead of leaving the fields null. If that is too much, at least document that these fields stay null until the first settlement after creation, so nobody reads null as "no funding".

## Duplicate check

I searched the public `somnia-chain/dreamdex-bot-kit` repo for `fundingRate`, `funding`, `null` and `listPerpMarkets` and found nothing. The `somnia-chain/somnia-markets` repo returns 404 through the GitHub API (private or renamed), so I could not search its tracker. Other bounty submissions are not public, so I can't rule out someone else reporting the same thing today.
