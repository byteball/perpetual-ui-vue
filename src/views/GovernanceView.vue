<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getAssetMetadata } from "@/services/DAGApi";
import Client from "@/services/Obyte";
import { generateLink } from "@/utils/generateLink";

const router = useRouter();

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const aasWithMeta = ref({});
const priceAAsDefinition = ref({});

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
    const priceAAsMeta = getPriceAAsMetaFromVars(
      meta.value[aa].state,
      meta.value[aa].stakingParams,
      meta.value[aa].stakingVars
    );
    m[aa] = {
      symbolAndDecimals: await getAssetMetadata(meta.value[aa].state.asset0),
      priceAAsMeta,
    };

    for (const priceAA in priceAAsMeta) {
      const priceAADefinition = await Client.api.getDefinition(priceAA);
      priceAAsDefinition.value[priceAA] = priceAADefinition[1].params;
    }
  }

  aasWithMeta.value = m;
}

function goToAddPerp(aa) {
  router.push({ name: "addPerp", params: { aa } });
}

function generateAndFollowLink(priceAA, vote, perpetualAA) {
  const link = generateLink(
    10000,
    {
      vote_value: 1,
      name: "add_price_aa",
      price_aa: priceAA,
      value: vote,
    },
    null,
    perpetualAA,
    "base",
    true
  );

  const a = document.createElement("a");
  a.href = link;
  a.click();
}

onMounted(init);
watch(meta, init, { deep: true });
</script>
<template>
  <div
    v-if="Object.keys(aasWithMeta).length"
    class="container w-[320px] sm:w-[768px] m-auto mt-40 mb-36 p-8"
  >
    <div
      v-for="(perpetualAAMeta, perpetualAA) in aasWithMeta"
      :key="perpetualAA"
    >
      <div v-if="perpetualAAMeta.symbolAndDecimals">
        <div class="card bg-base-200 shadow-xl mb-4">
          <div class="card-body">
            <div class="flex justify-between">
              <div class="text-lg font-bold">
                {{ perpetualAAMeta.symbolAndDecimals.name }}
              </div>
              <div>
                <button
                  class="btn btn-sm btn-primary"
                  @click="goToAddPerp(perpetualAA)"
                >
                  Add perpetual for voting
                </button>
              </div>
            </div>
            <div
              v-for="(priceAAsMeta, priceAA) in perpetualAAMeta.priceAAsMeta"
              :key="priceAA"
            >
              <div class="card bg-base-300 shadow-xl mt-2">
                <div class="card-body gap-0">
                  <div v-if="!priceAAsMeta.finished">
                    <div class="text-sm font-medium inline-block mb-2">
                      Price AA:
                      <div class="text-sm font-light inline-block">
                        {{ priceAA }}
                      </div>
                    </div>
                    <div class="flex justify-between">
                      <div class="font-medium text-sm inline-block mb-2">
                        Oracle:
                        <div class="font-light text-sm inline-block">
                          {{ priceAAsDefinition[priceAA].oracle }}
                        </div>
                      </div>
                      <div class="font-medium text-sm inline-block mb-2">
                        Multiplier:
                        <div class="font-light text-sm inline-block">
                          {{ priceAAsDefinition[priceAA].multiplier || 1 }}
                        </div>
                      </div>
                    </div>
                    <div class="font-medium text-sm inline-block mb-2">
                      Feed name:
                      <div class="font-light text-sm inline-block">
                        {{ priceAAsDefinition[priceAA].feed_name }}
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-between">
                    <div class="text-sm font-medium inline-block">
                      Status:
                      <div class="text-sm font-light inline-block">
                        <p v-if="priceAAsMeta.finished">finished</p>
                        <p
                          v-if="
                            !priceAAsMeta.finished &&
                            priceAAsMeta.vpAddPriceBCommit
                          "
                        >
                          waiting commit
                        </p>
                        <p
                          v-if="
                            !priceAAsMeta.finished &&
                            !priceAAsMeta.vpAddPriceBCommit
                          "
                        >
                          not finished
                        </p>
                      </div>
                    </div>
                    <div
                      v-if="!priceAAsMeta.finished"
                      class="font-medium text-sm inline-block"
                    >
                      {{
                        !priceAAsMeta.finished && priceAAsMeta.vpAddPriceBCommit
                          ? "Result: "
                          : "Leader: "
                      }}
                      <div class="font-light text-sm inline-block">
                        {{ priceAAsMeta.leaderAddPriceAA.value }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="!priceAAsMeta.finished"
                    class="card-actions justify-start mt-4"
                  >
                    <div
                      v-if="
                        !priceAAsMeta.finished &&
                        !priceAAsMeta.vpAddPriceBCommit
                      "
                    >
                      <button
                        class="btn btn-sm gap-2"
                        @click="
                          generateAndFollowLink(
                            priceAA,
                            priceAAsMeta.leaderAddPriceAA.value,
                            perpetualAA
                          )
                        "
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-4 h-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                        Vote for yes
                      </button>
                      <button
                        class="btn btn-sm gap-2"
                        @click="
                          generateAndFollowLink(priceAA, 'no', perpetualAA)
                        "
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-4 h-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                        Vote for no
                      </button>
                    </div>
                    <div
                      v-if="
                        !priceAAsMeta.finished && priceAAsMeta.vpAddPriceBCommit
                      "
                    >
                      <button
                        class="btn btn-sm gap-2"
                        @click="
                          generateAndFollowLink(priceAA, 'yes', perpetualAA)
                        "
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-4 h-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                        Commit result
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="priceAAsMeta.finished"
                    class="card-actions justify-start"
                  >
                    <button
                      v-if="priceAAsMeta.result === 'no'"
                      class="btn btn-sm gap-2 mt-4"
                      @click="
                        generateAndFollowLink(priceAA, 'yes', perpetualAA)
                      "
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-4 h-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                      Vote for add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
