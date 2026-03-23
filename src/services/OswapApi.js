import { ADDRESSES } from "@/config";
import { getAaStateVars, getAssetMetadata } from "@/services/DAGApi";

export async function getOswapPoolsWithSymbols() {
  const assetsBySymbol = {};
  const metaByAsset = {};
  const { oswap_factory } = ADDRESSES;

  if (!oswap_factory.length) {
    return {
      assetsBySymbol,
      metaByAsset,
    };
  }

  const varsByFactory = await Promise.all(
    oswap_factory.map((factoryAA) => getAaStateVars(factoryAA))
  );

  const pools = varsByFactory.flatMap((vars, index) => {
    return Object.entries(vars)
      .filter(([key]) => key.startsWith("pool_"))
      .map(([key, value]) => ({
        ...value,
        address: key.split("_")[1],
        factory_aa: oswap_factory[index],
      }));
  });

  const assets = [...new Set(pools.map((pool) => pool.pool_asset))];
  const assetsMeta = await Promise.all(
    assets.map((asset) => getAssetMetadata(asset))
  );
  const assetMetaByAsset = {};

  assetsMeta.forEach((assetMeta) => {
    if (!assetMeta) return;
    assetMetaByAsset[assetMeta.asset] = assetMeta;
  });

  for (const pool of pools) {
    const asset = pool.pool_asset;
    const assetMeta = assetMetaByAsset[asset];
    if (assetMeta) {
      assetsBySymbol[assetMeta.name] = asset;
      metaByAsset[asset] = pool;
    }
  }

  return {
    assetsBySymbol,
    metaByAsset,
  };
}
