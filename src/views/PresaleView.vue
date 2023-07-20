<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getPresaleAssetsFromMeta } from "@/utils/getAssetsFromMeta";
import { executeAAGetter, getAssetMetadata } from "@/services/DAGApi";
import NumberInput from "@/components/inputs/NumberInput.vue";
import { getParam } from "@/utils/governanceUtils";
import AddressController from "@/components/AddressController.vue";
import { useAddressStore } from "@/stores/addressStore";
import ClaimCard from "@/components/presale/ClaimCard.vue";

dayjs.extend(duration);

const route = useRoute();
const router = useRouter();

const store = useAaInfoStore();
const addressStore = useAddressStore();
const { aas, meta } = storeToRefs(store);
const { address } = storeToRefs(addressStore);

const selectedReserveAsset = ref("");
const selectedPresaleAsset = ref("");
const selectedAA = ref("");
const selectedAsset0 = ref("");
const selectedPresaleIsFinished = ref("");
const selectedPresaleFinishDate = ref("");
const selectedPresaleTargetAmount = ref("");
const selectedPresaleCurrentAmount = ref("");
const selectedPresaleAddressAmount = ref(0);

const targetPrice = ref("");
const receiveAmount = ref("");

const amount = ref("");
const link = ref("");
const activeTab = ref("buy");
const assetsMetadata = ref({});
const reserveAssets = ref({});
const aAsPairs = ref({});
const isLoaded = ref(false);
const modalForPresale = ref();
const toastMessage = ref("");

const presaleList = ref([]);

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

const preparePresaleList = async () => {
  presaleList.value = [];

  if (!Object.keys(meta.value).length) {
    return;
  }

  for (const aa of aas.value) {
    const asset0 = meta.value[aa]?.state?.asset0;
    const presalePeriod = getParam("presale_period", meta.value[aa]);
    const tokenShareThreshold = getParam(
      "token_share_threshold",
      meta.value[aa]
    );
    const reserve = meta.value[aa].state.reserve;

    const asset0Data = await getAssetMetadata(asset0);

    if (!assetsMetadata.value[asset0]) {
      assetsMetadata.value[asset0] = asset0Data;
    }

    const reserveAsset = meta.value[aa].reserve_asset;
    const reserveAssetData = await getAssetMetadata(reserveAsset);

    if (!reserveAssetData) continue;

    if (!assetsMetadata.value[reserveAsset]) {
      assetsMetadata.value[reserveAsset] = reserveAssetData;
    }

    const presaleAssets = getPresaleAssetsFromMeta(meta.value[aa]);

    const presaleAssetsWithMetadata = [];
    for (const presaleAsset of presaleAssets) {
      const presaleAssetData = await getAssetMetadata(presaleAsset);

      if (!presaleAssetData) continue;

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
        targetPresaleAmount <= currentPresaleAmount ||
        finishDate.diff(dayjs()) < 0;

      if (isPresaleFinished) continue;

      const priceAA = meta.value[aa][`asset_${presaleAsset}`].price_aa;
      const targetPrice = await executeAAGetter(priceAA, "get_target_price");

      presaleList.value.push({
        aa,
        asset0,
        reserveAsset,
        presaleAsset,
        isPresaleFinished,
        targetPresaleAmount,
        currentPresaleAmount,
        targetPrice,
        finishDate: finishDate.format("MMMM D, YYYY HH:mm"),
      });

      aAsPairs.value[`${reserveAsset}_${presaleAsset}`] = aa;
    }
  }

  if (Object.keys(reserveAssets.value).length) {
    filterReserveAssetsWithoutPresale();
  }

  isLoaded.value = true;

  if (route.params.presale) {
    if (!presaleList.value.length) {
      return;
    }

    const routePresale = presaleList.value.find(
      (presale) => presale.presaleAsset === route.params.presale
    );

    if (!routePresale) {
      showToastMessage("Presale not found, please choose an existing one");
      return;
    }

    fillPresaleData(routePresale);
  }
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

const fillPresaleData = (presale) => {
  selectedPresaleAsset.value = presale.presaleAsset;
  selectedReserveAsset.value = presale.reserveAsset;
  selectedAA.value = presale.aa;
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
  targetPrice.value = presale.targetPrice;

  if (selectedPresaleIsFinished.value) {
    activeTab.value = "claim";
  }

  if (address.value && selectedAA.value) {
    updateAddressPresaleAmount();
  }
};

const choosePresale = (presale) => {
  fillPresaleData(presale);

  modalForPresale.value.checked = false;
};

onMounted(async () => {
  await preparePresaleList();
});

watch(meta, preparePresaleList);

const calculateReceiveAmount = () => {
  const reserveDecimals =
    10 ** assetsMetadata.value[selectedReserveAsset.value].decimals;

  receiveAmount.value =
    (Number(amount.value) * reserveDecimals) /
    targetPrice.value /
    10 ** assetsMetadata.value[selectedPresaleAsset.value].decimals;
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
  <div
    v-if="!address"
    class="container w-[320px] sm:w-[512px] m-auto mt-8 mb-36 p-8"
  >
    <AddressController />
  </div>
  <div v-else class="container w-[320px] sm:w-[512px] m-auto mt-8 mb-36 p-8">
    <div v-if="toastMessage" class="toast toast-top toast-end">
      <div class="alert alert-error">
        <span>{{ toastMessage }}</span>
      </div>
    </div>

    <AddressController />

    <ClaimCard />

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
          <div v-else>
            <p class="mt-2 leading-6">There is no presale in progress now</p>
          </div>
          <div v-if="selectedAA">
            <div>
              <div class="mt-4">
                <div>Finish date: {{ selectedPresaleFinishDate }}</div>
                <div class="mt-2">
                  Sold:
                  {{
                    `${selectedPresaleCurrentAmount} / ${selectedPresaleTargetAmount}`
                  }}
                </div>
              </div>
              <div class="tabs tabs-boxed mt-8">
                <a
                  class="tab tab-lifted"
                  :class="{ 'tab-active': activeTab === 'buy' }"
                  @click="setTab('buy')"
                >
                  Buy
                </a>
                <!--                <a-->
                <!--                  class="tab tab-lifted"-->
                <!--                  :class="{ 'tab-active': activeTab === 'withdraw' }"-->
                <!--                  @click="setTab('withdraw')"-->
                <!--                >-->
                <!--                  Withdraw-->
                <!--                </a>-->
              </div>
              <div class="mt-4">
                <label class="label">
                  <span class="label-text">Amount</span>
                </label>
                <div class="input-group">
                  <NumberInput
                    v-model="amount"
                    :decimals="assetsMetadata[selectedReserveAsset].decimals"
                    class="input input-bordered w-full"
                  />
                  <span>{{ assetsMetadata[selectedReserveAsset].name }}</span>
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
