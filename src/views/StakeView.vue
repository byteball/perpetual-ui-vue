<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import { useAaInfoStore } from "@/stores/aaInfo";
import { useAddressStore } from "@/stores/addressStore";
import Loading from "@/components/icons/LoadingIcon.vue";
import { getPreparedMeta } from "@/utils/governanceUtils";
import { Dialog } from "@headlessui/vue";
import ManageStakeModal from "@/components/stake/ManageStakeModal.vue";
import LinkIcon from "@/components/icons/LinkIcon.vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const store = useAaInfoStore();
const addressStore = useAddressStore();
const { aas, meta, status } = storeToRefs(store);
const { address } = storeToRefs(addressStore);

const pools = ref([]);
const poolsInited = ref(false);
const poolSymbolAndDecimalByAA = ref({});
const poolReserveNameByAA = ref({});
const stakeBalanceByPool = ref({});
const manageModalParams = ref({});

const preparedMetaByAA = ref({});

const modalForManage = ref(false);
const poolsListFilter = ref(false);

const getUserStakeBalance = (aa) => {
  if (
    !meta.value[aa] ||
    !meta.value[aa].stakingVars[`user_${address.value}_a0`]
  ) {
    return 0;
  }

  let balance =
    meta.value[aa].stakingVars[`user_${address.value}_a0`]?.balance || 0;

  if (balance) {
    const decimals = poolSymbolAndDecimalByAA.value[aa].decimals;
    balance = balance / 10 ** decimals;
  }

  return balance;
};

function sortPoolsByName(_pools) {
  return _pools.sort((a, b) => {
    const aPoolName = `${poolReserveNameByAA.value[a]}/${poolSymbolAndDecimalByAA.value[a].name}`;
    const bPoolName = `${poolReserveNameByAA.value[b]}/${poolSymbolAndDecimalByAA.value[b].name}`;

    if (aPoolName > bPoolName) {
      return 1;
    }

    if (aPoolName < bPoolName) {
      return -1;
    }

    return 0;
  });
}

async function initPools() {
  if (status.value !== "initialized") return;

  const _pools = [];
  const promises = [];

  async function getAndSetPoolData(aa) {
    const result = await getPreparedMeta(meta.value[aa], address.value);
    if (!result.asset0SymbolAndDecimals) return;
    preparedMetaByAA.value[aa] = result;

    if (address.value) {
      stakeBalanceByPool.value[aa] =
        meta.value[aa]?.stakingVars[`user_${address.value}_a0`]?.balance || 0;
    }

    poolSymbolAndDecimalByAA.value[aa] = result.asset0SymbolAndDecimals;
    _pools.push(aa);

    if (!result.reserveAsset) {
      poolReserveNameByAA.value[aa] = meta.value[aa].reserve_asset;
      return;
    }

    poolReserveNameByAA.value[aa] = result.reserveAsset.name;
  }

  for (let aa in meta.value) {
    promises.push(getAndSetPoolData(aa));
  }

  await Promise.all(promises);

  pools.value = sortPoolsByName(_pools);
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
  router.push(`/stake`);
};

const poolList = computed(() => {
  const list = pools.value;

  if (!poolsListFilter.value) {
    return list;
  }

  return list.filter((pool) => {
    return !!getUserStakeBalance(pool);
  });
});

onMounted(() => {
  initPools();
});
watch([aas, status], initPools);
watch(() => address.value, initPools);

const showManageStakeModal = (poolAA) => {
  router.push(`/stake/${poolAA}`);

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
  <div class="container w-full sm:w-[768px] m-auto mt-2 mb-36 p-6 sm:p-8">
    <div class="p-2 mb-6">
      <div class="text-lg font-semibold leading-7">Stake</div>
      <p class="mt-2 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>
    <div v-if="address" class="mb-2">
      <button
        class="btn btn-sm"
        :class="{ 'btn-active': !poolsListFilter }"
        @click="changePoolFilter('all')"
      >
        All
      </button>
      <button
        class="btn btn-sm ml-1"
        :class="{ 'btn-active': poolsListFilter }"
        @click="changePoolFilter('my')"
      >
        My pools
      </button>
    </div>
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body p-6 sm:p-8">
        <div v-if="!poolsInited" class="text-center">
          <Loading />
        </div>
        <div v-else>
          <div v-if="!poolList.length" class="text-center">
            While it's empty here
          </div>
          <table v-else class="table w-full">
            <thead>
              <tr>
                <th>Pool</th>
                <th>Stake balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="poolAA in poolList" :key="poolAA">
                <td class="flex items-center">
                  {{
                    `${poolReserveNameByAA[poolAA]}/${poolSymbolAndDecimalByAA[poolAA].name}`
                  }}
                  <RouterLink
                    class="ml-1 text-sky-500"
                    :to="`/governance/management/${poolAA}`"
                  >
                    <LinkIcon />
                  </RouterLink>
                </td>
                <td>
                  {{ getUserStakeBalance(poolAA) }}
                  {{ poolSymbolAndDecimalByAA[poolAA].name }}
                </td>
                <td>
                  <button
                    class="btn btn-xs btn-primary"
                    @click="showManageStakeModal(poolAA)"
                  >
                    Manage
                  </button>
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
