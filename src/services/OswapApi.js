import { getAaStateVars, getAssetMetadata } from "@/services/DAGApi";

export async function getOswapPoolsWithSymbols() {
  const assetsBySymbol = {};
  const metaByAsset = {};

  const vars = await getAaStateVars(import.meta.env.VITE_OSWAP_FACTORY);

  for (let k in vars) {
    if (k.startsWith("pool_")) {
      const asset = vars[k].pool_asset;
      const assetMeta = await getAssetMetadata(asset);
      if (assetMeta) {
        assetsBySymbol[assetMeta.name] = asset;
        metaByAsset[asset] = { ...vars[k], address: k.split("_")[1] };
      }
    }
  }

  return {
    assetsBySymbol,
    metaByAsset,
  };
}
