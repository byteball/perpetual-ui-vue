<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import {
  getAssetsFromMeta,
  getPairedAssetsByAsset,
  getAssetInfoFromMeta,
  getAssetsOnlyWithSymbolsAndDecimals,
} from "@/utils/assetsUtils";
import { useAddressStore } from "@/stores/addressStore";
import { useUserBalance } from "@/composables/useUserBalance";
import { generateLink } from "@/utils/generateLink";
import { getExchangeResultByState } from "@/utils/getExchangeResultByState";
import NumberInput from "@/components/inputs/NumberInput.vue";
import AddressController from "@/components/AddressController.vue";
import Loading from "@/components/icons/LoadingIcon.vue";

const store = useAaInfoStore();
const { aas, meta, status } = storeToRefs(store);
const addressStore = useAddressStore();
const { address } = storeToRefs(addressStore);

const { balance } = useUserBalance(address);

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

const balanceByAsset = computed(() => {
  if (!asset1.value) return 0;

  return balance.value[asset1.value]?.stable || 0;
});

const link = ref("");
const percent = ref(0);
const newPrice = ref(0);

const resultError = ref("");

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

function setAmount1ByBalance() {
  if (!address.value) return;

  if (!balanceByAsset.value) {
    asset1Amount.value = "";
    return;
  }

  asset1Amount.value = String(
    getDecimalsAmountByAsset(balanceByAsset.value, asset1.value)
  );
}

function setAsset1(asset) {
  asset1.value = asset;
  asset2.value = "";
  asset1Amount.value = "";
  asset2Amount.value = "";
  modalForAsset1.value.checked = false;
  setAmount1ByBalance();
}

function setAsset2(asset) {
  asset2.value = asset;
  modalForAsset2.value.checked = false;
}

function getAmountByAsset(amount, asset) {
  return asset === "base"
    ? Number(amount) * 10 ** 9 + 1000
    : Number(
        amount * 10 ** assets.value.nameAndDecimalsByAsset[asset].decimals
      );
}

function getDecimalsAmountByAsset(amount, asset) {
  return asset === "base"
    ? (Number(amount) - 1000) / 10 ** 9
    : Number(
        amount / 10 ** assets.value.nameAndDecimalsByAsset[asset].decimals
      );
}

function calcDataForBuy() {
  const { reserve_asset, state, asset0 } = metaByActiveAA.value;
  const aa = pairedAssets.value[asset2.value];

  const l = generateLink(
    getAmountByAsset(asset1Amount.value, asset1.value),
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
    getAmountByAsset(asset1Amount.value, asset1.value),
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

  resultError.value = "";

  if (
    address.value &&
    balanceByAsset.value < getAmountByAsset(asset1Amount.value, asset1.value)
  ) {
    const amount = getDecimalsAmountByAsset(balanceByAsset.value, asset1.value);
    const symbol = assets.value.nameAndDecimalsByAsset[asset1.value].name;
    resultError.value = `You don't have enough funds. Your balance: ${amount} ${symbol}`;
    asset2Amount.value = 0;
    link.value = "";
    return;
  }

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

  if (data?.result?.error) {
    resultError.value = data.result.error;
  }

  console.log("result", data.result);
}

function swapPair() {
  const currentAsset1 = asset1.value;
  const currentAsset2 = asset2.value;

  setAsset1(currentAsset2);
  setAsset2(currentAsset1);
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
<style>
.disabled-card-input {
  background-color: #1e2228 !important;
}
</style>
<template>
  <div class="container w-full sm:w-[512px] m-auto mt-8 mb-36 p-6 sm:p-8">
    <AddressController />
    <div class="p-2 mb-6">
      <div class="text-lg font-semibold leading-7">Market</div>
      <p class="mt-2 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>

    <div class="card bg-base-200 shadow-xl">
      <div class="card-body p-6 sm:p-8">
        <div v-if="!assets.assetList.length" class="text-center">
          <Loading />
        </div>
        <div class="form-control" v-if="assets.assetList.length">
          <div class="input-group">
            <NumberInput
              v-model="asset1Amount"
              class="input input-bordered w-full disabled-card-input"
              :decimals="assets.nameAndDecimalsByAsset[asset1]?.decimals"
              :disabled="!asset1"
            />
            <label for="asset1Modal" class="btn btn-primary">{{
              asset1
                ? assets.nameAndDecimalsByAsset[asset1].name
                : "Select asset"
            }}</label>
          </div>
          <div class="mt-4 flex justify-center">
            <button @click="swapPair()" class="btn btn-circle swap-btn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                />
              </svg>
            </button>
          </div>
          <div class="input-group mt-4">
            <input
              type="text"
              placeholder="0"
              class="input input-bordered w-full disabled-card-input"
              :disabled="!asset2"
              v-model.number="asset2Amount"
              readonly
            />
            <label
              for="asset2Modal"
              class="btn btn-primary"
              :class="{ '!btn-disabled': !asset1 }"
              >{{
                asset2
                  ? assets.nameAndDecimalsByAsset[asset2].name
                  : "Select asset"
              }}</label
            >
          </div>
          <span
            v-if="resultError"
            class="flex tracking-wide text-red-500 text-sm mt-2 ml-2"
          >
            {{ resultError }}
          </span>
          <div v-if="asset2Amount" class="mt-4">
            <div>Fee: {{ Number(percent.toFixed(4)) }}%</div>
            <div>New price: {{ newPrice }}</div>
            <div></div>
          </div>
          <div class="form-control mt-8 text-center">
            <a
              class="btn btn-primary"
              :href="link"
              :class="{ '!btn-disabled': !link || !(Number(asset2Amount) > 0) }"
              >Exchange</a
            >
          </div>
        </div>
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
