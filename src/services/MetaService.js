import odapp from "@/services/odapp";
import { ADDRESSES } from "@/config";

export async function getInitData() {
  const baseAAs = ADDRESSES.base_aas;

  const aasWithVars = await odapp.getAAsByBaseAAsWithVars(baseAAs);
  const aas = aasWithVars.map((v) => v.address);

  const stakingAAs = [];
  const metaByAA = {};

  for (const baseMeta of aasWithVars) {
    metaByAA[baseMeta.address] = {
      aa: baseMeta.address,
      ...baseMeta.definition[1].params,
      ...baseMeta.stateVars,
    };

    stakingAAs.push(baseMeta.stateVars.staking_aa);
  }

  const [stakingDefs, stakingStateVars] = await Promise.all([
    odapp.getDefinitions(stakingAAs),
    odapp.getAAsStateVars(stakingAAs),
  ]);

  for (const aa in metaByAA) {
    const meta = metaByAA[aa];
    meta.stakingParams = stakingDefs[meta.staking_aa][1].params;
    meta.stakingVars = stakingStateVars[meta.staking_aa];
  }

  return {
    aas,
    metaByAA,
    stakingAAs,
  };
}
