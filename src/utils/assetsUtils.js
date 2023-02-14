function getNotDefaultAssetsFromMeta(meta) {
  const keys = Object.keys(meta);
  const assets = [];

  keys.forEach((key) => {
    if (key.startsWith("asset_")) {
      assets.push(key.substring(6));
    }
  });

  return assets;
}

export function getAssetsFromMeta(meta) {
  const assetList = [];
  const assetsByAA = {};

  for (const aa in meta) {
    const metaByAA = meta[aa];
    assetsByAA[aa] = {
      reserve: metaByAA.reserve_asset,
      assets: [metaByAA.state.asset0],
    };

    if (!assetList.includes(metaByAA.reserve_asset)) {
      assetList.push(metaByAA.reserve_asset);
    }

    if (!assetList.includes(metaByAA.state.asset0)) {
      assetList.push(metaByAA.state.asset0);
    }

    const notDefaultAssets = getNotDefaultAssetsFromMeta(metaByAA);
    for (const asset of notDefaultAssets) {
      assetsByAA[aa].assets.push(asset);
      if (!assetList.includes(asset)) {
        assetList.push(asset);
      }
    }
  }

  return { assetList, assetsByAA };
}

export function getPairedAssetsByAsset(asset, assetsByAA) {
  const assocAAByAsset = {};
  for (const aa in assetsByAA) {
    const assets = assetsByAA[aa];

    if (assets.reserve === asset) {
      for (const asset of assets.assets) {
        assocAAByAsset[asset] = aa;
      }
      continue;
    }

    if (assets.assets.includes(asset)) {
      assocAAByAsset[assets.reserve] = aa;
    }
  }

  return assocAAByAsset;
}
