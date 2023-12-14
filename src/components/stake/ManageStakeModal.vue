<script setup>
import { DialogPanel } from "@headlessui/vue";
import dayjs from "dayjs";
import NumberInput from "@/components/inputs/NumberInput.vue";
import IntegerInput from "@/components/inputs/IntegerInput.vue";
import { computed, ref, watch } from "vue";
import { DEFAULT_MAX_TERM } from "@/globalConstants";
import { generateLink } from "@/utils/generateLink";
import { getVP, getVPFromNormalized } from "@/utils/getVP";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import { useUserBalance } from "@/composables/useUserBalance";
import { useAddressStore } from "@/stores/addressStore";

const store = useAaInfoStore();
const addressStore = useAddressStore();

const { address } = storeToRefs(addressStore);
const { balance } = useUserBalance(address);

const props = defineProps(["params"]);

const amount = ref({ value: "", error: "" });
const term = ref({ value: "360", error: "" });
const votedGroupKey = ref({ value: "g1", error: "" });
const percentages = ref({ value: "100", error: "" });
const buttonDisabled = ref(true);
const activeTab = ref("stake");

const link = ref("");

const { timestamp } = storeToRefs(store);

const balanceByAsset = computed(() => {
  if (!props.params.metaByAA.aa || !props.params.poolSymbolAndDecimal?.asset) {
    return 0;
  }

  const asset = props.params.poolSymbolAndDecimal.asset;
  const decimals = props.params.poolSymbolAndDecimal.decimals;

  let b = balance.value[asset]?.stable || 0;
  if (b) {
    b = b / 10 ** decimals;
  }

  return b;
});

const currentBalance = computed(() => {
  const balance =
    props.params.metaByAA?.stakingVars[`user_${address.value}_a0`]?.balance;
  return Number(balance) || 0;
});

const currentVP = computed(() => {
  if (
    !props.params.metaByAA ||
    !props.params.metaByAA.stakingVars[`user_${address.value}_a0`]
  )
    return 0;

  const normalizedVp =
    props.params.metaByAA.stakingVars[`user_${address.value}_a0`]
      ?.normalized_vp;
  const decimals = props.params.poolSymbolAndDecimal.decimals;

  return Number(
    (
      getVPFromNormalized(
        normalizedVp,
        props.params.metaByAA["decay_factor"],
        timestamp.value
      ) /
      10 ** decimals
    ).toFixed(decimals)
  );
});

const newVP = computed(() => {
  if (Number(amount.value.value) === 0) return currentVP;

  const decimals = props.params.poolSymbolAndDecimal.decimals;
  const vp = getVP(
    Number(currentBalance.value) + Number(amount.value.value) * 10 ** decimals,
    props.params.metaByAA["decay_factor"],
    props.params.metaByAA["max_term"],
    Number(term.value.value),
    timestamp.value
  );

  return Number(
    (
      getVPFromNormalized(
        vp,
        props.params.metaByAA["decay_factor"],
        timestamp.value
      ) /
      10 ** decimals
    ).toFixed(decimals)
  );
});

const termMeta = computed(() => {
  if (
    !props.params.metaByAA ||
    !props.params.metaByAA.stakingVars[`user_${address.value}_a0`]
  )
    return { days: 14, ended: true };

  const expiry_ts =
    props.params.metaByAA.stakingVars[`user_${address.value}_a0`]?.expiry_ts;

  if (!expiry_ts) return { days: 13, ended: true };

  const days = Math.floor((expiry_ts - Math.floor(Date.now() / 1000)) / 86400);

  return {
    days: days,
    ended: !(days > 0),
    date: dayjs.unix(expiry_ts).format("DD MMM YYYY HH:mm:ss"),
  };
});

function setAmountByUserStakeBalance() {
  if (address.value && props.params.userStakeBalance) {
    amount.value.value = String(props.params.userStakeBalance);
  } else {
    amount.value.value = "";
  }
}

function setTab(tabName) {
  activeTab.value = tabName;
  if (tabName === "stake") {
    amount.value.value = "";
  } else {
    setAmountByUserStakeBalance();
  }
}

function setMyBalance() {
  amount.value.value = String(balanceByAsset.value);
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
      perp_asset: props.params.metaByAA.state.asset0,
    };
  }
}

watch(
  [amount, term, votedGroupKey, percentages],
  () => {
    if (!props.params.metaByAA) return;

    buttonDisabled.value =
      !amount.value.value || Number(amount.value.value) === 0;

    if (address.value && amount.value.value > balanceByAsset.value) {
      buttonDisabled.value = true;
      term.value.error =
        "Insufficient funds, please buy tokens on the Trade page";
      return;
    }

    if (!term.value.value) {
      buttonDisabled.value = true;
      term.value.error = "Term is required field!";
      return;
    }

    if (Number(term.value.value) < termMeta.value.days) {
      buttonDisabled.value = true;
      term.value.error = `The minimum term is ${termMeta.value.days} days`;
      return;
    }

    if (Number(term.value.value) > DEFAULT_MAX_TERM) {
      buttonDisabled.value = true;
      term.value.error = `The maximum term is ${DEFAULT_MAX_TERM} days`;
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

    const a =
      Number(amount.value.value) *
      10 ** props.params.poolSymbolAndDecimal.decimals;
    link.value = generateLink(
      Math.floor(a),
      data,
      null,
      props.params.metaByAA.staking_aa,
      props.params.metaByAA.state.asset0,
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
</script>

<template>
  <DialogPanel class="w-full max-w-xl rounded-2xl bg-base-200 p-8">
    <div class="text-center text-2xl font-bold">
      {{
        `Manage ${props.params.poolReserveAssetName}/${props.params.poolSymbolAndDecimal.name} stake`
      }}
    </div>
    <div class="form-control">
      <div v-if="props.params.metaByAA && props.params.poolSymbolAndDecimal">
        <div>
          <div class="tabs tabs-boxed mt-6 mb-1">
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
              <div>
                <label class="label">
                  <span class="label-text"
                    >Amount
                    <template v-if="balanceByAsset > 0">
                      <a
                        class="link link-hover text-sky-500"
                        @click="setMyBalance"
                        >(Balance: {{ balanceByAsset }})</a
                      ></template
                    ></span
                  >
                </label>
                <NumberInput
                  v-model="amount.value"
                  :label="props.params.poolSymbolAndDecimal.name"
                  :decimals="props.params.poolSymbolAndDecimal.decimals"
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
                <span class="label-text"
                  >Term, in days. Longer term gives you more voting power in
                  <RouterLink
                    :to="`/governance/management/${params.metaByAA.aa}`"
                    class="link link-hover text-sky-500"
                    >governance</RouterLink
                  >.</span
                >
              </label>
              <IntegerInput v-model="term.value" />
              <span
                v-if="term.error"
                class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
              >
                {{ term.error }}
              </span>
              <div v-if="term.value" class="mt-2 text-sm">
                Will be locked until
                {{ dayjs().add(term.value, "day").format("DD MMM YYYY HH:mm") }}
                (this applies to the previously locked tokens too)
              </div>
            </div>
            <div class="mt-4">
              <div v-if="address">Current VP: {{ currentVP }}</div>
              <div>New Voting Power: {{ newVP }}</div>
            </div>
          </div>
          <div v-if="activeTab === 'withdraw'">
            <div class="form-control">
              <div v-if="termMeta.ended || !address">
                <div>
                  <label class="label">
                    <span class="label-text">Amount</span>
                  </label>
                  <NumberInput
                    v-model="amount.value"
                    :decimals="props.params.poolSymbolAndDecimal.decimals"
                    :label="props.params.poolSymbolAndDecimal.name"
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
                  The withdrawal will be available after the end of the stake
                  period: {{ termMeta.date }}
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
  </DialogPanel>
</template>
