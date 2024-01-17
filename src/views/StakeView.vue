<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import { useAaInfoStore } from "@/stores/aaInfo";
import { useAddressStore } from "@/stores/addressStore";
import Loading from "@/components/icons/LoadingIcon.vue";
import { getPreparedMeta } from "@/utils/governanceUtils";
import { Dialog } from "@headlessui/vue";
import ManageStakeModal from "@/components/stake/ManageStakeModal.vue";
import { useRoute, useRouter } from "vue-router";
import { withdrawReward } from "@/utils/withdrawReward";
import TooltipComponent from "@/components/TooltipComponent.vue";

const route = useRoute();
const router = useRouter();

const store = useAaInfoStore();
const addressStore = useAddressStore();
const { meta, status } = storeToRefs(store);
const { address } = storeToRefs(addressStore);

const pools = ref([]);
const poolsInited = ref(false);
const poolSymbolAndDecimalByAA = ref({});
const poolReserveNameByAA = ref({});
const stakeBalanceByPool = ref({});
const manageModalParams = ref({});

const rewardByAA = ref({});

const preparedMetaByAA = ref({});

const modalForManage = ref(false);
const poolsListFilter = ref(false);

function getTVLByAA(aa) {
  const { totalStakeBalance, stakeInUsd } = preparedMetaByAA.value[aa];

  return +(totalStakeBalance * stakeInUsd).toPrecision(6);
}

const getUserStakeBalance = (aa) => {
  let balance = stakeBalanceByPool.value[aa];

  if (balance) {
    const decimals = poolSymbolAndDecimalByAA.value[aa].decimals;
    balance = balance / 10 ** decimals;
  }

  return balance;
};

const getUserStakeBalanceInUsd = (aa) => {
  return +(
    getUserStakeBalance(aa) *
    preparedMetaByAA.value[aa].stakeInUsd *
    10 ** poolSymbolAndDecimalByAA.value[aa].decimals
  ).toPrecision(6);
};

function sortPoolsByTVL(_pools) {
  return _pools.sort((a, b) => getTVLByAA(b) - getTVLByAA(a));
}
function sortByBalanceInUSD(_pools) {
  return _pools.sort(
    (a, b) => getUserStakeBalanceInUsd(b) - getUserStakeBalanceInUsd(a)
  );
}

async function initPools(force = false) {
  if (status.value !== "initialized") return;

  const _pools = [];
  const promises = [];

  async function getAndSetPoolData(aa) {
    const metaByAA = meta.value[aa];
    const result = await getPreparedMeta(metaByAA, address.value, force);
    if (!result.asset0SymbolAndDecimals) return;
    preparedMetaByAA.value[aa] = result;

    if (address.value) {
      stakeBalanceByPool.value[aa] =
        metaByAA?.stakingVars[`user_${address.value}_a0`]?.balance || 0;
    }

    poolSymbolAndDecimalByAA.value[aa] = result.asset0SymbolAndDecimals;
    _pools.push(aa);

    if (!result.reserveAsset) {
      poolReserveNameByAA.value[aa] = metaByAA.reserve_asset;
      return;
    }

    poolReserveNameByAA.value[aa] = result.reserveAsset.name;

    rewardByAA.value[aa] = +(
      metaByAA.state.total_staker_fees * result.reservePriceInUsd
    ).toPrecision(6);
  }

  for (let aa in meta.value) {
    promises.push(getAndSetPoolData(aa));
  }

  await Promise.all(promises);

  pools.value = _pools;
  poolsInited.value = true;

  if (
    route.params.stake &&
    pools.value.find((pool) => pool === route.params.stake)
  ) {
    showManageStakeModal(route.params.stake);
  }
}

const changePoolFilter = (filter) => {
  if (filter === "all") {
    poolsListFilter.value = false;
    return;
  }

  poolsListFilter.value = true;
};

const closeManageStakeModal = () => {
  modalForManage.value = false;
  router.replace(`/stake`);
};

const poolList = computed(() => {
  const list = pools.value;

  if (!poolsListFilter.value) {
    return sortPoolsByTVL(list);
  }

  const filteredList = list.filter((pool) => {
    return !!getUserStakeBalance(pool);
  });

  return sortByBalanceInUSD(filteredList);
});

onMounted(() => {
  initPools();
});
watch(
  () => address.value,
  () => initPools
);
watch(
  meta,
  () => {
    initPools(true);
  },
  { deep: true }
);

const showManageStakeModal = (poolAA) => {
  router.replace(`/stake/${poolAA}`);

  manageModalParams.value = {
    poolReserveAssetName: poolReserveNameByAA.value[poolAA],
    poolSymbolAndDecimal: poolSymbolAndDecimalByAA.value[poolAA],
    metaByAA: { ...meta.value[poolAA], aa: poolAA },
    userStakeBalance: getUserStakeBalance(poolAA),
    preparedMeta: preparedMetaByAA.value[poolAA],
  };

  modalForManage.value = true;
};
</script>

<template>
  <div class="container w-full sm:w-[860px] m-auto mt-2 p-6 sm:p-8">
    <div class="p-2 mb-6">
      <h1 class="text-2xl font-bold leading-8">Stake</h1>
      <div class="mt-2 leading-6">
        Stake the governance asset of a futures set in order to participate in
        the governance of the set. Voting power (VP) depends on the staked amount and the term left before unstaking. A share (50% by default) of all trading fees are also distributed among stakers in proportion to their VP. 
      </div>
    </div>
    <div v-if="address" class="mb-2">
      <button
        class="btn btn-sm"
        :class="{ 'btn-primary': !poolsListFilter }"
        @click="changePoolFilter('all')"
      >
        All
      </button>
      <button
        class="btn btn-sm ml-1"
        :class="{ 'btn-primary': poolsListFilter }"
        @click="changePoolFilter('my')"
      >
        My sets
      </button>
    </div>
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body p-6 sm:p-8">
        <div v-if="!poolsInited" class="text-center">
          <Loading />
        </div>
        <div v-else class="overflow-auto">
          <div v-if="!poolList.length" class="text-center">
            It's empty here
          </div>
          <table v-else class="table w-full">
            <thead>
              <tr>
                <th>Set (reserve asset / gov. asset)</th>
                <th>
                  {{ !poolsListFilter ? "TVL" : "Staked balance" }}
                </th>
                <th class="flex items-center">
                  {{
                    !poolsListFilter ? "Total fee reward" : "Your fee reward"
                  }}
                  <TooltipComponent
                    class="ml-1"
                    v-show="!poolsListFilter"
                    field-name="fee_reward_table"
                  />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="poolAA in poolList" :key="poolAA">
                <td class="h12">
                  {{
                    `${poolReserveNameByAA[poolAA]}/${poolSymbolAndDecimalByAA[poolAA].name}`
                  }}
                </td>
                <td class="h-12">
                  <template v-if="!poolsListFilter">
                    ${{ getTVLByAA(poolAA) }}
                  </template>
                  <template v-else>
                    {{ getUserStakeBalance(poolAA) }}
                    {{ poolSymbolAndDecimalByAA[poolAA].name }} (${{
                      getUserStakeBalanceInUsd(poolAA)
                    }})
                  </template>
                </td>
                <td class="h-6">
                  <template v-if="!poolsListFilter">
                    ${{ rewardByAA[poolAA] }}
                  </template>
                  <template v-else>
                    ${{ preparedMetaByAA[poolAA].rewardBalanceInUsd }}
                  </template>
                </td>
                <td>
                  <div class="min-w-max">
                    <a
                      :href="`/stake/${poolAA}`"
                      class="btn btn-xs btn-primary"
                      @click.prevent="showManageStakeModal(poolAA)"
                    >
                      Stake
                    </a>
                    <RouterLink
                      :to="`/governance/management/${poolAA}`"
                      class="btn btn-xs btn-primary ml-3"
                    >
                      Govern
                    </RouterLink>
                    <a
                      v-if="
                        address &&
                        poolsListFilter &&
                        preparedMetaByAA[poolAA].rewardBalanceInUsd > 0
                      "
                      @click="
                        withdrawReward(
                          preparedMetaByAA[poolAA].rawMeta,
                          address
                        )
                      "
                      class="btn btn-xs btn-primary ml-3"
                    >
                      Withdraw
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <Dialog
    :open="modalForManage"
    @close="closeManageStakeModal()"
    class="relative z-50"
  >
    <div class="fixed inset-0 bg-black/[.8]" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center">
      <ManageStakeModal :params="manageModalParams" />
    </div>
  </Dialog>
</template>
