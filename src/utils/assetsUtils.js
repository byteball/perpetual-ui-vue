import { getAssetMetadata } from "@/services/DAGApi";

function getNotDefaultAssetsFromMeta(meta, onlyNotPresale) {
  const keys = Object.keys(meta);
  const assets = [];

  keys.forEach((key) => {
    if (
      key.startsWith("asset_") &&
      (!onlyNotPresale || (onlyNotPresale && !meta[key].presale))
    ) {
      assets.push(key.substring(6));
    }
  });

  return assets;
}

export function getAssetsFromMeta(meta, onlyNotPresale) {
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

    const notDefaultAssets = getNotDefaultAssetsFromMeta(
      metaByAA,
      onlyNotPresale
    );
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

export function getAssetInfoFromMeta(asset, aa, meta) {
  const info = meta[aa]["asset_" + asset];
  return info || null;
}

export async function getAssetsOnlyWithSymbolsAndDecimals(assets) {
  const nameAndDecimalsByAsset = {};
  const assetList = [];
  const assetsByAA = {};

  for (let i in assets.assetList) {
    const asset = assets.assetList[i];
    const metaData = await getAssetMetadata(asset);
    if (!metaData) {
      continue;
    }
    nameAndDecimalsByAsset[asset] = metaData;
    assetList.push(asset);
  }

  for (let k in assets.assetsByAA) {
    const reserve = assets.assetsByAA[k].reserve;
    const newAssets = [];

    if (!nameAndDecimalsByAsset[reserve]) {
      continue;
    }

    const _assets = assets.assetsByAA[k].assets;
    for (let i in _assets) {
      if (nameAndDecimalsByAsset[_assets[i]]) {
        newAssets.push(_assets[i]);
      }
    }

    if (!newAssets.length) {
      continue;
    }

    assetsByAA[k] = {
      reserve,
      assets: newAssets,
    };
  }

  return {
    assetList,
    assetsByAA,
    nameAndDecimalsByAsset,
  };
}
