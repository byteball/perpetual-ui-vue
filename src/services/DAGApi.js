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
