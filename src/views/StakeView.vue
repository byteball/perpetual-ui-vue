<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";

import { generateLink } from "@/utils/generateLink";
import { getVP, getVPFromNormalized } from "@/utils/getVP";
import { useAaInfoStore } from "@/stores/aaInfo";
import { useAddressStore } from "@/stores/addressStore";
import { useUserBalance } from "@/composables/useUserBalance";
import NumberInput from "@/components/inputs/NumberInput.vue";
import IntegerInput from "@/components/inputs/IntegerInput.vue";
import Loading from "@/components/icons/LoadingIcon.vue";
import LabelForPoolsComponent from "@/components/LabelForPoolsComponent.vue";
import { getPreparedMeta } from "@/utils/governanceUtils";
import GovernanceAsset from "@/components/governance/GovernanceAsset.vue";

const router = useRouter();
const route = useRoute();

const store = useAaInfoStore();
const addressStore = useAddressStore();
const { aas, meta, status, timestamp } = storeToRefs(store);
const { address } = storeToRefs(addressStore);

const { balance } = useUserBalance(address);

const pools = ref([]);
const poolSymbolAndDecimalByAA = ref({});
const poolReserveNameByAA = ref({});
const stakeBalanceByPool = ref({});
const modalForPool = ref();

const selectedAA = ref("");
const link = ref("");
const metaByAA = ref(null);
const preparedMetaByAA = ref({});
const amount = ref({ value: "", error: "" });
const term = ref({ value: "360", error: "" });
const votedGroupKey = ref({ value: "g1", error: "" });
const percentages = ref({ value: "100", error: "" });
const buttonDisabled = ref(true);
const activeTab = ref("stake");

const balanceByAsset = computed(() => {
  if (
    !metaByAA.value?.aa ||
    !poolSymbolAndDecimalByAA.value[metaByAA.value.aa]?.asset
  ) {
    return 0;
  }

  const asset = poolSymbolAndDecimalByAA.value[metaByAA.value.aa].asset;
  const decimals = poolSymbolAndDecimalByAA.value[metaByAA.value.aa].decimals;

  let b = balance.value[asset]?.stable || 0;
  if (b) {
    b = b / 10 ** decimals;
  }

  return b;
});

const currentBalance = computed(() => {
  const balance =
    metaByAA.value?.stakingVars[`user_${address.value}_a0`]?.balance;
  return Number(balance) || 0;
});

const currentVP = computed(() => {
  if (
    !metaByAA.value ||
    !metaByAA.value.stakingVars[`user_${address.value}_a0`]
  )
    return 0;

  const normalizedVp =
    metaByAA.value.stakingVars[`user_${address.value}_a0`]?.normalized_vp;
  const decimals = poolSymbolAndDecimalByAA.value[metaByAA.value.aa].decimals;

  return Number(
    (
      getVPFromNormalized(
        normalizedVp,
        metaByAA.value["decay_factor"],
        timestamp.value
      ) /
      10 ** decimals
    ).toFixed(decimals)
  );
});

const newVP = computed(() => {
  if (Number(amount.value.value) === 0) return currentVP;

  const decimals = poolSymbolAndDecimalByAA.value[metaByAA.value.aa].decimals;
  const vp = getVP(
    Number(currentBalance.value) + Number(amount.value.value) * 10 ** decimals,
    metaByAA.value["decay_factor"],
    metaByAA.value["max_term"],
    Number(term.value.value),
    timestamp.value
  );

  return Number(
    (
      getVPFromNormalized(vp, metaByAA.value["decay_factor"], timestamp.value) /
      10 ** decimals
    ).toFixed(decimals)
  );
});

const termMeta = computed(() => {
  if (
    !metaByAA.value ||
    !metaByAA.value.stakingVars[`user_${address.value}_a0`]
  )
    return { days: 0, ended: true };

  const expiry_ts =
    metaByAA.value.stakingVars[`user_${address.value}_a0`]?.expiry_ts;

  if (!expiry_ts) return { days: 0, ended: true };

  const days = Math.floor((expiry_ts - Math.floor(Date.now() / 1000)) / 86400);

  return {
    days: days,
    ended: !(days > 0),
    date: dayjs.unix(expiry_ts).format("DD MMM YYYY HH:mm:ss"),
  };
});

const userStakeBalance = computed(() => {
  if (
    !metaByAA.value ||
    !metaByAA.value.stakingVars[`user_${address.value}_a0`]
  )
    return 0;

  let balance =
    metaByAA.value.stakingVars[`user_${address.value}_a0`]?.balance || 0;

  if (balance) {
    const decimals = poolSymbolAndDecimalByAA.value[metaByAA.value.aa].decimals;
    balance = balance / 10 ** decimals;
  }

  return balance;
});

async function initPools() {
  if (status.value !== "initialized") return;

  const _pools = [];
  const promises = [];

  async function getAndSetPoolData(aa) {
    const result = await getPreparedMeta(meta.value[aa], address.value);
    if (!result.symbolAndDecimals) return;
    preparedMetaByAA.value[aa] = result;

    if (address.value) {
      stakeBalanceByPool.value[aa] =
        meta.value[aa]?.stakingVars[`user_${address.value}_a0`]?.balance || 0;
    }

    poolSymbolAndDecimalByAA.value[aa] = result.symbolAndDecimals;
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

  pools.value = _pools;
}

watch(balanceByAsset, setAmountByUserBalance);
function setAmountByUserBalance() {
  if (address.value && balanceByAsset.value) {
    amount.value.value = String(balanceByAsset.value);
  } else {
    amount.value.value = "";
  }
}

function setAmountByUserStakeBalance() {
  if (address.value && userStakeBalance.value) {
    amount.value.value = String(userStakeBalance.value);
  } else {
    amount.value.value = "";
  }
}

function setTab(tabName) {
  activeTab.value = tabName;
  if (tabName === "stake") {
    setAmountByUserBalance();
  } else {
    setAmountByUserStakeBalance();
  }
}

function getData() {
  if (activeTab.value === "stake") {
    return {
      deposit: 1,
      term: Number(term.value.value),
      voted_group_key: votedGroupKey.value.value,
      percentages: { a0: Number(percentages.value.value) },
    };
  }

  if (activeTab.value === "withdraw") {
    return {
      withdraw: 1,
      perp_asset: metaByAA.value.state.asset0,
    };
  }
}

function setPool(pool) {
  selectedAA.value = pool;
  modalForPool.value.checked = false;
}

onMounted(() => {
  initPools();
});
watch([aas, status], initPools);
watch(() => address.value, initPools);

watch(
  () => {
    const aa = route.params.aa;
    const ml = Object.keys(meta.value).length;

    return `${aa}_${ml > 0}`;
  },
  () => {
    const aa = route.params.aa;
    if (aa && meta.value[aa]) {
      selectedAA.value = aa;
      metaByAA.value = { ...meta.value[aa], aa };
      return;
    }

    selectedAA.value = "";
    metaByAA.value = null;
  },
  { immediate: true }
);

watch(selectedAA, () => {
  if (!selectedAA.value) return;
  router.push(`/stake/${selectedAA.value}`);
});

watch(
  [amount, term, votedGroupKey, percentages],
  () => {
    if (!metaByAA.value) return;
    buttonDisabled.value = false;

    if (!amount.value.value || Number(amount.value.value) === 0) {
      buttonDisabled.value = true;
    }

    if (address.value && amount.value.value > balanceByAsset.value) {
      buttonDisabled.value = true;
      term.value.error =
        "Insufficient funds, please buy tokens on the Market page";
      return;
    }

    if (!term.value.value) {
      buttonDisabled.value = true;
      term.value.error = "Term is required field!";
      return;
    }

    if (Number(term.value.value) <= termMeta.value.days) {
      buttonDisabled.value = true;
      term.value.error = `Time must be more than ${termMeta.value.days} days`;
      return;
    }

    if (!votedGroupKey.value.value) {
      buttonDisabled.value = true;
      votedGroupKey.value.error = "Voted group key is required field!";
      return;
    }

    if (!percentages.value.value) {
      buttonDisabled.value = true;
      percentages.value.error = "Percentages group key is required field!";
      return;
    }

    term.value.error = "";
    const data = getData();

    link.value = generateLink(
      Number(amount.value.value) *
        10 ** poolSymbolAndDecimalByAA.value[metaByAA.value.aa].decimals,
      data,
      null,
      metaByAA.value.staking_aa,
      metaByAA.value.state.asset0,
      true
    );
  },
  {
    deep: true,
  }
);

watch(
  () => term.value.value,
  () => {
    term.value.error = "";

    const termValue = term.value.value;

    if (!termValue) {
      term.value.error = "Term is required field";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => votedGroupKey.value.value,
  () => {
    votedGroupKey.value.error = "";

    const votedGroupKeyValue = votedGroupKey.value.value;

    if (!votedGroupKeyValue) {
      votedGroupKey.value.error = "Voted group key is required field";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => percentages.value.value,
  () => {
    percentages.value.error = "";

    const percentagesValue = percentages.value.value;

    if (!percentagesValue) {
      percentages.value.error = "Percentages is required field";
    }
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <div class="container w-full sm:w-[512px] m-auto mt-2 mb-36 p-6 sm:p-8">
    <div class="p-2 mb-6">
      <div class="text-lg font-semibold leading-7">Stake</div>
      <p class="mt-2 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body p-6 sm:p-8">
        <div v-if="!pools.length" class="text-center">
          <Loading />
        </div>
        <div v-if="pools.length">
          <div class="form-control">
            <LabelForPoolsComponent for="poolModal">
              {{
                selectedAA
                  ? `${poolReserveNameByAA[selectedAA]}/${poolSymbolAndDecimalByAA[selectedAA].name}`
                  : `Please select pool`
              }}
            </LabelForPoolsComponent>
          </div>
          <div v-if="metaByAA && poolSymbolAndDecimalByAA[metaByAA.aa]">
            <div class="mt-4 mb-4">
              <GovernanceAsset
                :perpetual-aa-meta="preparedMetaByAA[metaByAA.aa]"
              />
              <div v-if="address">
                Your stake: {{ userStakeBalance }}
                {{ poolSymbolAndDecimalByAA[selectedAA].name }}
              </div>
            </div>
            <div>
              <div class="tabs tabs-boxed mt-8 mb-1">
                <a
                  class="tab"
                  :class="{ 'tab-active': activeTab === 'stake' }"
                  @click="setTab('stake')"
                >
                  Stake
                </a>
                <a
                  class="tab"
                  :class="{ 'tab-active': activeTab === 'withdraw' }"
                  @click="setTab('withdraw')"
                >
                  Withdraw
                </a>
              </div>

              <div v-if="activeTab === 'stake'">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Amount</span>
                  </label>
                  <div>
                    <NumberInput
                      v-model="amount.value"
                      :label="poolSymbolAndDecimalByAA[metaByAA.aa].name"
                      :decimals="poolSymbolAndDecimalByAA[metaByAA.aa].decimals"
                    />
                  </div>
                  <span
                    v-if="amount.error"
                    class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
                  >
                    {{ amount.error }}
                  </span>
                </div>
                <div class="form-control mt-2">
                  <label class="label">
                    <span class="label-text">Term (in days)</span>
                  </label>
                  <IntegerInput v-model="term.value" :max-value="360" />
                  <span
                    v-if="term.error"
                    class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
                  >
                    {{ term.error }}
                  </span>
                  <div v-if="term.value" class="mt-2 text-sm">
                    Will be locked until
                    {{
                      dayjs().add(term.value, "day").format("DD MMM YYYY HH:mm")
                    }}
                    (this applies to the previously locked tokens too)
                  </div>
                </div>
                <div class="mt-4">
                  <div v-if="address">Current VP: {{ currentVP }}</div>
                  <div>New VP: {{ newVP }}</div>
                </div>
                <!--      <div class="form-control">-->
                <!--        <label class="label">-->
                <!--          <span class="label-text">Voted group key</span>-->
                <!--        </label>-->
                <!--        <input-->
                <!--          type="text"-->
                <!--          v-model="votedGroupKey.value"-->
                <!--          class="input input-bordered"-->
                <!--        />-->
                <!--        <span-->
                <!--          v-if="votedGroupKey.error"-->
                <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
                <!--        >-->
                <!--          {{ votedGroupKey.error }}-->
                <!--        </span>-->
                <!--      </div>-->
                <!--      <div class="form-control">-->
                <!--        <label class="label">-->
                <!--          <span class="label-text">Percentages</span>-->
                <!--        </label>-->
                <!--        <input-->
                <!--          type="text"-->
                <!--          v-model="percentages.value"-->
                <!--          class="input input-bordered"-->
                <!--        />-->
                <!--        <span-->
                <!--          v-if="percentages.error"-->
                <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
                <!--        >-->
                <!--          {{ percentages.error }}-->
                <!--        </span>-->
                <!--      </div>-->
              </div>
              <div v-if="activeTab === 'withdraw'">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Amount</span>
                  </label>
                  <div v-if="termMeta.ended || !address">
                    <div>
                      <NumberInput
                        v-model="amount.value"
                        :decimals="
                          poolSymbolAndDecimalByAA[metaByAA.aa].decimals
                        "
                        :label="poolSymbolAndDecimalByAA[metaByAA.aa].name"
                      />
                    </div>
                    <span
                      v-if="amount.error"
                      class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
                    >
                      {{ amount.error }}
                    </span>
                  </div>
                  <div v-else>
                    <div class="text-center mt-8 mb-8">
                      The withdrawal will be available after the end of the
                      stake period: {{ termMeta.date }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-control mt-6">
                <a
                  class="btn btn-primary"
                  :class="{ '!btn-disabled': buttonDisabled }"
                  :href="link"
                  >{{ activeTab === "stake" ? "stake" : "withdraw" }}</a
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <input
    ref="modalForPool"
    type="checkbox"
    id="poolModal"
    class="modal-toggle"
  />
  <label for="poolModal" class="modal cursor-pointer">
    <label class="modal-box relative" for="">
      <div
        v-for="aa in pools"
        :key="aa"
        class="my-2 mx-4 cursor-pointer hover:text-gray-600"
        @click="setPool(aa)"
      >
        {{ `${poolReserveNameByAA[aa]}/${poolSymbolAndDecimalByAA[aa].name}` }}
      </div>
    </label>
  </label>
</template>
