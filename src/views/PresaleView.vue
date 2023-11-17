<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getPresaleAssetsFromMeta } from "@/utils/getAssetsFromMeta";
import {
  getAssetMetadata,
  getAssetMetadataByArray,
  getOracleData,
} from "@/services/DAGApi";
import NumberInput from "@/components/inputs/NumberInput.vue";
import { getParam, getPreparedMeta } from "@/utils/governanceUtils";
import { useAddressStore } from "@/stores/addressStore";
import ClaimCard from "@/components/presale/ClaimCard.vue";
import Loading from "@/components/icons/LoadingIcon.vue";
import { getTargetPriceByPresaleAsset } from "@/services/PerpAPI";
import SpoilerWithPerpMetaComponent from "@/components/SpoilerWithPerpMetaComponent.vue";
import PresaleSelectComponent from "@/components/presale/PresaleSelectComponent.vue";

dayjs.extend(duration);

const route = useRoute();
const router = useRouter();

const store = useAaInfoStore();
const addressStore = useAddressStore();
const { aas, meta } = storeToRefs(store);
const { address } = storeToRefs(addressStore);

const presaleList = ref([]);
const preparedDataByAA = ref({});
const currentPresaleIndex = ref(-1);
const currentPresaleData = computed(() => {
  const i = currentPresaleIndex.value;
  return presaleList.value[i] || {};
});
const selectedReserveAsset = ref("");
const selectedPresaleAsset = ref("");
const selectedAA = ref("");
const metaBySelectedAsset = ref({});
const selectedAsset0 = ref("");
const selectedPresaleIsFinished = ref("");
const selectedPresaleFinishDate = ref("");
const selectedPresaleTargetAmount = ref("");
const selectedPresaleCurrentAmount = ref("");
const selectedPresaleAddressAmount = ref(0);
const selectedOracleData = ref({});
const selectedTargetPrice = ref(0);

const receiveAmount = ref(0);

const amount = ref("");
const link = ref("");
const activeTab = ref("buy");
const assetsMetadata = ref({});
const reserveAssets = ref({});
const aAsPairs = ref({});
const isLoaded = ref(false);
const toastMessage = ref("");

const setTab = (tabName) => {
  activeTab.value = tabName;
};

const filterReserveAssetsWithoutPresale = () => {
  const reserveAssetsToFilter = [];
  for (let i = 0; i < Object.keys(reserveAssets.value).length; i++) {
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

const showToastMessage = (message) => {
  toastMessage.value = message;

  setTimeout(() => {
    toastMessage.value = "";
  }, 3000);
};

const sortPresaleList = () => {
  presaleList.value = presaleList.value.sort((a, b) => {
    const aPresaleAsset = assetsMetadata.value[a.presaleAsset].name;
    const bPresaleAsset = assetsMetadata.value[b.presaleAsset].name;

    if (aPresaleAsset > bPresaleAsset) {
      return 1;
    }

    if (aPresaleAsset < bPresaleAsset) {
      return -1;
    }

    return 0;
  });
};

const preparePresaleList = async () => {
  const promisesForPrepare = [];
  presaleList.value = [];

  if (!Object.keys(meta.value).length) {
    return;
  }

  async function prepare(aa) {
    const asset0 = meta.value[aa]?.state?.asset0;
    const presalePeriod = getParam("presale_period", meta.value[aa]);
    const tokenShareThreshold = getParam(
      "token_share_threshold",
      meta.value[aa]
    );
    const reserve = meta.value[aa].state.reserve;

    const reserveAsset = meta.value[aa].reserve_asset;
    const [asset0Data, reserveAssetData] = await Promise.all([
      getAssetMetadata(asset0),
      getAssetMetadata(reserveAsset),
    ]);

    if (!assetsMetadata.value[asset0]) {
      assetsMetadata.value[asset0] = asset0Data;
    }

    if (!reserveAssetData) return;

    if (!assetsMetadata.value[reserveAsset]) {
      assetsMetadata.value[reserveAsset] = reserveAssetData;
    }

    const presaleAssets = getPresaleAssetsFromMeta(meta.value[aa]);

    const presaleAssetsWithMetadata = [];
    const metadataByAsset = await getAssetMetadataByArray(presaleAssets);

    for (const presaleAsset in metadataByAsset) {
      const presaleAssetData = metadataByAsset[presaleAsset];

      if (!assetsMetadata.value[presaleAsset]) {
        assetsMetadata.value[presaleAsset] = presaleAssetData;
      }

      presaleAssetsWithMetadata.push(presaleAsset);

      const presaleAssetIssue =
        meta.value[aa][`asset_${presaleAsset}`].creation_ts;
      const currentPresaleAmount =
        meta.value[aa][`asset_${presaleAsset}`].presale_amount;

      const finishDate = dayjs((presaleAssetIssue + presalePeriod) * 1000);

      const targetPresaleAmount = tokenShareThreshold * reserve;

      const isPresaleFinished =
        currentPresaleAmount &&
        (targetPresaleAmount <= currentPresaleAmount ||
          finishDate.diff(dayjs()) < 0);

      if (isPresaleFinished) continue;

      presaleList.value.push({
        aa,
        asset0,
        reserveAsset,
        presaleAsset,
        isPresaleFinished,
        targetPresaleAmount,
        currentPresaleAmount,
        finishDate: finishDate.format("MMMM D, YYYY HH:mm"),
      });

      preparedDataByAA.value[aa] = await getPreparedMeta(
        meta.value[aa],
        address.value
      );
      aAsPairs.value[`${reserveAsset}_${presaleAsset}`] = aa;
    }

    await fillPresaleData();
  }

  for (const aa of aas.value) {
    promisesForPrepare.push(prepare(aa));
  }
  await Promise.all(promisesForPrepare);

  if (Object.keys(reserveAssets.value).length) {
    filterReserveAssetsWithoutPresale();
  }

  sortPresaleList();

  if (route.params.presale) {
    if (!presaleList.value.length) {
      return;
    }

    const routePresaleIndex = presaleList.value.findIndex(
      (presale) => presale.presaleAsset === route.params.presale
    );

    if (routePresaleIndex === -1) {
      showToastMessage("Presale not found, please choose an existing one");
      return;
    }

    currentPresaleIndex.value = routePresaleIndex;
  } else {
    currentPresaleIndex.value = 0;
  }

  isLoaded.value = true;
};

const updateAddressPresaleAmount = () => {
  selectedPresaleAddressAmount.value = 0;

  if (
    selectedAA.value &&
    meta.value[selectedAA.value][
      `contribution_${address.value}_${selectedPresaleAsset.value}`
    ]
  ) {
    selectedPresaleAddressAmount.value =
      meta.value[selectedAA.value][
        `contribution_${address.value}_${selectedPresaleAsset.value}`
      ] /
      10 ** assetsMetadata.value[selectedReserveAsset.value].decimals;
  }
};

const fillPresaleData = async () => {
  const presale = currentPresaleData.value;
  if (!Object.keys(presale).length) return;

  selectedPresaleAsset.value = presale.presaleAsset;
  selectedReserveAsset.value = presale.reserveAsset;
  selectedAA.value = presale.aa;
  metaBySelectedAsset.value =
    meta.value[presale.aa][`asset_${presale.presaleAsset}`];
  selectedAsset0.value = presale.asset0;
  selectedPresaleIsFinished.value = presale.isPresaleFinished;
  selectedPresaleFinishDate.value = presale.finishDate;
  selectedPresaleTargetAmount.value = presale.targetPresaleAmount
    ? presale.targetPresaleAmount /
      10 ** assetsMetadata.value[selectedReserveAsset.value].decimals
    : 0;
  selectedPresaleCurrentAmount.value = presale.currentPresaleAmount
    ? presale.currentPresaleAmount /
      10 ** assetsMetadata.value[selectedReserveAsset.value].decimals
    : 0;

  if (selectedPresaleIsFinished.value) {
    activeTab.value = "claim";
  }

  selectedOracleData.value = await getOracleData(
    meta.value[presale.aa][`asset_${presale.presaleAsset}`].price_aa
  );

  selectedTargetPrice.value = await getTargetPriceByPresaleAsset(
    presale.aa,
    presale.presaleAsset
  );

  if (address.value && selectedAA.value) {
    updateAddressPresaleAmount();
  }
};

onMounted(async () => {
  await preparePresaleList();
});

watch(meta, preparePresaleList);

watch(
  currentPresaleIndex,
  () => {
    fillPresaleData();
  },
  {
    immediate: true,
  }
);

const calculateReceiveAmount = () => {
  const reserveDecimals =
    10 ** assetsMetadata.value[selectedReserveAsset.value].decimals;
  const targetPrice = selectedTargetPrice.value;

  const rawAmount = (Number(amount.value) * reserveDecimals) / targetPrice;

  receiveAmount.value =
    rawAmount / 10 ** assetsMetadata.value[selectedPresaleAsset.value].decimals;
};

watch([amount, selectedPresaleAsset], calculateReceiveAmount);

watch(selectedPresaleAsset, () => {
  if (!selectedPresaleAsset.value) return;

  router.push(`/presale/${selectedPresaleAsset.value}`);
});

watch(() => address.value, updateAddressPresaleAmount);

watch([selectedPresaleAsset, amount, activeTab], () => {
  const assetAmount =
    selectedReserveAsset.value === "base"
      ? Number(amount.value) * 10 ** 9 + 1000
      : amount.value /
        10 ** assetsMetadata.value[selectedReserveAsset.value].decimals;

  const data = {
    asset: selectedPresaleAsset.value,
  };

  if (activeTab.value === "buy") {
    data.presale = 1;
  }

  const aa =
    aAsPairs.value[
      `${selectedReserveAsset.value}_${selectedPresaleAsset.value}`
    ];

  link.value = generateLink(
    assetAmount,
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
  <div class="container w-full sm:w-[640px] m-auto mt-2 mb-36 p-6 sm:p-8">
    <div v-if="toastMessage" class="toast toast-top toast-end">
      <div class="alert alert-error">
        <span>{{ toastMessage }}</span>
      </div>
    </div>

    <ClaimCard v-if="address" />

    <div class="p-2 mb-6">
      <h1 class="text-lg font-bold leading-7">Presale</h1>
      <h2 class="mt-2 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </h2>
    </div>

    <div class="card bg-base-200 shadow-xl">
      <div class="card-body p-6 sm:p-8">
        <div v-if="!isLoaded" class="text-center">
          <Loading />
        </div>
        <div v-else>
          <div v-if="presaleList.length">
            <div class="form-control">
              <PresaleSelectComponent
                v-model="currentPresaleIndex"
                :assets-metadata="assetsMetadata"
                :model-value="currentPresaleIndex"
                :presale-list="presaleList"
                :selected-aa="selectedAA"
                :selected-presale-asset="selectedPresaleAsset"
                :selected-asset0="selectedAsset0"
                :selected-reserve-asset="selectedReserveAsset"
              />
            </div>
          </div>
          <div v-else>
            <p class="mt-2 leading-6">There is no presale in progress now</p>
          </div>
          <div v-if="selectedAA">
            <div>
              <div class="mt-2">
                <SpoilerWithPerpMetaComponent
                  :prepared-meta="preparedDataByAA[selectedAA]"
                />
                <div class="mt-0.5">
                  Currency being tracked: {{ selectedOracleData.name }}
                </div>
                <div class="mt-0.5">
                  Target value: {{ selectedOracleData.value }}
                </div>
                <div class="mt-3">
                  Finish date: {{ selectedPresaleFinishDate }}
                </div>
                <div>
                  Sold:
                  {{
                    `${selectedPresaleCurrentAmount} / ${selectedPresaleTargetAmount}`
                  }}
                  {{ assetsMetadata[selectedReserveAsset].name }}
                </div>
              </div>
              <div class="tabs tabs-boxed mt-8 mb-1">
                <a
                  class="tab tab-lifted"
                  :class="{ 'tab-active': activeTab === 'buy' }"
                  @click="setTab('buy')"
                >
                  Buy
                </a>
                <a
                  class="tab tab-lifted tab-disabled"
                  :class="{ 'tab-active': activeTab === 'withdraw' }"
                >
                  Withdraw
                </a>
              </div>
              <div>
                <label class="label">
                  <span class="label-text">Amount</span>
                </label>
                <div class="input-group">
                  <NumberInput
                    v-model="amount"
                    :decimals="assetsMetadata[selectedReserveAsset].decimals"
                    :label="assetsMetadata[selectedReserveAsset].name"
                  />
                </div>
              </div>
              <div v-if="amount" class="mt-4">
                <div>
                  you will receive
                  {{
                    receiveAmount.toFixed(
                      assetsMetadata[selectedPresaleAsset].decimals
                    )
                  }}
                  {{ assetsMetadata[selectedPresaleAsset].name }}
                </div>
              </div>
              <div class="form-control mt-6">
                <a
                  class="btn btn-primary"
                  :class="{ '!btn-disabled': !amount }"
                  :href="link"
                  >{{ "buy" }}</a
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
