import {
  executeAAGetter,
  getAaStateVars,
  getDefinition,
} from "@/services/DAGApi";

async function getReservePrice(aa) {
  const definition = (await getDefinition(aa)).definition;
  const reservePriceAA = definition[1].params.reserve_price_aa;
  return executeAAGetter(reservePriceAA, "get_reserve_price");
}

async function getTargetPriceByPriceAa(price_aa) {
  return executeAAGetter(price_aa, "get_target_price");
}

export async function getTargetPriceForAddPerp(aa, priceAATargetPrice) {
  const reservePrice = await getReservePrice(aa);

  return priceAATargetPrice / reservePrice;
}

export async function getTargetPriceByPresaleAsset(aa, asset) {
  const vars = await getAaStateVars(aa);
  const metaByAsset = vars[`asset_${asset}`];
  if (metaByAsset.initial_price) {
    return metaByAsset.initial_price;
  }

  if (!metaByAsset || !metaByAsset.price_aa) return 0;
  const reservePrice = await getReservePrice(aa);
  const tp = await getTargetPriceByPriceAa(metaByAsset.price_aa);

  return tp / reservePrice;
}
