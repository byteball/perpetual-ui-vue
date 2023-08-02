import client from "./Obyte.js";

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

const cacheForDefinition = {};
export async function getDefinition(aa) {
  if (cacheForDefinition[aa]) {
    return { aa, definition: cacheForDefinition[aa] };
  }

  let definition;

  try {
    definition = await client.api.getDefinition(aa);
    cacheForDefinition[aa] = definition;
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

const cacheForAssetMetadata = {};

export async function getDataFeed(oracle, feedName) {
  const params = {
    oracles: [oracle],
    feed_name: feedName,
  };

  try {
    return await client.api.getDataFeed(params);
  } catch (e) {
    return null;
  }
}

export async function getAssetMetadata(asset) {
  if (asset === "base") {
    return {
      name: "GBYTE",
      decimals: 9,
      asset,
    };
  }
  if (cacheForAssetMetadata[asset]) {
    return cacheForAssetMetadata[asset];
  }
  try {
    const registryUnit = await client.api.getAssetMetadata(asset);

    const result = await client.api.getJoint(registryUnit.metadata_unit);

    const metadata = result.joint.unit.messages.find(
      (item) => item.app === "data"
    );

    cacheForAssetMetadata[asset] = metadata.payload;
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

export async function executeAAGetter(aa, getter) {
  const params = {
    address: aa,
    getter,
    args: [],
  };

  try {
    return (await client.api.executeGetter(params))?.result;
  } catch (e) {
    return null;
  }
}
