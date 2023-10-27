import {
  executeAAGetter,
  getAaStateVars,
  getDefinition,
} from "@/services/DAGApi";

export function getReservePrice(aa) {
  return executeAAGetter(aa, "get_reserve_price");
}

export async function getTargetPriceByPriceAa(price_aa) {
  return executeAAGetter(price_aa, "get_target_price");
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

export async function getTargetPriceByPresaleAsset(aa, asset) {
  const vars = await getAaStateVars(aa);
  const metaByAsset = vars[`asset_${asset}`];
  if (metaByAsset.initial_price) {
    return metaByAsset.initial_price;
  }
  if (!metaByAsset || !metaByAsset.price_aa) return 0;
  const reservePrice = await getReservePriceFromPerpAA(aa);
  const tp = await getTargetPriceByPriceAa(metaByAsset.price_aa);

  return tp / reservePrice;
}

export async function getPriceByAssets(aa, assets) {
  const vars = await getAaStateVars(aa);
  const state = vars["state"];
  const priceByAsset = {};

  assets.forEach((asset) => {
    const bAsset0 = state.asset0 === asset;
    const asset_info = vars["asset_" + asset];
    const r = state.reserve;
    const c = state.coef;
    const s = bAsset0 ? state.s0 : asset_info.supply;
    const a = bAsset0 ? state.a0 : asset_info.a;
    priceByAsset[asset] = (c * c * a * s) / r;
  });

  return priceByAsset;
}
