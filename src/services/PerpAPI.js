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
export async function getTargetPriceByPriceAas(aas) {
  const result = {};
  const promises = [];
  aas.forEach((v) => {
    promises.push(getTargetPriceByPriceAa(v));
  });
  const r = await Promise.all(promises);
  r.forEach((v, i) => {
    result[aas[i]] = v;
  });

  return result;
}
async function getReservePriceFromPerpAA(aa) {
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
