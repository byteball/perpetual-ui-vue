import {
  getAaStateVars,
  getAllBalances,
  getDataFeed,
  getDefinition,
} from "@/services/DAGApi";
import { small_pow } from "@/utils/smallPow";
import { adjustPrices } from "@/utils/adjustPrices";

export async function getReservePrice(aa) {
  const def = (await getDefinition(aa)).definition;
  const params = def[1].params;
  if (params.oswap_aa) {
    const x_asset = params.x_asset || "base";
    const y_asset = params.y_asset || "base";
    const balances = await getAllBalances(params.oswap_aa);
    const vars = await getAaStateVars(params.oswap_aa);
    const x_balance = balances[x_asset];
    const y_balance = balances[y_asset];
    const lp_shares = vars["lp_shares"];
    const supply = lp_shares.issued;
    const x_rate =
      (await getDataFeed(params.x_oracle, params.x_feed_name)) /
      small_pow(10, params.x_decimals || 0);
    const y_rate =
      (await getDataFeed(params.y_oracle, params.y_feed_name)) /
      small_pow(10, params.y_decimals || 0);
    const balance = x_balance * x_rate + y_balance * y_rate;
    return balance / supply;
  } else {
    return (
      (await getDataFeed(params.oracle, params.feed_name)) /
      small_pow(10, params.decimals || 0)
    );
  }
}

export async function getTargetPriceByPriceAa(price_aa) {
  const def = (await getDefinition(price_aa)).definition;
  const params = def[1].params;

  return (
    (await getDataFeed(params.oracle, params.feed_name)) *
    (params.multiplier || 1)
  );
}

export async function getReservePriceFromPerpAA(aa) {
  const definition = (await getDefinition(aa)).definition;
  const reservePriceAA = definition[1].params.reserve_price_aa;
  return getReservePrice(reservePriceAA);
}

export async function getTargetPriceForAddPerp(aa, priceAATargetPrice) {
  const reservePrice = await getReservePriceFromPerpAA(aa);

  return priceAATargetPrice / reservePrice;
}

export async function getTargetPriceByPresaleAsset(aa, asset, actual) {
  const vars = await getAaStateVars(aa);
  const metaByAsset = vars[`asset_${asset}`];
  if (!actual && metaByAsset.initial_price) {
    return metaByAsset.initial_price;
  }
  if (!metaByAsset || !metaByAsset.price_aa) return 0;
  const reservePrice = await getReservePriceFromPerpAA(aa);
  const tp = await getTargetPriceByPriceAa(metaByAsset.price_aa);

  return tp / reservePrice;
}

export async function getPriceByAssets(aa, assets, varsAndParams) {
  const vars = await getAaStateVars(aa);
  const _state = vars["state"];
  const priceByAsset = {};

  for (let asset of assets) {
    const state = { ..._state };
    const bAsset0 = state.asset0 === asset;
    const assetInfo = vars["asset_" + asset];
    await adjustPrices(asset, assetInfo, state, varsAndParams);
    if (!bAsset0 && !assetInfo) return;

    const r = state.reserve;
    const c = state.coef;
    const s = bAsset0 ? state.s0 : assetInfo.supply;
    const a = bAsset0 ? state.a0 : assetInfo.a;
    const price = (c * c * a * s) / r;
    priceByAsset[asset] = isNaN(price) ? 0 : price;
  }

  return priceByAsset;
}

export async function getPriceByData(
  aa,
  asset,
  state,
  assetInfo,
  varsAndParams
) {
  const _state = { ...state };
  const bAsset0 = _state.asset0 === asset;
  await adjustPrices(asset, assetInfo, _state, varsAndParams);
  const r = _state.reserve;
  const c = _state.coef;
  const s = bAsset0 ? _state.s0 : assetInfo.supply;
  const a = bAsset0 ? _state.a0 : assetInfo.a;
  return (c * c * a * s) / r;
}
