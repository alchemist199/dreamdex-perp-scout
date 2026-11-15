// dreamdex-perp-scout — read-only scan of dreamDEX perp markets on Somnia Hideki testnet.
// Uses @somnia-chain/markets-sdk 0.32.1 (the version the dreamDEX app runs).
// No signer, no transactions, no private keys.
import { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains";

const j = (v) => JSON.stringify(v, (k, x) => (typeof x === "bigint" ? x.toString() + "n" : x), 2);

const exchange = new SomniaMarkets({
  indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql",
  chain: hidekiTestnet,
  wsRpcUrl: "wss://api.hideki2.infra.testnet.somnia.network/ws",
  addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
});

await exchange.loadMarkets();
const perps = await exchange.client.listPerpMarkets({ limit: 100 });
console.log(`perp markets: ${perps.length}`);
for (const p of perps) {
  const sym = p.baseSymbol && p.quoteSymbol ? `${p.baseSymbol}/${p.quoteSymbol}` : p.symbol;
  console.log(
    `${sym} | pool ${p.poolAddress ?? p.pool} | initialMarginBps ${p.initialMarginBps}` +
    ` | funding ${String(p.fundingRate)} | index ${String(p.indexPrice)}` +
    ` | openInterest ${String(p.openInterest)} | trades ${p.tradeCount ?? "?"}`
  );
}

// Spot-check the first market's live on-chain state.
if (perps.length > 0) {
  const pool = perps[0].poolAddress ?? perps[0].pool;
  try {
    const st = await exchange.client.getPerpState(pool);
    console.log(`getPerpState(${perps[0].symbol ?? perps[0].baseSymbol}):`, j(st));
  } catch (e) {
    console.log("getPerpState FAILED:", e?.constructor?.name, e?.message);
  }
}

await exchange.close();
console.log("DONE");
