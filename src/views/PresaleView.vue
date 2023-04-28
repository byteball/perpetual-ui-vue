<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getPresaleAssetsFromMeta } from "@/utils/getAssetsFromMeta";
import { getAssetMetadata } from "@/services/DAGApi";
import { getPlaceholderForAmount } from "@/utils/placeholder";

const router = useRouter();
const route = useRoute();

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const selectedAA = ref("");
const selectedAsset = ref("");
const amount = ref("");
const link = ref("");
const metaByAA = ref(null);
const assets = ref([]);
const activeTab = ref("buy");
const assetsMetadata = ref({});

const prepareAssetsMetadata = async () => {
  for (let asset of assets.value) {
    const data = await getAssetMetadata(asset);

    if (!data) continue;

    assetsMetadata.value[asset] = data;
  }
};
const setTab = (tabName) => {
  activeTab.value = tabName;
};

watch(
  () => {
    const aa = route.params.aa;
    const ml = Object.keys(meta.value).length;

    return `${aa}_${ml > 0}`;
  },
  async () => {
    const aa = route.params.aa;
    if (aa && meta.value[aa]) {
      selectedAA.value = aa;
      metaByAA.value = meta.value[aa];
      assets.value = getPresaleAssetsFromMeta(meta.value[aa]);
      if (assets.value.length) {
        selectedAsset.value = assets.value[0];

        await prepareAssetsMetadata();
      }
      return;
    }

    selectedAA.value = "";
    metaByAA.value = null;
    assets.value = [];
  },
  { immediate: true }
);

watch(selectedAA, () => {
  if (!selectedAA.value) return;

  router.push(`/presale/${selectedAA.value}`);
});

watch([selectedAA, selectedAsset, amount, activeTab], () => {
  if (!metaByAA.value) return;

  const assetAmount =
    metaByAA.value.reserve_asset === "base"
      ? Number(amount.value) + 1000
      : amount.value;

  const amountValue = activeTab.value === "buy" ? assetAmount : 10000;

  const data = {
    asset: selectedAsset.value,
  };

  if (activeTab.value === "buy") {
    data.presale = 1;
  }

  if (activeTab.value === "claim") {
    data.claim = assetAmount;
  }

  link.value = generateLink(
    amountValue,
    data,
    null,
    route.params.aa,
    metaByAA.value.reserve_asset,
    true
  );
});
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
  <div class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8">
    <div class="tabs tabs-boxed mt-8 mb-4">
      <a
        class="tab tab-lifted"
        :class="{ 'tab-active': activeTab === 'buy' }"
        @click="setTab('buy')"
      >
        Buy
      </a>
      <a
        class="tab tab-lifted"
        :class="{ 'tab-active': activeTab === 'claim' }"
        @click="setTab('claim')"
      >
        Claim
      </a>
    </div>
    <div>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Autonomous Agent</span>
        </label>
        <select class="select select-bordered" v-model="selectedAA">
          <option value="" disabled>Please select aa</option>
          <option v-for="aa in aas" :key="aa" :value="aa">{{ aa }}</option>
        </select>
      </div>
      <div v-show="!metaByAA">Waiting...</div>
      <div v-show="metaByAA && !assets.length">Presale assets not found</div>
      <div v-show="metaByAA && assets.length">
        <div class="form-control mt-3">
          <label class="label">
            <span class="label-text">Asset</span>
          </label>
          <select class="select select-bordered" v-model="selectedAsset">
            <option v-for="asset in assets" :key="asset" :value="asset">
              {{ asset }}
            </option>
          </select>
        </div>
        <div class="mt-3" v-if="assetsMetadata[selectedAsset]">
          <label class="label">
            <span class="label-text">Amount</span>
          </label>
          <div class="input-group">
            <input
              type="text"
              v-model="amount"
              :placeholder="
                getPlaceholderForAmount(assetsMetadata[selectedAsset].decimals)
              "
              class="input input-bordered w-full"
            />
            <span>{{ assetsMetadata[selectedAsset].name }}</span>
          </div>
        </div>
        <div v-if="!assetsMetadata[selectedAsset]">
          No metadata for this asset available...
        </div>
        <div class="form-control mt-6">
          <a class="btn btn-primary" :href="link">{{
            activeTab === "buy" ? "buy" : "сlaim"
          }}</a>
        </div>
      </div>
    </div>
  </div>
</template>
