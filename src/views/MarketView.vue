<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { event } from "vue-gtag";
import { useAaInfoStore } from "@/stores/aaInfo";
import {
  getAssetInfoFromMeta,
  getAssetsFromMeta,
  getAssetsOnlyWithSymbolsAndDecimals,
  getPairedAssetsByAsset,
} from "@/utils/assetsUtils";
import { useAddressStore } from "@/stores/addressStore";
import { useUserBalance } from "@/composables/useUserBalance";
import { generateLink } from "@/utils/generateLink";
import { getExchangeResultByState } from "@/utils/getExchangeResultByState";
import NumberInput from "@/components/inputs/NumberInput.vue";
import Loading from "@/components/icons/LoadingIcon.vue";
import TextInput from "@/components/inputs/TextInput.vue";
import {
  getPriceByAssets,
  getPriceByData,
  getReservePrice,
  getTargetPriceByPresaleAsset,
} from "@/services/PerpAPI";
import FeeViewComponent from "@/components/FeeViewComponent.vue";
import LineChartComponent from "@/components/LineChartComponent.vue";
import { adjustPrices } from "@/utils/adjustPrices";
import { getOracleData } from "@/services/DAGApi";
import { cloneProxyToRaw } from "@/utils/cloneProxyToRaw";
import { statsUrl } from "@/config";

const store = useAaInfoStore();
const { aas, meta, status } = storeToRefs(store);
const addressStore = useAddressStore();
const { address } = storeToRefs(addressStore);

const { balance, balanceIsLoaded } = useUserBalance(address);

const line = ref([]);

const assets = ref({
  assetList: [],
  assetsByAA: {},
  nameAndDecimalsByAsset: {},
});
const pairedAssets = ref([]);
const asset1 = ref("");
const asset1Amount = ref("1");
const asset2 = ref("");
const asset2Amount = ref("");
const metaByActiveAA = ref();
const modalForAsset1 = ref();
const modalForAsset2 = ref();
const searchAsset1 = ref("");

const balanceByAsset = computed(() => {
  if (!asset1.value) return 0;

  return balance.value[asset1.value]?.total || 0;
});

const formattedBalanceByAsset = computed(() => {
  if (!asset1.value) return 0;

  const amount = balance.value[asset1.value]?.total || 0;
  const decimals = assets.value.nameAndDecimalsByAsset[asset1.value].decimals;
  return amount / 10 ** decimals;
});

const link = ref("");
const feeInPercent = ref(0);
const newPrice = ref(0);
const targetPrice = ref(0);
const targetAsset = ref("");
const targetAssetName = ref("");
const diff = ref("");
const nameAssetForPrice = ref("");
const assetForPriceRef = ref("");
const chartPeriod = ref("1W");

const resultError = ref("");

async function initSelectedAA() {
  if (status.value !== "initialized") return;
  const a = getAssetsFromMeta(meta.value, true);
  assets.value = await getAssetsOnlyWithSymbolsAndDecimals(a, meta.value);
  await setHighestPair();
}

async function setHighestPair() {
  let largestReserveAsset = "";
  let largestPairedAsset = "";

  const aas = Object.keys(assets.value.assetsByAA);

  let highestVolume = 0;
  aas.map((aa) => {
    assets.value.assetsByAA[aa].volumes.map((pairVolume) => {
      if (highestVolume < pairVolume.volume) {
        highestVolume = pairVolume.volume;
        largestReserveAsset = assets.value.assetsByAA[aa].reserve;
        largestPairedAsset = pairVolume.asset;
      }
    });
  });

  setAsset1(largestReserveAsset);

  await nextTick();

  setAsset2(largestPairedAsset);
}

function asset1Handler() {
  pairedAssets.value = getPairedAssetsByAsset(
    asset1.value,
    assets.value.assetsByAA
  );
}

function asset2Handler() {
  metaByActiveAA.value = meta.value[pairedAssets.value[asset2.value]];
}

function setAmount1ByBalance() {
  if (!address.value) return;

  if (!balanceByAsset.value) {
    asset1Amount.value = "1";
    return;
  }

  let amount = getDecimalsAmountByAsset(balanceByAsset.value, asset1.value);
  if (amount >= 1) {
    amount = 1;
  }

  asset1Amount.value = String(amount);
}

function setAsset1(asset) {
  asset1.value = asset;
  asset2.value = "";
  asset1Amount.value = "1";
  asset2Amount.value = "";
  modalForAsset1.value.checked = false;
  setAmount1ByBalance();
}

function setAsset2(asset) {
  asset2.value = asset;
  modalForAsset2.value.checked = false;
}

function getAmountByAsset(amount, asset) {
  const a =
    asset === "base"
      ? Number(amount) * 10 ** 9
      : Number(
          amount * 10 ** assets.value.nameAndDecimalsByAsset[asset].decimals
        );

  return Math.floor(a);
}

function getDecimalsAmountByAsset(amount, asset) {
  return asset === "base"
    ? Number(amount) / 10 ** 9
    : Number(
        amount / 10 ** assets.value.nameAndDecimalsByAsset[asset].decimals
      );
}

async function calcDataForBuy() {
  const { reserve_asset, state, asset0 } = metaByActiveAA.value;
  const aa = pairedAssets.value[asset2.value];
  const deltaReserve = getAmountByAsset(asset1Amount.value, asset1.value);
  const l = generateLink(
    deltaReserve,
    {
      asset: asset2.value,
    },
    null,
    aa,
    reserve_asset,
    true
  );

  const s = cloneProxyToRaw(state);
  const assetInfo =
    asset2.value === asset0
      ? null
      : cloneProxyToRaw(getAssetInfoFromMeta(asset2.value, aa, meta.value));

  if (asset2.value !== state.asset0) {
    await adjustPrices(
      asset2.value,
      assetInfo,
      s,
      cloneProxyToRaw(metaByActiveAA.value)
    );
  }

  const r = getExchangeResultByState(
    0,
    deltaReserve - (asset1.value === "base" ? 1000 : 0),
    asset2.value,
    assetInfo,
    s,
    cloneProxyToRaw(metaByActiveAA.value)
  );

  if (isNaN(r.delta_s)) {
    r.delta_s = "";
  }

  return {
    link: l,
    result: r,
  };
}

async function calcDataForSell() {
  const { state, asset0 } = metaByActiveAA.value;
  const aa = pairedAssets.value[asset2.value];

  const tokens = getAmountByAsset(asset1Amount.value, asset1.value);
  const l = generateLink(
    tokens,
    {
      asset: asset1.value,
    },
    null,
    aa,
    asset1.value,
    true
  );

  const assetInfo =
    asset1.value === asset0
      ? null
      : cloneProxyToRaw(getAssetInfoFromMeta(asset1.value, aa, meta.value));
  const s = cloneProxyToRaw(state);

  if (asset1.value !== state.asset0) {
    await adjustPrices(
      asset1.value,
      assetInfo,
      s,
      cloneProxyToRaw(metaByActiveAA.value)
    );
  }

  const r = getExchangeResultByState(
    tokens - (asset1.value === "base" ? 1000 : 0),
    0,
    asset1.value,
    assetInfo,
    s,
    cloneProxyToRaw(metaByActiveAA.value)
  );

  if (r.payout === undefined || isNaN(r.payout)) {
    r.payout = "";
  }

  return {
    link: l,
    result: r,
  };
}

const cacheForAssetName = {};

async function getAssetNameFromPriceAA(priceAA) {
  if (cacheForAssetName[priceAA]) {
    return cacheForAssetName[priceAA];
  }

  const { name } = await getOracleData(priceAA);
  cacheForAssetName[priceAA] = name;
  return name;
}
async function setTargetAsset() {
  let asset = "";

  const isAsset1Actual =
    asset1.value !== metaByActiveAA.value.reserve_asset &&
    asset1.value !== metaByActiveAA.value.state.asset0;

  if (isAsset1Actual) {
    asset = asset1.value;
  } else {
    const isAsset2Actual =
      asset2.value !== metaByActiveAA.value.reserve_asset &&
      asset2.value !== metaByActiveAA.value.state.asset0;

    if (isAsset2Actual) {
      asset = asset2.value;
    }
  }

  if (asset) {
    const priceAA = metaByActiveAA.value[`asset_${asset}`].price_aa;
    const name = await getAssetNameFromPriceAA(priceAA);
    targetAsset.value = asset;
    targetAssetName.value = name;
    return;
  }

  targetAsset.value = "";
  targetAssetName.value = "";
}

async function calcAndSetDataForMetaAndLink() {
  if (!asset1.value || !asset2.value || !balanceIsLoaded.value) return;
  const metaByActiveAAClone = cloneProxyToRaw(metaByActiveAA.value);
  resultError.value = "";

  if (
    address.value &&
    balanceByAsset.value < getAmountByAsset(asset1Amount.value, asset1.value)
  ) {
    const amount = getDecimalsAmountByAsset(balanceByAsset.value, asset1.value);
    const symbol = assets.value.nameAndDecimalsByAsset[asset1.value].name;
    resultError.value = `You don't have enough funds. Your balance: ${amount} ${symbol}`;
  }

  let data;
  let assetForPrice = "";
  let assetAmount = 0;
  if (metaByActiveAAClone.reserve_asset === asset1.value) {
    assetForPrice = asset2.value;
    data = await calcDataForBuy();
    assetAmount =
      Number(data.result.delta_s) /
      10 ** assets.value.nameAndDecimalsByAsset[asset2.value].decimals;
  } else {
    assetForPrice = asset1.value;
    data = await calcDataForSell();
    assetAmount =
      Number(data.result.payout) /
      10 ** assets.value.nameAndDecimalsByAsset[asset2.value].decimals;
  }

  assetForPriceRef.value = assetForPrice;

  if (data.result.error) {
    resultError.value = data.result.error;
    return;
  }

  const reservePriceAa = metaByActiveAAClone.reserve_price_aa;
  const reservePrice = await getReservePrice(reservePriceAa);
  const r = await getPriceByAssets(
    metaByActiveAAClone.aa,
    [assetForPrice],
    metaByActiveAAClone
  );
  const oldPrice = r[assetForPrice];
  const price = await getPriceByData(
    metaByActiveAAClone.aa,
    assetForPrice,
    data.result.state,
    cloneProxyToRaw(data.result.asset_info),
    metaByActiveAAClone
  );

  const d = ((price - oldPrice) / oldPrice) * 100;

  const amount =
    10 ** assets.value.nameAndDecimalsByAsset[assetForPrice].decimals;
  nameAssetForPrice.value =
    assets.value.nameAndDecimalsByAsset[assetForPrice].name;
  newPrice.value = amount * price * reservePrice;
  diff.value = d.toFixed(3);
  link.value = data.link;
  feeInPercent.value = data.result.fee_percent;
  asset2Amount.value = assetAmount.toString();

  targetPrice.value = 0;

  const rawTargetPrice = targetAsset.value
    ? await getTargetPriceByPresaleAsset(
        metaByActiveAAClone.aa,
        targetAsset.value,
        true
      )
    : 0;

  if (rawTargetPrice) {
    targetPrice.value = +(
      rawTargetPrice *
      reservePrice *
      10 ** assets.value.nameAndDecimalsByAsset[targetAsset.value].decimals
    ).toPrecision(6);
  }
}

async function swapPair() {
  const asset2Value = asset2Amount.value.toString();
  const currentAsset1 = asset1.value;
  const currentAsset2 = asset2.value;

  setAsset1(currentAsset2);
  await nextTick();
  setAsset2(currentAsset1);
  await nextTick();
  asset1Amount.value = asset2Value;
}

function keyDownHandler(e) {
  if (e.key === "Escape") {
    modalForAsset1.value.checked = false;
    modalForAsset2.value.checked = false;
  }
}

function setMyBalance() {
  asset1Amount.value = String(formattedBalanceByAsset.value);
}

function buyEvent() {
  event("buy", {
    event_label: `${asset1.value} - ${asset2.value}`,
    value: +asset1Amount.value,
  });
}

function setPeriod(period) {
  chartPeriod.value = period;
}

onMounted(() => {
  initSelectedAA();
  window.addEventListener("keydown", keyDownHandler);
});

onUnmounted(() => {
  window.removeEventListener("keydown", keyDownHandler);
});
watch(aas, initSelectedAA);
watch(status, initSelectedAA);

watch(asset1, asset1Handler);
watch(asset2, asset2Handler);
watch([asset1, asset2], async () => {
  if (!asset1.value || !asset2.value) return;
  await setTargetAsset();
  calcAndSetDataForMetaAndLink();
});
watch(
  [asset1Amount, asset2Amount, balanceByAsset],
  calcAndSetDataForMetaAndLink
);
watch(meta, asset2Handler, { deep: true });

watch([assetForPriceRef, chartPeriod], async () => {
  line.value = [];
  const period = chartPeriod.value === "1W" ? "lastWeek" : "lastMonth";
  const res = await fetch(
    `https://${statsUrl}/${period}?asset=` + assetForPriceRef.value
  );

  try {
    line.value = await res.json();
  } catch (e) {
    line.value = [];
  }
});
</script>
<style>
.disabled-card-input {
  background-color: #1e2228 !important;
}
</style>
<template>
  <div class="container w-full sm:w-[1000px] m-auto mt-2 p-6 sm:p-8">
    <div class="p-2 mb-6">
      <h1 class="text-2xl font-bold leading-8">Trade Decentralized Futures</h1>
      <div class="mt-2 leading-6">
        Buy or sell futures powered by
        <RouterLink class="link text-sky-500 link-hover font-light" :to="`/faq`"
          >Pythagorean bonding curves</RouterLink
        >.
      </div>
    </div>

    <div class="card bg-base-200 shadow-xl">
      <div class="card-body p-6 sm:p-8">
        <div v-if="!assets.assetList.length" class="text-center">
          <Loading />
        </div>
        <div
          v-if="assets.assetList.length"
          class="flex flex-col items-center lg:items-start lg:flex-row"
        >
          <div class="block w-full lg:w-1 lg:flex-auto">
            <div class="mb-4 flex justify-between">
              <div>
                <div class="text-2xl">
                  {{
                    assetForPriceRef
                      ? assets.nameAndDecimalsByAsset[assetForPriceRef].name
                      : "-"
                  }}
                </div>
                <div class="mt-2.5">
                  <span v-if="line.length"
                    >${{ line[line.length - 1].price.toPrecision(6) }}</span
                  >
                  <span v-else>&nbsp;</span>
                </div>
              </div>
              <div class="pt-1.5">
                <a
                  class="btn btn-xs"
                  :class="chartPeriod === '1W' ? 'btn-primary' : ''"
                  @click="setPeriod('1W')"
                  >1W</a
                >&nbsp;
                <a
                  class="btn btn-xs"
                  :class="chartPeriod === '1M' ? 'btn-primary' : ''"
                  @click="setPeriod('1M')"
                  >1M</a
                >
              </div>
            </div>
            <LineChartComponent
              :period="chartPeriod"
              :name="assets.nameAndDecimalsByAsset[assetForPriceRef]?.name"
              :data="line"
              class="!h-[18rem]"
            />
          </div>
          <div class="form-control ml-6 w-full lg:w-[336px]">
            <label class="label">
              <span class="label-text"
                >You pay
                <template v-if="balanceByAsset > 0">
                  <a class="link link-hover text-sky-500" @click="setMyBalance"
                    >(Balance: {{ formattedBalanceByAsset }})</a
                  ></template
                ></span
              >
            </label>
            <div class="join">
              <NumberInput
                class="join-item sh-disabled"
                v-model="asset1Amount"
                :decimals="assets.nameAndDecimalsByAsset[asset1]?.decimals"
                :disabled="!asset1"
              />
              <label for="asset1Modal" class="btn btn-primary join-item"
                >{{
                  asset1
                    ? assets.nameAndDecimalsByAsset[asset1].name
                    : "Select asset"
                }}
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
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </label>
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
            <label class="label">
              <span class="label-text">You receive</span>
            </label>
            <div class="join !border-gray-600">
              <TextInput
                class="join-item sh-disabled"
                placeholder="0"
                :disabled="!asset2"
                v-model.number="asset2Amount"
                readonly
              />
              <label
                for="asset2Modal"
                class="btn btn-primary border-gray-600 join-item"
                :class="{ '!btn-disabled': !asset1 }"
                >{{
                  asset2
                    ? assets.nameAndDecimalsByAsset[asset2].name
                    : "Select asset"
                }}
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
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </label>
            </div>
            <span
              v-if="resultError"
              class="flex tracking-wide text-red-500 text-sm mt-2 ml-2"
            >
              {{ resultError }}
            </span>
            <div v-if="asset2Amount > 0" class="mt-4">
              <div>Fee: <FeeViewComponent :fee="Number(feeInPercent)" /></div>
              <div>
                New price of
                {{ nameAssetForPrice }}: ${{ newPrice.toPrecision(6) }}
                <template v-if="isFinite(diff)"
                  >(<FeeViewComponent
                    :fee="Number(diff)"
                    :with-diff="true"
                  />)</template
                >
              </div>
              <div v-if="targetPrice">Target price: ${{ targetPrice }}</div>
              <div v-if="targetPrice">
                Target asset:
                {{ targetAssetName }}
              </div>
              <div></div>
            </div>
            <div class="form-control mt-8 text-center">
              <a
                class="btn btn-primary"
                :href="link"
                @click="buyEvent"
                :class="{
                  '!btn-disabled':
                    resultError || !link || !(Number(asset2Amount) > 0),
                }"
                >Exchange</a
              >
            </div>
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
    <label class="modal-box relative overflow-hidden" for="">
      <div>
        <input
          type="text"
          v-model="searchAsset1"
          placeholder="Search asset"
          class="input input-bordered w-full mb-2"
        />
      </div>
      <div style="max-height: calc(100vh - 11.5rem); overflow: auto">
        <div
          v-for="asset in assets.assetList.filter((v) => {
            if (!searchAsset1) return true;
            const name = assets.nameAndDecimalsByAsset[v].name;
            return name.toLowerCase().includes(searchAsset1.toLowerCase());
          })"
          :key="asset"
          class="my-2 mx-4 cursor-pointer hover:text-gray-600"
          :class="{ 'text-sky-500': asset1 === asset }"
          @click="setAsset1(asset)"
        >
          {{ assets.nameAndDecimalsByAsset[asset].name }}
        </div>
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
        :class="{ 'text-sky-500': asset2 === asset }"
        @click="setAsset2(asset)"
      >
        {{ assets.nameAndDecimalsByAsset[asset].name }}
      </div>
    </label>
  </label>
</template>

<style scoped></style>
