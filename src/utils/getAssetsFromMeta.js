export function getAllAssetsFromMeta(meta) {
  const keys = Object.keys(meta);
  const assets = [];

  keys.forEach((key) => {
    if (key.startsWith("asset_")) {
      assets.push(key.substring(6));
    }
  });

  return assets;
}

export function getPresaleAssetsFromMeta(meta) {
  const keys = Object.keys(meta);
  const assets = [];

  keys.forEach((key) => {
    if (key.startsWith("asset_") && meta[key].presale) {
      assets.push(key.substring(6));
    }
  });

  return assets;
}
