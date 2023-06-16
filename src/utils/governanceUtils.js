import { getAssetMetadata } from "@/services/DAGApi";
import { perpDefaults } from "@/config";

function getMajorityThreshold(aaState, stakingVars) {
  return (
    ((stakingVars.state.total_normalized_vp / 2) * aaState.s0) /
    stakingVars["perp_asset_balance_a0"]
  );
}

function getChallengingPeriod(stakingParams) {
  return stakingParams.challenging_period || 432000;
}

function getPriceAAsMetaFromVars(aaState, stakingParams, stakingVars) {
  const priceAAsMeta = {
    finished: {},
    notFinished: {},
    allPriceAAs: [],
  };

  Object.keys(stakingVars).forEach((key) => {
    if (key.startsWith("leader_add_price_aa")) {
      const priceAA = key.substring("leader_add_price_aa".length);
      const finished = !!stakingVars[`add_price_aa${priceAA}`];
      const result = stakingVars[`add_price_aa${priceAA}`] || null;
      const leaderAddPriceAA = stakingVars[`leader_add_price_aa${priceAA}`];
      const vpAddPrice =
        stakingVars[
          `value_votes_add_price_aa${priceAA}_${leaderAddPriceAA.value}`
        ] || null;

      // $new_leader_vp > $get_majority_threshold() OR timestamp > $leader.flip_ts + $challenging_period
      const vpAddPriceBCommit = stakingVars[
        `value_votes_add_price_aa${priceAA}_${leaderAddPriceAA.value}`
      ]
        ? vpAddPrice > getMajorityThreshold(aaState, stakingVars) ||
          Math.floor(Date.now() / 1000) >
            leaderAddPriceAA.flip_ts + getChallengingPeriod(stakingParams)
        : null;

      priceAAsMeta[finished ? "finished" : "notFinished"][priceAA] = {
        result,
        leaderAddPriceAA,
        vpAddPrice,
        vpAddPriceBCommit,
      };
      priceAAsMeta.allPriceAAs.push(priceAA);
    }
  });

  return priceAAsMeta;
}

const cacheForPreparedMetaByAsset0AndReserve = {};
export async function getPreparedMeta(metaByAA) {
  const key = `${metaByAA.state.asset0}_${metaByAA.reserve_asset}`;
  if (cacheForPreparedMetaByAsset0AndReserve[key]) {
    return cacheForPreparedMetaByAsset0AndReserve[key];
  }

  const priceAAsMeta = getPriceAAsMetaFromVars(
    metaByAA.state,
    metaByAA.stakingParams,
    metaByAA.stakingVars
  );
  const meta = {
    symbolAndDecimals: await getAssetMetadata(metaByAA.state.asset0),
    priceAAsMeta,
    reserveAsset: await getAssetMetadata(metaByAA.reserve_asset),
    rawMeta: metaByAA,
  };
  cacheForPreparedMetaByAsset0AndReserve[key] = meta;

  return meta;
}

export function getParam(name, meta) {
  if (meta[name]) {
    return meta[name];
  }

  return perpDefaults[name] || "none";
}

function sortVotes(votes) {
  Object.keys(votes).forEach((k) => {
    if (!Array.isArray(votes[k])) {
      sortVotes(votes[k]);
      return;
    }

    votes[k].sort((a, b) => b.amount - a.amount);
  });
}
export function getAllVotes(vars) {
  const votes = {
    add_price_aa: {},
    change_price_aa: {},
    change_drift_rate: {},
  };
  Object.keys(vars).forEach((k) => {
    if (k.startsWith("value_votes_")) {
      let v = k.substring(12).split("_");
      const value = v.pop();
      const key = v.join("_");

      if (Object.keys(perpDefaults).includes(key)) {
        if (!votes[key]) votes[key] = [];
        votes[key].push({ value: Number(value), amount: vars[k] });
      } else {
        let length = 0;
        if (key.startsWith("add_price_aa")) {
          length = 12;
        } else if (key.startsWith("change_price_aa")) {
          length = 15;
        } else if (key.startsWith("change_drift_rate")) {
          length = 17;
        } else {
          return; // not supported
        }

        let a = key.substring(length);
        if (!votes.add_price_aa[a]) votes.add_price_aa[a] = [];
        votes.add_price_aa[a].push({ value: value, amount: vars[k] });
      }
    }
  });

  sortVotes(votes);
  return votes;
}
