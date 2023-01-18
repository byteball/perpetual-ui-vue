<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useAaInfoStore } from "@/stores/aaInfo";
import { generateLink } from "@/utils/generateLink";
import { getExchangeResultByState } from "@/utils/getExchangeResultByState";
import { transformAssetName } from "@/utils/transformAssetName";

const router = useRouter();
const route = useRoute();

const store = useAaInfoStore();
const { aas, meta, status } = storeToRefs(store);

const selectedAA = ref("");
const selectedAsset = ref("");
const metaByAA = ref(null);
const currentTab = ref("buy");

const amount = ref("");
const link = ref("");
const result = ref({});
const buttonDisabled = ref(true);

function initSelectedAA() {
  if (status.value !== "initialized") return;

  if (!route.params.aa && aas.value.length) {
    router.push(`/market/${aas.value[0]}`);
    selectedAA.value = aas.value[0];
  } else if (route.params.aa) {
    selectedAA.value = route.params.aa;
  }

  console.log(meta.value, aas.value);
  if (meta.value[selectedAA.value]) {
    metaByAA.value = { ...meta.value[selectedAA.value], aa: selectedAA.value };
    // assets.value = getAllAssetsFromMeta(meta.value[aa]);

    selectedAsset.value = metaByAA.value.state.asset0;
    return;
  }

  metaByAA.value = null;
}

function setTab(name) {
  currentTab.value = name;
  amount.value = "";
  link.value = "";
  result.value = {};
  buttonDisabled.value = true;
}

onMounted(() => {
  initSelectedAA();
});

watch(aas, initSelectedAA);
watch(status, initSelectedAA);

watch(amount, () => {
  if (!metaByAA.value) return;
  const aa = route.params.aa;

  let amountForLink = 0;
  let assetForLink = "";
  if (currentTab.value === "buy") {
    amountForLink =
      metaByAA.value.reserve_asset === "base"
        ? Number(amount.value) + 1000
        : amount.value;
    assetForLink = metaByAA.value.reserve_asset;
  } else {
    amountForLink =
      metaByAA.value.state.asset0 === "base"
        ? Number(amount.value) + 1000
        : amount.value;
    assetForLink = metaByAA.value.state.asset0;
  }

  link.value = generateLink(
    amountForLink,
    {
      asset: metaByAA.value.state.asset0,
    },
    null,
    aa,
    assetForLink,
    true
  );

  if (Number(amount.value) <= 0) {
    result.value = {};
    buttonDisabled.value = true;
    return;
  }
  buttonDisabled.value = false;

  result.value = getExchangeResultByState(
    currentTab.value === "sell" ? Number(amount.value) : 0,
    currentTab.value === "buy" ? Number(amount.value) : 0,
    metaByAA.value.state.asset0,
    null,
    { ...metaByAA.value.state },
    metaByAA.value
  );
});
</script>

<template>
  <div class="w-[512px] m-auto mt-48 mb-36">
    <div v-if="!aas.length">Loading...</div>
    <div class="form-control" v-if="aas.length">
      <label class="label">
        <span class="label-text">Perpetual AA</span>
      </label>
      <select class="select select-bordered mb-4 w-full" v-model="selectedAA">
        <option v-for="aa in aas" :key="aa" :value="aa">{{ aa }}</option>
      </select>

      <div class="my-8">[CHART]</div>

      <label class="label">
        <span class="label-text">Asset</span>
      </label>
      <div>
        <select
          class="select select-bordered mb-4 w-full"
          v-model="selectedAsset"
        >
          <option
            v-if="metaByAA?.state"
            :key="metaByAA.state.asset0"
            :value="metaByAA.state.asset0"
          >
            {{ metaByAA.state.asset0 }}
          </option>
        </select>
      </div>

      <div class="tabs tabs-boxed mt-4">
        <a
          @click="setTab('buy')"
          class="tab flex-auto"
          :class="{ 'tab-active': currentTab === 'buy' }"
          >Buy</a
        >
        <a
          @click="setTab('sell')"
          class="tab flex-auto"
          :class="{ 'tab-active': currentTab === 'sell' }"
          >Sell</a
        >
      </div>

      <div v-if="currentTab === 'buy'">
        <div class="mt-4">
          <input
            type="text"
            placeholder="Amount"
            v-model="amount"
            class="input input-bordered w-full"
          />
        </div>
        <div class="mt-4" v-if="Object.keys(result).length">
          <div>
            Your get: {{ result.delta_s }}
            {{ transformAssetName(metaByAA.state.asset0) }}
          </div>
          <div>New price: {{ result.new_price }}</div>
          <div>Fee: {{ Number(result.fee_percent.toFixed(2)) }}%</div>
        </div>
        <div class="mt-4">
          <a
            class="btn btn-primary"
            :class="{ 'btn-disabled': buttonDisabled }"
            :href="link"
            >Buy token</a
          >
        </div>
      </div>

      <div v-if="currentTab === 'sell'">
        <div class="mt-4">
          <input
            type="text"
            placeholder="Amount"
            v-model="amount"
            class="input input-bordered w-full"
          />
        </div>
        <div class="mt-4" v-if="Object.keys(result).length">
          <div>
            Your get: {{ result.payout }}
            {{ transformAssetName(metaByAA.reserve_asset) }}
          </div>
          <div>New price: {{ result.new_price }}</div>
          <div>Fee: {{ Number(result.fee_percent.toFixed(2)) }}%</div>
        </div>
        <div class="mt-4">
          <a
            class="btn btn-primary"
            :class="{ 'btn-disabled': buttonDisabled }"
            :href="link"
            >Sell token</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
