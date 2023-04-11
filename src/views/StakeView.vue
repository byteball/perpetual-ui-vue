<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import { generateLink } from "@/utils/generateLink";
import { getPlaceholderForAmount } from "@/utils/placeholder";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getAssetMetadata } from "@/services/DAGApi";

const router = useRouter();
const route = useRoute();

const store = useAaInfoStore();
const { aas, meta, status } = storeToRefs(store);

const pools = ref([]);
const poolSymbolAndDecimalByAA = ref({});

const selectedAA = ref("");
const link = ref("");
const metaByAA = ref(null);
const amount = ref({ value: "", error: "" });
const term = ref({ value: "360", error: "" });
const votedGroupKey = ref({ value: "g1", error: "" });
const percentages = ref({ value: "100", error: "" });
const buttonDisabled = ref(true);
const activeTab = ref("stake");

async function initPools() {
  if (status.value !== "initialized") return;

  const p = [];
  for (let aa of aas.value) {
    const data = await getAssetMetadata(meta.value[aa].state.asset0);
    if (!data) continue;

    p.push(aa);
    poolSymbolAndDecimalByAA.value[aa] = data;
  }

  pools.value = p;
}

function setTab(tabName) {
  activeTab.value = tabName;
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

onMounted(() => {
  initPools();
});
watch(aas, initPools);
watch(status, initPools);

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

    if (!amount.value.value) {
      buttonDisabled.value = true;
      return;
    }

    if (!term.value.value) {
      buttonDisabled.value = true;
      term.value.error = "Term is required field!";
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

    buttonDisabled.value = false;

    const data = getData();

    link.value = generateLink(
      amount.value.value,
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
<style>
.tab {
  width: 50%;
  border-bottom-color: transparent;
  --tab-bg: transparent;
  --tab-border-color: transparent;
}
</style>
<template>
  <div
    v-if="!pools.length"
    class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8 text-center"
  >
    <button
      class="btn btn-outline btn-circle btn-lg loading border-none"
    ></button>
  </div>
  <div
    v-if="pools.length"
    class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8"
  >
    <div class="form-control">
      <label class="label">
        <span class="label-text">Pool</span>
      </label>
      <select class="select select-bordered" v-model="selectedAA">
        <option value="" disabled>Please select aa</option>
        <option v-for="aa in pools" :key="aa" :value="aa">{{ aa }}</option>
      </select>
    </div>
    <div v-if="metaByAA && poolSymbolAndDecimalByAA[metaByAA.aa]">
      <div class="tabs tabs-boxed mt-8 mb-4">
        <a
          class="tab tab-lifted"
          :class="{ 'tab-active': activeTab === 'stake' }"
          @click="setTab('stake')"
        >
          Stake
        </a>
        <a
          class="tab tab-lifted"
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
          <div class="input-group">
            <input
              type="text"
              v-model="amount.value"
              :placeholder="
                getPlaceholderForAmount(
                  poolSymbolAndDecimalByAA[metaByAA.aa].decimals
                )
              "
              class="input input-bordered w-full"
            />
            <span>{{ poolSymbolAndDecimalByAA[metaByAA.aa].name }}</span>
          </div>
          <span
            v-if="amount.error"
            class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
          >
            {{ amount.error }}
          </span>
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Term (in days)</span>
          </label>
          <input
            type="text"
            v-model="term.value"
            class="input input-bordered"
          />
          <span
            v-if="term.error"
            class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
          >
            {{ term.error }}
          </span>
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
          <div class="input-group">
            <input
              type="text"
              v-model="amount.value"
              :placeholder="
                getPlaceholderForAmount(
                  poolSymbolAndDecimalByAA[metaByAA.aa].decimals
                )
              "
              class="input input-bordered w-full"
            />
            <span>{{ poolSymbolAndDecimalByAA[metaByAA.aa].name }}</span>
          </div>
          <span
            v-if="amount.error"
            class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
          >
            {{ amount.error }}
          </span>
        </div>
      </div>
      <div class="form-control mt-6">
        <a
          class="btn btn-primary"
          :class="{ 'btn-disabled': buttonDisabled }"
          :href="link"
          >{{ activeTab === "stake" ? "stake" : "withdraw" }}</a
        >
      </div>
    </div>
  </div>
</template>
