# Hideki testnet block time is about 100 ms, not 10 ms like the SDK and docs say

Severity: normal
Area: SDK

## Steps to reproduce

1. Open `@somnia-chain/markets-sdk` 0.32.1, `src/chains/definitions/hidekiTestnet.ts` line 46. It says `blockTime: 10` with the comment "blocks land every 10 ms (~100 blocks/s)". The SDK README lists `hidekiTestnet (50383, 10 ms blocks)`, and the docs chains table lists Hideki at 10 ms while every other Somnia chain (mainnet, Shannon, Elwood) is listed at 100 ms.
2. Measure the live chain over `https://api.hideki2.infra.testnet.somnia.network`: take `eth_blockNumber` at two points 100 seconds apart, or read `eth_getBlockByNumber` across a 1,000-block window.
3. Compare.

## Expected

If blocks really landed every 10 ms, a 1,000-block window would span about 10 seconds and the height would grow about 100 blocks a second. The docs go further and say this block time drives viem's waiting heuristics, so `waitForTransactionReceipt` should return "in tens of milliseconds" on Hideki.

## Actual

Three separate measurements all land on about 100 ms per block, ten times slower than claimed:

- Blocks 50561967 down to 50560967 (1,000 blocks): 100 seconds, so 100 ms per block.
- Blocks 50562161, 50562151, 50562061 and 50561661 (10, 100 and 500-block windows): 1 s, 10 s and 50 s, again 100 ms per block.
- Height check: block 50,561,825 on 2026-11-15, counted from the v2 regenesis on 2026-09-17 (about 59 days earlier), works out to about 9.9 blocks a second. At 10 ms blocks the height would be around 510 million, not 50.5 million.

So anything that sizes polling, latency estimates or "blocks per second" math off `blockTime: 10` (or off the docs' "100 blocks/s") is wrong by 10x, and the claim about receipts returning in tens of milliseconds can't hold. A receipt can only appear when the next block lands, and blocks are about 100 ms apart.

## Evidence

- SDK source (0.32.1, from the npm tarball): `src/chains/definitions/hidekiTestnet.ts`, `blockTime: 10`, comment "blocks land every 10 ms (~100 blocks/s)". For comparison, `somniaMainnet.ts`, `somniaShannon.ts` and `somniaElwood.ts` all use `blockTime: 100`.
- SDK README (0.32.1): "hidekiTestnet (50383, 10 ms blocks)".
- Docs chains walkthrough table: `hidekiTestnet | 50383 | 10 ms` (mainnet and Shannon at 100 ms).
- Docs bridge page: "Hideki is a ~10 ms-block network".
- Live RPC reads (2026-11-15 around 09:44-09:50 WIB): block numbers and timestamps above, from `eth_blockNumber` and `eth_getBlockByNumber` on `https://api.hideki2.infra.testnet.somnia.network`.

## Environment

- SDK version: `@somnia-chain/markets-sdk` 0.32.1 (the version the dreamDEX app runs; latest on npm is 0.33.0)
- Network: Somnia Tokyo testnet (Hideki, chain 50383)
- Wallet address: 0xa505479a6410a848d41fc0f495e431e558233ff3
- Date observed: 2026-11-15 around 09:44-09:50 WIB

## Suggested fix

Set `hidekiTestnet` `blockTime` to `100` so it matches the measured chain and the other Somnia chains, and fix the README, the chains table and the bridge page wording. If 10 ms is a target for a future regenesis, say that instead of stating it as the current value.

## Duplicate check

I searched the public `somnia-chain/dreamdex-bot-kit` repo for `blockTime` and `10ms` and found nothing. The `somnia-chain/somnia-markets` repo returns 404 through the GitHub API (private or renamed), so I could not search its tracker. Other bounty submissions are not public, so I can't rule out someone else reporting the same thing today.
