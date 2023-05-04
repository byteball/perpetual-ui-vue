<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getPresaleAssetsFromMeta } from "@/utils/getAssetsFromMeta";
import { getAssetMetadata } from "@/services/DAGApi";
import { getPlaceholderForAmount } from "@/utils/placeholder";

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const selectedReserveAsset = ref("");
const selectedPresaleAsset = ref("");
const amount = ref("");
const link = ref("");
const activeTab = ref("buy");
const assetsMetadata = ref({});
const reserveAssets = ref({});
const aAsPairs = ref({});

const setTab = (tabName) => {
  activeTab.value = tabName;
};

const prepareReserveAssetList = async () => {
  for (const aa of aas.value) {
    const reserveAsset = meta.value[aa].reserve_asset;

    const reserveAssetData = await getAssetMetadata(reserveAsset);

    if (!reserveAssetData) continue;

    if (!assetsMetadata.value[reserveAsset]) {
      assetsMetadata.value[reserveAsset] = reserveAssetData;
    }

    const presaleAssets = getPresaleAssetsFromMeta(meta.value[aa]);

    const presaleAssetsWithMetadata = [];
    for (const asset of presaleAssets) {
      const presaleAssetData = await getAssetMetadata(asset);

      if (!presaleAssetData) continue;

      if (!assetsMetadata.value[asset]) {
        assetsMetadata.value[asset] = presaleAssetData;
      }

      presaleAssetsWithMetadata.push(asset);

      aAsPairs.value[`${reserveAsset}_${asset}`] = aa;
    }

    reserveAssets.value[reserveAsset] = reserveAssets.value[reserveAsset]
      ? [...reserveAssets.value[reserveAsset], ...presaleAssetsWithMetadata]
      : presaleAssetsWithMetadata;
  }
};

onMounted(async () => {
  await prepareReserveAssetList();
});

watch(aas, prepareReserveAssetList);
watch(meta, prepareReserveAssetList);

watch([selectedReserveAsset, selectedPresaleAsset, amount, activeTab], () => {
  const assetAmount =
    selectedReserveAsset.value === "base"
      ? Number(amount.value) + 1000
      : amount.value;

  const amountValue = activeTab.value === "buy" ? assetAmount : 10000;

  const data = {
    asset: selectedPresaleAsset.value,
  };

  if (activeTab.value === "buy") {
    data.presale = 1;
  }

  if (activeTab.value === "claim") {
    data.claim = assetAmount;
  }

  const aa =
    aAsPairs.value[
      `${selectedReserveAsset.value}_${selectedPresaleAsset.value}`
    ];

  link.value = generateLink(
    amountValue,
    data,
    null,
    aa,
    selectedReserveAsset.value,
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
      <div v-if="!Object.keys(reserveAssets).length">
        Reserve assets not found
      </div>
      <div v-if="Object.keys(reserveAssets).length">
        <div class="form-control mt-3">
          <label class="label">
            <span class="label-text">Reserve Asset</span>
          </label>
          <select class="select select-bordered" v-model="selectedReserveAsset">
            <template
              :key="reserveAsset"
              v-for="reserveAsset in Object.keys(reserveAssets)"
            >
              <option
                :value="reserveAsset"
                v-if="reserveAssets[reserveAsset].length"
              >
                {{ reserveAsset }}
              </option>
            </template>
          </select>
        </div>
        <div
          v-if="
            selectedReserveAsset && !reserveAssets[selectedReserveAsset].length
          "
        >
          Presale assets not found
        </div>
        <div
          v-if="
            selectedReserveAsset && reserveAssets[selectedReserveAsset].length
          "
          class="form-control mt-3"
        >
          <label class="label">
            <span class="label-text">Presale Asset</span>
          </label>
          <select class="select select-bordered" v-model="selectedPresaleAsset">
            <option
              v-for="presaleAsset in reserveAssets[selectedReserveAsset]"
              :key="presaleAsset"
              :value="presaleAsset"
            >
              {{ presaleAsset }}
            </option>
          </select>
        </div>
        <div class="mt-3">
          <label class="label">
            <span class="label-text">Amount</span>
          </label>
          <div class="input-group">
            <input
              type="text"
              v-model="amount"
              :placeholder="
                getPlaceholderForAmount(
                  assetsMetadata[selectedPresaleAsset].decimals
                )
              "
              class="input input-bordered w-full"
            />
            <span>{{ assetsMetadata[selectedPresaleAsset].name }}</span>
          </div>
        </div>
        <div class="form-control mt-6">
          <a
            class="btn btn-primary"
            :class="{ 'btn-disabled': !amount }"
            :href="link"
            >{{ activeTab === "buy" ? "buy" : "сlaim" }}</a
          >
        </div>
      </div>
    </div>
  </div>
</template>
