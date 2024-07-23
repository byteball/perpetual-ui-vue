import CacheService from "@/services/CacheService";
import { ADDRESSES } from "@/config";
import odapp from "@/services/odapp";

const definitionCache = new CacheService(5 * 60 * 1000);
const stateVarsCache = new CacheService();
const dataFeedCache = new CacheService();
const assetMetadataCache = new CacheService(10 * 60 * 1000);
const assetBySymbolCache = new CacheService();
const getterCache = new CacheService(30 * 1000);
const jointCache = new CacheService();
const metaCache = new CacheService();
const balanceCache = new CacheService(30 * 1000);

export async function getDefinition(aa) {
  if (definitionCache.exists(aa)) {
    return { aa, definition: definitionCache.getValue(aa) };
  }

  try {
    const definition = await odapp.getDefinition(aa);

    definitionCache.setValue(aa, definition);

    return { aa, definition };
  } catch (e) {
    return { aa, definition: null };
  }
}

export async function getBalances(address) {
  return odapp.getBalances(address);
}

export async function getAllBalances(address) {
  const key = address;
  if (balanceCache.exists(key)) return balanceCache.getValue(key);

  const result = await getBalances(address);
  const balanceByAddress = result[address];
  const balances = {};

  for (const asset in balanceByAddress) {
    balances[asset] = balanceByAddress[asset].total;
  }

  balanceCache.setValue(key, balances);
  return balances;
}

export async function isUnitStable(unit) {
  const joint = await getJoint(unit);

  return !!joint.ball;
}

export async function getAaStateVars(aa, prefix) {
  const key = `${aa}_${prefix || "_"}`;
  if (stateVarsCache.exists(key)) return stateVarsCache.getValue(key);

  const params = { address: aa };
  if (prefix) {
    params.prefix = prefix;
  }

  const vars = await odapp.getAAStateVars(aa, prefix);
  stateVarsCache.setValue(key, vars);
  return vars;
}

async function getMeta(aa) {
  const key = aa;
  if (metaCache.exists(key)) return metaCache.getValue(key);

  let meta = {};
  try {
    const definition = (await getDefinition(aa)).definition;
    meta = { ...definition[1].params };

    const vars = await getAaStateVars(aa);
    meta = { ...meta, ...vars };

    const stakingDefinition = (await getDefinition(meta.staking_aa)).definition;

    meta.stakingParams = stakingDefinition[1].params;
    meta.stakingVars = await getAaStateVars(meta.staking_aa);
    meta.aa = aa;

    metaCache.setValue(key, meta);

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
  const key = unit;
  if (jointCache.exists(key)) return jointCache.getValue(key);

  try {
    const joint = await odapp.getJoint(unit);

    if (joint.joint_not_found) {
      return null;
    }

    jointCache.setValue(key, joint);
    return joint;
  } catch (e) {
    console.error(e);
  }
}

export async function getDataFeed(oracle, feedName) {
  const key = `${oracle}_${feedName}`;
  if (dataFeedCache.exists(key)) return dataFeedCache.getValue(key);

  try {
    const result = await odapp.getDataFeed(oracle, feedName);

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
  if (oracle === ADDRESSES.default_oracle) {
    name = name.split("_")[0];
    value = +value.toFixed(2);
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
    const registryUnit = await odapp.getAssetMetadata(asset);

    const result = await getJoint(registryUnit.metadata_unit);

    const metadata = result.unit.messages.find((item) => item.app === "data");

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

  try {
    const asset = await odapp.getAssetBySymbol(symbol);

    assetBySymbolCache.setValue(symbol, asset);
    return asset;
  } catch (e) {
    return null;
  }
}

export async function executeAAGetter(aa, getter, args, returnError, returnAA) {
  const key = `${aa}_${getter}`;
  if (getterCache.exists(key)) return getterCache.getValue(key);

  const params = {
    address: aa,
    getter,
    args: [],
  };

  try {
    const result = await odapp.executeGetter(params);

    if (result) {
      getterCache.setValue(key, result);
    }

    if (returnAA) {
      return { aa, result: result || null };
    }
    return result;
  } catch (e) {
    if (returnError) return { error: e };
    return null;
  }
}

export async function getAAsByBaseAAs(baseAAs) {
  try {
    return await odapp.getAAsByBaseAAs(baseAAs);
  } catch (e) {
    return [];
  }
}

export function clearCache() {
  getterCache.clear();
  dataFeedCache.clear();
  stateVarsCache.clear();
  balanceCache.clear();
  metaCache.clear();
}
