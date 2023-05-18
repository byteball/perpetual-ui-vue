<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getAssetMetadata } from "@/services/DAGApi";

const router = useRouter();

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const aasWithMeta = ref({});

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
  const priceAAsMeta = {};

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

      priceAAsMeta[priceAA] = {
        finished,
        result,
        leaderAddPriceAA,
        vpAddPrice,
        vpAddPriceBCommit,
      };
    }
  });

  console.log(priceAAsMeta);
  return priceAAsMeta;
}

async function init() {
  if (!aas.value.length) return;

  console.log(meta.value);

  const m = {};
  for (let aa in meta.value) {
    m[aa] = {
      symbolAndDecimals: await getAssetMetadata(meta.value[aa].state.asset0),
      priceAAsMeta: getPriceAAsMetaFromVars(
        meta.value[aa].state,
        meta.value[aa].stakingParams,
        meta.value[aa].stakingVars
      ),
    };
  }

  aasWithMeta.value = m;
}

function goToAddPerp(aa) {
  router.push({ name: "addPerp", params: { aa } });
}

onMounted(init);
watch(meta, init, { deep: true });
</script>
<template>
  <div
    v-if="Object.keys(aasWithMeta).length"
    class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8"
  >
    <div v-for="(meta, aa) in aasWithMeta" :key="aa">
      <div
        v-if="meta.symbolAndDecimals"
        class="border border-gray-300 rounded-md p-2.5"
      >
        <div class="text-sm">{{ meta.symbolAndDecimals.name }}</div>
        <div class="mt-4">
          <div
            v-for="(priceAAsMeta, aa2) in meta.priceAAsMeta"
            :key="aa2"
            class="mb-2"
          >
            <div>{{ aa2 }}</div>
            <div>
              Status: ({{
                priceAAsMeta.finished ? "finished" : "not finished"
              }})
            </div>
          </div>
        </div>
        <div class="mt-4">
          <a class="link" @click="goToAddPerp(aa)">Add a perp for voting</a>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8 text-center"
  >
    <button
      class="btn btn-outline btn-circle btn-lg loading border-none"
    ></button>
  </div>
</template>
