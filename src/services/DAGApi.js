import client from "./Obyte.js";
import CacheService from "@/services/CacheService";
import Client from "@/services/Obyte";

const definitionCache = new CacheService();
const dataFeedCache = new CacheService();
const assetMetadataCache = new CacheService();
const assetBySymbolCache = new CacheService();

export async function getAasCreatedByFactory() {
  const result = await client.api.getAaResponses({
    aa: import.meta.env.VITE_FACTORY_AA,
  });

  const aasList = [];
  for (let { bounced, response } of result) {
    if (bounced) continue;

    const address = response.responseVars.address;
    aasList.push(address);
  }

  return aasList;
}

export async function getDefinition(aa) {
  if (definitionCache.exists(aa)) {
    return { aa, definition: definitionCache.getValue(aa) };
  }

  let definition;

  try {
    definition = await client.api.getDefinition(aa);
    definitionCache.setValue(aa, definition);
  } catch (e) {
    console.log(e);
    return { aa, definition: null };
  }

  return { aa, definition };
}

async function getMeta(aa) {
  let meta = {};
  try {
    const definition = (await getDefinition(aa)).definition;
    meta = { ...definition[1].params };

    const vars = await client.api.getAaStateVars({ address: aa });
    meta = { ...meta, ...vars };

    const stakingDefinition = (await getDefinition(meta.staking_aa)).definition;
    meta.stakingParams = stakingDefinition[1].params;

    meta.stakingVars = await client.api.getAaStateVars({
      address: meta.staking_aa,
    });

    meta.aa = aa;

    return meta;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getMetaForPerpAAs(aas) {
  const meta = {};
  const promises = [];

  for (let aa of aas) {
    promises.push(getMeta(aa));
  }

  const result = await Promise.all(promises);
  result.forEach((v) => {
    if (!v) return;
    meta[v.aa] = v;
  });

  return meta;
}

export async function getJoint(unit) {
  try {
    const joint = await client.api.getJoint(unit);

    if (joint.joint_not_found) {
      return null;
    }

    return joint;
  } catch (e) {
    console.error(e);
  }
}

export async function getDataFeed(oracle, feedName) {
  const key = `${oracle}_${feedName}`;
  if (dataFeedCache.exists(key)) return dataFeedCache.getValue(key);

  const params = {
    oracles: [oracle],
    feed_name: feedName,
  };

  try {
    const result = await client.api.getDataFeed(params);
    dataFeedCache.setValue(key, result);
    return result;
  } catch (e) {
    return null;
  }
}

export async function getOracleData(priceAA) {
  const { definition } = await getDefinition(priceAA);
  const { oracle, feed_name } = definition[1].params;
  let name = feed_name;
  let value = await getDataFeed(oracle, feed_name);
  if (oracle === "F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N") {
    name = name.split("_")[0];
    value = `$${value.toFixed(2)}`;
  }

  return { name, value };
}

export async function getAssetMetadata(asset) {
  if (asset === "base") {
    return {
      name: "GBYTE",
      decimals: 9,
      asset,
    };
  }
  if (assetMetadataCache.exists(asset)) {
    return assetMetadataCache.getValue(asset);
  }
  try {
    const registryUnit = await client.api.getAssetMetadata(asset);

    const result = await client.api.getJoint(registryUnit.metadata_unit);

    const metadata = result.joint.unit.messages.find(
      (item) => item.app === "data"
    );

    assetMetadataCache.setValue(asset, metadata.payload);
    return { ...metadata.payload, asset };
  } catch (e) {
    return null;
  }
}

export async function getAssetMetadataByArray(assets) {
  const metadataByAsset = {};

  const result = await Promise.all(
    assets.map((asset) => getAssetMetadata(asset))
  );

  result.forEach((v) => {
    if (!v) return;

    metadataByAsset[v.asset] = v;
  });

  return metadataByAsset;
}

export async function getAssetBySymbol(symbol) {
  if (assetBySymbolCache.exists(symbol)) {
    return assetBySymbolCache.getValue(symbol);
  }

  const registry = Client.api.getOfficialTokenRegistryAddress();
  const asset = await Client.api.getAssetBySymbol(registry, symbol);
  assetBySymbolCache.setValue(symbol, asset);

  return asset;
}

export async function executeAAGetter(aa, getter, returnError) {
  const params = {
    address: aa,
    getter,
    args: [],
  };

  try {
    return (await client.api.executeGetter(params))?.result;
  } catch (e) {
    if (returnError) return { error: e };
    return null;
  }
}
