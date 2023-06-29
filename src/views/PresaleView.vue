<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getPresaleAssetsFromMeta } from "@/utils/getAssetsFromMeta";
import { getAssetMetadata } from "@/services/DAGApi";
import NumberInput from "@/components/inputs/NumberInput.vue";

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const selectedReserveAsset = ref("");
const selectedPresaleAsset = ref("");
const selectedAA = ref("");
const selectedAsset0 = ref("");
const amount = ref("");
const link = ref("");
const activeTab = ref("buy");
const assetsMetadata = ref({});
const reserveAssets = ref({});
const aAsPairs = ref({});
const isLoaded = ref(false);
const modalForPresale = ref();

const presaleList = ref([]);

const setTab = (tabName) => {
  activeTab.value = tabName;
};

const filterReserveAssetsWithoutPresale = () => {
  const reserveAssetsToFilter = [];
  for (let i = 0; i < Object.keys(reserveAssets.value).length; i++) {
    console.log(
      `${Object.keys(reserveAssets.value)[i]} - ${
        reserveAssets.value[Object.keys(reserveAssets.value)[i]].length
      }`
    );

    if (!reserveAssets.value[Object.keys(reserveAssets.value)[i]].length) {
      reserveAssetsToFilter.push(Object.keys(reserveAssets.value)[i]);
    }
  }

  if (reserveAssetsToFilter.length) {
    for (const reserveAssetToFilter of reserveAssetsToFilter) {
      delete reserveAssets.value[reserveAssetToFilter];
    }
  }
};

const preparePresaleList = async () => {
  if (!Object.keys(meta.value).length) {
    return;
  }

  for (const aa of aas.value) {
    const presale = { aa };
    presale.asset0 = meta.value[aa]?.state?.asset0;

    const asset0Data = await getAssetMetadata(presale.asset0);

    if (!assetsMetadata.value[presale.asset0]) {
      assetsMetadata.value[presale.asset0] = asset0Data;
    }

    const reserveAsset = meta.value[aa].reserve_asset;
    const reserveAssetData = await getAssetMetadata(reserveAsset);

    if (!reserveAssetData) continue;

    presale.reserveAsset = reserveAsset;

    if (!assetsMetadata.value[reserveAsset]) {
      assetsMetadata.value[reserveAsset] = reserveAssetData;
    }

    const presaleAssets = getPresaleAssetsFromMeta(meta.value[aa]);

    const presaleAssetsWithMetadata = [];
    for (const presaleAsset of presaleAssets) {
      const presaleAssetData = await getAssetMetadata(presaleAsset);

      if (!presaleAssetData) continue;

      presale.presaleAsset = presaleAsset;

      if (!assetsMetadata.value[presaleAsset]) {
        assetsMetadata.value[presaleAsset] = presaleAssetData;
      }

      presaleAssetsWithMetadata.push(presaleAsset);

      presaleList.value.push(presale);

      aAsPairs.value[`${reserveAsset}_${presaleAsset}`] = aa;
    }
  }

  if (Object.keys(reserveAssets.value).length) {
    filterReserveAssetsWithoutPresale();
  }

  isLoaded.value = true;
};

const choosePresale = (presale) => {
  selectedPresaleAsset.value = presale.presaleAsset;
  selectedReserveAsset.value = presale.reserveAsset;
  selectedAA.value = presale.aa;
  selectedAsset0.value = presale.asset0;

  modalForPresale.value.checked = false;
};

onMounted(async () => {
  await preparePresaleList();
});

watch(meta, preparePresaleList);

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
  <div class="container w-[320px] sm:w-[512px] m-auto mt-8 mb-36 p-8">
    <div class="p-2 mb-6">
      <div class="text-lg font-semibold leading-7">Presale</div>
      <p class="mt-2 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>

    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <div v-if="!isLoaded" class="text-center">
          <span class="loading loading-spinner loading-md"></span>
        </div>
        <div v-else>
          <div v-if="presaleList.length">
            <div class="form-control">
              <label
                for="presaleModal"
                class="btn btn-neutral !whitespace-pre-wrap leading-4"
              >
                {{
                  selectedAA
                    ? `${assetsMetadata[selectedPresaleAsset].name} in pool \n ${assetsMetadata[selectedAsset0].name} / ${assetsMetadata[selectedReserveAsset].name}`
                    : `Please select presale`
                }}
              </label>
            </div>
          </div>
          <div v-if="selectedAA">
            <div class="tabs tabs-boxed mt-8">
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
            <div class="mt-4">
              <label class="label">
                <span class="label-text">Amount</span>
              </label>
              <div class="input-group">
                <NumberInput
                  v-model="amount"
                  :decimals="assetsMetadata[selectedPresaleAsset].decimals"
                  class="input input-bordered w-full"
                />
                <span>{{ assetsMetadata[selectedPresaleAsset].name }}</span>
              </div>
            </div>
            <div class="form-control mt-6">
              <a
                class="btn btn-primary"
                :class="{ '!btn-disabled': !amount }"
                :href="link"
                >{{ activeTab === "buy" ? "buy" : "сlaim" }}</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <input
    ref="modalForPresale"
    type="checkbox"
    id="presaleModal"
    class="modal-toggle"
  />
  <label for="presaleModal" class="modal cursor-pointer">
    <label class="modal-box relative" for="">
      <div
        v-for="presale in presaleList"
        :key="`${presale.presaleAsset}_${presale.reserveAsset}_${presale.asset0}`"
        class="my-2 mx-4 cursor-pointer hover:text-gray-600"
        @click="choosePresale(presale)"
      >
        {{
          `${assetsMetadata[presale.presaleAsset].name} in pool ${
            assetsMetadata[presale.asset0].name
          } / ${assetsMetadata[presale.reserveAsset].name}`
        }}
      </div>
    </label>
  </label>
</template>
