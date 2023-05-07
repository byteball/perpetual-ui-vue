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

export async function getMetaForPerpAAs(aas) {
  const meta = {};

  for (let aa of aas) {
    let m = {};
    try {
      const definition = await client.api.getDefinition(aa);
      m = { ...definition[1].params };

      const vars = await client.api.getAaStateVars({ address: aa });
      m = { ...m, ...vars };

      const stakingDefinition = await client.api.getDefinition(m.staking_aa);

      m.stakingParams = stakingDefinition[1].params;

      meta[aa] = m;
    } catch (e) {
      console.error(e);
    }
  }

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

export async function getAssetMetadata(asset) {
  if (asset === "base") {
    return {
      name: "GBYTE",
      decimals: 9,
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
    return metadata.payload;
  } catch (e) {
    return null;
  }
}
