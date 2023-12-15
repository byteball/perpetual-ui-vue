import { executeAAGetter, getAssetMetadataByArray } from "@/services/DAGApi";
import { fullExplorerUrlForAsset, fullExplorerUrlForUnit } from "@/config";
import { getParam } from "@/utils/governanceUtils";
import dayjs from "dayjs";

const isPresaleFinished = (metaByAA, presaleAsset) => {
  const presalePeriod = getParam("presale_period", metaByAA);
  const tokenShareThreshold = getParam("token_share_threshold", metaByAA);
  const reserve = metaByAA.state.reserve;

  const presaleAssetData = metaByAA[`asset_${presaleAsset}`];
  const currentPresaleAmount = metaByAA[`asset_${presaleAsset}`].presale_amount;

  const finishDate = dayjs(
    (presaleAssetData.creation_ts + presalePeriod) * 1000
  );

  const targetPresaleAmount = tokenShareThreshold * reserve;

  return (
    currentPresaleAmount &&
    (targetPresaleAmount <= currentPresaleAmount ||
      !presaleAssetData?.presale ||
      finishDate.diff(dayjs()) < 0)
  );
};

export function getNotDefaultAssetsFromMeta(metaByAA, onlyNotPresale) {
  const keys = Object.keys(metaByAA);
  const assets = [];

  keys.forEach((key) => {
    if (key.startsWith("asset_")) {
      const asset = key.substring(6);
      if (
        !onlyNotPresale ||
        (onlyNotPresale && isPresaleFinished(metaByAA, asset))
      ) {
        assets.push(asset);
      }
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

export async function getAssetsOnlyWithSymbolsAndDecimals(assets, meta) {
  const nameAndDecimalsByAsset = {};
  const assetList = [];
  const assetsByAA = {};
  const reservePairs = {};

  const metadataByAsset = await getAssetMetadataByArray(assets.assetList);
  for (let asset in metadataByAsset) {
    nameAndDecimalsByAsset[asset] = metadataByAsset[asset];
    assetList.push(asset);
  }

  const pr = [];

  for (let k in assets.assetsByAA) {
    const reserve = assets.assetsByAA[k].reserve;
    const newAssets = [];

    reservePairs[reserve] = [];

    if (!nameAndDecimalsByAsset[reserve]) {
      continue;
    }

    const _assets = assets.assetsByAA[k].assets;
    for (let i in _assets) {
      if (nameAndDecimalsByAsset[_assets[i]]) {
        newAssets.push(_assets[i]);
        reservePairs[reserve].push(_assets[i]);
      }
    }

    pr.push(getPairsVolume(meta[k], newAssets, k));

    assetsByAA[k] = {
      reserve,
      assets: newAssets,
    };
  }

  const r = await Promise.all(pr);
  r.forEach(({ aa, result }) => {
    assetsByAA[aa].volumes = result;
  });

  for (const [key, value] of Object.entries(reservePairs)) {
    if (!value.length) {
      const index = assetList.indexOf(key);
      if (index > -1) {
        assetList.splice(index, 1);
      }
    }
  }

  assetList.sort((a, b) => {
    if (nameAndDecimalsByAsset[a].name < nameAndDecimalsByAsset[b].name) {
      return -1;
    }

    if (nameAndDecimalsByAsset[a].name > nameAndDecimalsByAsset[b].name) {
      return 1;
    }

    return 0;
  });

  return {
    assetList,
    assetsByAA,
    nameAndDecimalsByAsset,
  };
}

async function getPairsVolume(metaByAA, assets, aa) {
  const prices = await Promise.all(
    assets.map((asset, index) => {
      const priceAA = !index
        ? metaByAA.reserve_price_aa
        : metaByAA[`asset_${asset}`].price_aa;
      const getter = !index ? "get_reserve_price" : "get_target_price";
      return executeAAGetter(priceAA, getter);
    })
  );

  return {
    aa,
    result: assets.map((asset, index) => {
      const supply = !index
        ? metaByAA.state.reserve
        : metaByAA[`asset_${asset}`].supply;

      const volume = supply * prices[index];

      return {
        asset,
        volume,
      };
    }),
  };
}

export function getUrlForReserveAsset(asset) {
  if (asset === "base") {
    return fullExplorerUrlForAsset + "GBYTE";
  }

  return fullExplorerUrlForUnit + asset;
}
