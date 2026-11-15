# Hideki testnet blockTime is ~100 ms, not 10 ms as the SDK chain definition and docs claim

Severity: normal
Area: SDK

## Steps to reproduce

1. Read the SDK chain definition in `@somnia-chain/markets-sdk` 0.32.1, `src/chains/definitions/hidekiTestnet.ts:46` — `blockTime: 10`, with the comment *"blocks land every 10 ms (~100 blocks/s)"*. The SDK README also lists `hidekiTestnet (50383, 10 ms blocks)`, and the docs chains walkthrough table lists Hideki at **10 ms** (https://prd.smk.somnia.host/docs/typescript/chains-walkthrough), while every other Somnia chain (mainnet, Shannon, Elwood) is listed at 100 ms.
2. Measure the live chain over HTTP RPC `https://api.hideki2.infra.testnet.somnia.network`:
   - `eth_blockNumber` at two points 100 s apart, or `eth_getBlockByNumber` on a 1,000-block window.
3. Compare.

## Expected

If blocks land every 10 ms, a 1,000-block window spans ~10 s, and the chain height grows ~100 blocks/s. The docs go further and claim a performance consequence: *"blockTime drives viem's waiting heuristics. Hideki's `10` means `waitForTransactionReceipt` polls fast enough to return in tens of milliseconds."*

## Actual

Three independent measurements all agree on **~100 ms per block — 10× slower than claimed**:

- Block 50561967 → 50560967 (1,000 blocks): **100 s** → 100 ms/block.
- Blocks 50562161 / 50562151 / 50562061 / 50561661 (10 / 100 / 500-block windows): 1 s / 10 s / 50 s → **100 ms/block** in every window.
- Height math: block ~50,561,825 on 2026-11-15, counted from the v2 regenesis on 2026-09-17 (~59 days earlier) → **~9.9 blocks/s**; at 10 ms blocks the height would be ~510 M, not 50.5 M.

Consequence: any consumer that sizes polling, latency estimates, or "blocks per second" math off `blockTime: 10` (or off the docs' "100 blocks/s") is wrong by 10×, and the documented `waitForTransactionReceipt`-in-tens-of-milliseconds claim cannot hold — a receipt can only appear when the next block lands, ~100 ms apart on average.

## Evidence

- SDK source (0.32.1, extracted from the npm tarball): `src/chains/definitions/hidekiTestnet.ts` — `blockTime: 10`, comment *"blocks land every 10 ms (~100 blocks/s)"*. For comparison: `somniaMainnet.ts`, `somniaShannon.ts`, `somniaElwood.ts` all use `blockTime: 100`.
- SDK README (0.32.1): *"hidekiTestnet (50383, 10 ms blocks)"*.
- Docs chains walkthrough table: `hidekiTestnet | 50383 | 10 ms` (mainnet/Shannon 100 ms).
- Docs bridge page: *"Hideki is a ~10 ms-block network"*.
- Live RPC reads (2026-11-15 ~09:44–09:50 WIB): block numbers and timestamps above, from `eth_blockNumber` / `eth_getBlockByNumber` on `https://api.hideki2.infra.testnet.somnia.network`.

## Environment

- SDK version: `@somnia-chain/markets-sdk` 0.32.1 (the version the dreamDEX app runs; latest on npm 0.33.0)
- Network: Somnia Tokyo testnet (Hideki, chain 50383)
- Wallet address: 0xa505479a6410a848d41fc0f495e431e558233ff3
- Date observed: 2026-11-15 ~09:44–09:50 WIB

## Suggested fix

Set `hidekiTestnet` `blockTime` to `100` (matching the measured cadence and the other Somnia chains) and correct the README, the chains walkthrough table, and the bridge page's "~10 ms-block network" wording. If 10 ms is a design target for a future regenesis, label it as a target, not the current value.

## Duplicate-check note

- `somnia-chain/somnia-markets` issue tracker could not be searched — the repo returns 404 via the GitHub API (private/renamed).
- `somnia-chain/dreamdex-bot-kit` issues searched for `blockTime`, `10ms`: 0 hits.
- Web search found no matching public report.
- Residual limit: other bounty submissions are not public, so a same-day duplicate by another hunter cannot be fully excluded.
