# Indexer returns null fundingRate / indexPrice / fundingWindowSec / fundingIntervalSec for live perp pools with fresh on-chain values

Severity: major
Area: API

## Steps to reproduce

1. Use `@somnia-chain/markets-sdk` 0.32.1 on the Somnia Tokyo testnet (Hideki, chain 50383), indexer `https://hideki-dev.smk.somnia.host/v1/graphql`.
2. Call `client.listPerpMarkets({ limit: 100 })` (or the equivalent GraphQL query behind it).
3. Inspect the rows for pools `0xaa1fdee96042333970950728bbb79afbc6af1c98` (T281A66), `0x2886a8fc3c18ddf019a23623e5f221824e830fe2` (T181A66), and `0x736850b162802db2b54d766c686e65e1b31eb954` (LOADTEST).
4. Read the same pools on-chain over HTTP RPC `https://api.hideki2.infra.testnet.somnia.network` with `eth_call`:
   - `getIndexPrice()` / `getIndexPriceUpdatedAt()`
   - `getCurrentFundingRate()` (per the SDK's own perpPoolReadAbi: `getIndexPrice() (uint256, uint256)`, `getCurrentFundingRate() (int256)`)

## Expected

The docs (https://prd.smk.somnia.host/docs/typescript/perps) state: *"Funding (`FundingUpdated`) and open interest (`OpenInterestUpdated`) stream into the perp market row live."* A live pool with a fresh on-chain index price should have non-null `fundingRate`, `indexPrice`, `fundingWindowSec`, and `fundingIntervalSec`. Every live pool has a funding rate on-chain (the `interestRatePerWindow` parameter, 1e14 on these pools) and a funding window (28800 s) — these values are knowable from the contract at index time even if no `FundingUpdated` event has ever fired.

## Actual

All four fields are `null` on the indexer rows, even though the pools are live and their on-chain index prices were updated seconds before the read:

| Pool | Indexer fundingRate / indexPrice / fundingWindowSec / fundingIntervalSec | On-chain at the same time |
|---|---|---|
| T281A66 `0xaa1f…1c98` (2 trades) | all null | index 1.0203, `updatedAt` 1794710806 (seconds before read); funding 1e14 |
| T181A66 `0x2886…0fe2` (11 trades) | all null | index 66,466, `updatedAt` 1794710849 (seconds before read); funding 1e14 |
| LOADTEST `0x7368…b954` (2,498 trades) | all null | funding 1e14 (index 2.4195, `updatedAt` 1794407119 — ~3.5 days stale; `tryGetMarkPrice` = `[false, 0]`, i.e. its mark feed is dead) |

A control pool, T581A66, is populated correctly (index 66,386.1, `updatedAt` 1794710849, funding 1e14) — so the indexer does fill these fields for some pools and silently drops them for others. The pattern matches "funding data only populated from `FundingUpdated` events": the affected pools' last funding update is their creation time (~1794577xxx, ~1.5 days before the read), i.e. they never settled post-creation, so no funding row ever existed — even though the pool is live and the value exists on-chain.

## Evidence

- `listPerpMarkets` response (2026-11-15 ~09:47 WIB, SDK 0.32.1): 60 rows; T281A66 / T181A66 / LOADTEST `0x7368…` show `fundingRate: null`, `fundingWindowSec: null`, `fundingIntervalSec: null`, `indexPrice: null` (T281A66 `openInterest: 0`, T181A66 `openInterest: 0`).
- On-chain `eth_call` reads (2026-11-15 ~09:50 WIB, block ~50,562,xxx): T281A66 `getIndexPrice()` = `1.0203e18`, `updatedAt` = 1794710806; `getCurrentFundingRate()` = 1e14. T181A66 `getIndexPrice()` = `6.6466e22`, `updatedAt` = 1794710849; funding = 1e14. LOADTEST `0x7368…` funding = 1e14.
- Cross-check on BTC/ETH/NEAR: on-chain funding equals the indexer `fundingRate` exactly (BTC 1e14, ETH −329114968578165, NEAR −18191454722485), so the on-chain read is the correct source of truth — the nulls are an indexer gap, not a chain-side absence.
- Consumer impact: any client that reads funding from `listPerpMarkets` sees `null` for these live markets and, if it falls back to `0` (as the community funding-monitor bot example does: `market.fundingRate || market.currentFundingRate || 0`), silently reports funding as 0.00% instead of the real 0.01%/8h.

## Environment

- SDK version: `@somnia-chain/markets-sdk` 0.32.1 (the version the dreamDEX app runs; latest on npm 0.33.0)
- Network: Somnia Tokyo testnet (Hideki, chain 50383)
- Wallet address: 0xa505479a6410a848d41fc0f495e431e558233ff3
- Date observed: 2026-11-15 ~09:47–09:50 WIB

## Suggested fix

Seed perp market rows from the chain at index time (as the release notes say `loadMarkets()` now does for discovery): backfill `fundingRate` from `getCurrentFundingRate()`, `indexPrice` from `getIndexPrice()`, and `fundingWindowSec`/`fundingIntervalSec` from `getFundingParameters()` when a pool has never emitted a `FundingUpdated` event, instead of leaving the fields null. At minimum, document that these fields are null until the first post-creation settlement, so consumers do not treat null as "no funding".

## Duplicate-check note

- `somnia-chain/somnia-markets` issue tracker could not be searched — the repo returns 404 via the GitHub API (private/renamed), so no public tracker exists to check against.
- `somnia-chain/dreamdex-bot-kit` issues searched for `fundingRate`, `funding`, `null`, `listPerpMarkets`: 0 hits.
- Web search found no matching public report.
- Residual limit: other bounty submissions are not public, so a same-day duplicate by another hunter cannot be fully excluded.
