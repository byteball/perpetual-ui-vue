<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import {
  getAssetsFromMeta,
  getPairedAssetsByAsset,
  getAssetInfoFromMeta,
  getAssetsOnlyWithSymbolsAndDecimals,
} from "@/utils/assetsUtils";
import { generateLink } from "@/utils/generateLink";
import { getExchangeResultByState } from "@/utils/getExchangeResultByState";
import { getPlaceholderForAmount } from "@/utils/placeholder";

const store = useAaInfoStore();
const { aas, meta, status } = storeToRefs(store);

const assets = ref({
  assetList: [],
  assetsByAA: {},
  nameAndDecimalsByAsset: {},
});
const pairedAssets = ref([]);
const asset1 = ref("");
const asset1Amount = ref("");
const asset2 = ref("");
const asset2Amount = ref("");
const metaByActiveAA = ref();
const modalForAsset1 = ref();
const modalForAsset2 = ref();

const link = ref("");
const percent = ref(0);
const newPrice = ref(0);

async function initSelectedAA() {
  if (status.value !== "initialized") return;
  const a = getAssetsFromMeta(meta.value, true);
  assets.value = await getAssetsOnlyWithSymbolsAndDecimals(a);
}

function asset1Handler() {
  pairedAssets.value = getPairedAssetsByAsset(
    asset1.value,
    assets.value.assetsByAA
  );
}

function asset2Handler() {
  metaByActiveAA.value = meta.value[pairedAssets.value[asset2.value]];
  if (asset1.value) {
    calcAndSetDataForMetaAndLink();
  }
}

function setAsset1(asset) {
  asset1.value = asset;
  asset2.value = "";
  asset1Amount.value = "";
  asset2Amount.value = "";
  modalForAsset1.value.checked = false;
}

function setAsset2(asset) {
  asset2.value = asset;
  modalForAsset2.value.checked = false;
}

function calcDataForBuy() {
  const { reserve_asset, state, asset0 } = metaByActiveAA.value;
  const aa = pairedAssets.value[asset2.value];

  const l = generateLink(
    reserve_asset === "base"
      ? Number(asset1Amount.value) * 10 ** 9 + 1000
      : Number(
          asset1Amount.value *
            10 ** assets.value.nameAndDecimalsByAsset[asset1.value].decimals
        ),
    {
      asset: asset2.value,
    },
    null,
    aa,
    reserve_asset,
    true
  );

  const r = getExchangeResultByState(
    0,
    Number(asset1Amount.value) *
      10 ** assets.value.nameAndDecimalsByAsset[asset1.value].decimals,
    asset2.value,
    asset2.value === asset0
      ? null
      : { ...getAssetInfoFromMeta(asset2.value, aa, meta.value) },
    { ...state },
    metaByActiveAA.value
  );

  if (isNaN(r.delta_s)) {
    r.delta_s = "";
  }

  return {
    link: l,
    result: r,
  };
}

function calcDataForSell() {
  const { state, asset0 } = metaByActiveAA.value;
  const aa = pairedAssets.value[asset2.value];

  const l = generateLink(
    Number(asset1Amount.value) *
      10 ** assets.value.nameAndDecimalsByAsset[asset1.value].decimals,
    {
      asset: asset1.value,
    },
    null,
    aa,
    asset1.value,
    true
  );

  const r = getExchangeResultByState(
    Number(asset1Amount.value) *
      10 ** assets.value.nameAndDecimalsByAsset[asset1.value].decimals,
    0,
    asset1.value,
    asset1.value === asset0
      ? null
      : { ...getAssetInfoFromMeta(asset1.value, aa, meta.value) },
    { ...state },
    asset1.value
  );

  if (r.payout === undefined || isNaN(r.payout)) {
    r.payout = "";
  }

  return {
    link: l,
    result: r,
  };
}

function calcAndSetDataForMetaAndLink() {
  if (!asset1.value || !asset2.value) return;

  let data;
  if (metaByActiveAA.value.reserve_asset === asset1.value) {
    data = calcDataForBuy();
    asset2Amount.value =
      Number(data.result.delta_s) /
      10 ** assets.value.nameAndDecimalsByAsset[asset2.value].decimals;
  } else {
    data = calcDataForSell();
    asset2Amount.value =
      Number(data.result.payout) /
      10 ** assets.value.nameAndDecimalsByAsset[asset2.value].decimals;
  }

  link.value = data.link;
  percent.value = data.result.fee_percent;
  newPrice.value = data.result.new_price;
  console.log("result", data.result);
}

onMounted(() => {
  initSelectedAA();
});
watch(aas, initSelectedAA);
watch(status, initSelectedAA);

watch(asset1, asset1Handler);
watch(asset2, asset2Handler);
watch([asset1Amount, asset2Amount], calcAndSetDataForMetaAndLink);
</script>

<template>
  <div class="container w-[320px] sm:w-[512px] m-auto mt-48 mb-36 p-8">
    <div v-if="!assets.assetList.length" class="text-center">
      <button
        class="btn btn-outline btn-circle btn-lg loading border-none"
      ></button>
    </div>
    <div class="form-control" v-if="assets.assetList.length">
      <div class="input-group">
        <input
          type="text"
          :placeholder="
            getPlaceholderForAmount(
              assets.nameAndDecimalsByAsset[asset1]?.decimals
            )
          "
          class="input input-bordered w-full"
          v-model.number="asset1Amount"
          :disabled="!asset1"
        />
        <label for="asset1Modal" class="btn">{{
          asset1 ? assets.nameAndDecimalsByAsset[asset1].name : "Select asset"
        }}</label>
      </div>
      <div class="input-group mt-4">
        <input
          type="text"
          placeholder="0"
          class="input input-bordered w-full"
          :disabled="!asset2"
          v-model.number="asset2Amount"
          readonly
        />
        <label
          for="asset2Modal"
          class="btn"
          :class="{ 'btn-disabled': !asset1 }"
          >{{
            asset2 ? assets.nameAndDecimalsByAsset[asset2].name : "Select asset"
          }}</label
        >
      </div>
      <div v-if="asset2Amount" class="mt-4">
        <div>Fee: {{ Number(percent.toFixed(4)) }}%</div>
        <div>New price: {{ newPrice }}</div>
        <div></div>
      </div>
      <div class="mt-8 text-center">
        <a
          class="btn btn-primary"
          :href="link"
          :class="{ 'btn-disabled': !link || !(Number(asset2Amount) > 0) }"
          >Exchange</a
        >
      </div>
    </div>
  </div>

  <!--  modals -->
  <input
    ref="modalForAsset1"
    type="checkbox"
    id="asset1Modal"
    class="modal-toggle"
  />
  <label for="asset1Modal" class="modal cursor-pointer">
    <label class="modal-box relative" for="">
      <div
        v-for="asset in assets.assetList"
        :key="asset"
        class="my-2 mx-4 cursor-pointer hover:text-gray-600"
        @click="setAsset1(asset)"
      >
        {{ assets.nameAndDecimalsByAsset[asset].name }}
      </div>
    </label>
  </label>
  <input
    ref="modalForAsset2"
    type="checkbox"
    id="asset2Modal"
    class="modal-toggle"
  />
  <label for="asset2Modal" class="modal cursor-pointer">
    <label class="modal-box relative" for="">
      <div
        v-for="(_key, asset) in pairedAssets"
        :key="asset"
        class="my-2 mx-4 cursor-pointer hover:text-gray-600"
        @click="setAsset2(asset)"
      >
        {{ assets.nameAndDecimalsByAsset[asset].name }}
      </div>
    </label>
  </label>
</template>

<style scoped></style>
