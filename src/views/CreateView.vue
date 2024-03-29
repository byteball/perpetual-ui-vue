<script setup>
import { nextTick, onMounted, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import debounce from "lodash.debounce";
import { useCreatePerpStore } from "@/stores/createPerpStore";
import { getOswapPoolsWithSymbols } from "@/services/OswapApi";
import { isValidUnit } from "@/utils/validates";
import { getAssetBySymbol } from "@/services/DAGApi";
import LoadingIcon from "@/components/icons/LoadingIcon.vue";
import Form1ForOswapComponent from "@/components/create/Form1ForOswapComponent.vue";
import Form1ForBasicAsset from "@/components/create/Form1ForBasicAsset.vue";
import AutocompleteComponent from "@/components/AutocompleteComponent.vue";
import RegFormComponent from "@/components/create/RegFormComponent.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const createStore = useCreatePerpStore();
const { assetsState } = storeToRefs(createStore);

const dataLoaded = ref(false);
const reserveAssetInput = ref("");
const assetsWithSymbols = reactive({ oswapAssets: {}, otherAssets: {} });
const oswapMetadataByAsset = ref({});

const step = ref(0);
const reserveAsset = ref("");
const isOSWAPAsset = ref(false);
const reservePriceAA = ref("");
const continueData = ref({});
const isContinue = ref(false);

async function getSrcForAutoComplete(query) {
  const assets = [...Object.keys(assetsWithSymbols.oswapAssets), "GBYTE"];
  const asset = await getAssetBySymbol(query);
  if (asset && asset !== "base") {
    assets.push(query);
    assetsWithSymbols.otherAssets[query] = asset;
  }

  return assets;
}

watch(
  reserveAssetInput,
  debounce(() => {
    if (isContinue.value) return;
    const asset = reserveAssetInput.value;

    if (assetsWithSymbols.oswapAssets[asset]) {
      reserveAsset.value = assetsWithSymbols.oswapAssets[asset];
      isOSWAPAsset.value = true;
      return;
    }
    isOSWAPAsset.value = false;

    if (assetsWithSymbols.otherAssets[asset]) {
      reserveAsset.value = assetsWithSymbols.otherAssets[asset];
      return;
    }

    if (["GBYTE", "BYTES"].includes(reserveAssetInput.value.toUpperCase())) {
      reserveAsset.value = "base";
      return;
    }

    if (isValidUnit(asset)) {
      reserveAsset.value = asset;
      return;
    }
    reserveAsset.value = "";
  }, 500)
);

function goToStep1(notDel) {
  if (!reserveAsset.value) return;
  step.value = 1;

  if (!notDel) {
    delContinueData();
    continueData.value = {};
  }
}

function setReservePriceAA(aa) {
  reservePriceAA.value = aa;
  step.value = 2;
}

function goBack() {
  step.value = 0;
}

function delContinueData(asset) {
  createStore.removeAssetState(asset);
}

function delAllContinueData() {
  createStore.clear();
  continueData.value = {};
}

async function continueCreate(asset) {
  const obj = createStore.getStateByAsset(asset);
  if (!obj) return;

  if (obj.step === 3) {
    await router.push(`/create/${obj.address}`);
    return;
  }
  isContinue.value = true;
  reserveAssetInput.value = obj.reserveAssetInput;
  isOSWAPAsset.value = obj.isOSWAPAsset;
  nextTick(() => {
    reserveAsset.value = obj.reserveAsset;
    reservePriceAA.value = obj.reservePriceAA;
    step.value = obj.step;
    continueData.value = {};
  });
}

watch([step, isOSWAPAsset, reservePriceAA], () => {
  if (step.value === 0) return;
  const obj = {
    step: step.value,
    reserveAsset: reserveAsset.value,
    isOSWAPAsset: isOSWAPAsset.value,
    reservePriceAA: reservePriceAA.value,
    reserveAssetInput: reserveAssetInput.value,
  };

  createStore.setAssetState(obj.reserveAsset, obj);
});

onMounted(async () => {
  const r = await getOswapPoolsWithSymbols();
  assetsWithSymbols.oswapAssets = r.assetsBySymbol;
  oswapMetadataByAsset.value = r.metaByAsset;
  dataLoaded.value = true;

  if (Object.keys(assetsState.value).length) {
    continueData.value = assetsState.value;
  }
});
</script>

<template>
  <div class="container w-full sm:w-[568px] m-auto mt-2 p-6 sm:p-8">
    <div class="p-2 mb-6">
      <h1 class="text-2xl font-bold leading-8">Create</h1>
      <div class="mt-2 leading-6">
        Create a new futures set. The set can host arbitrary number of futures
        tracking various currencies, stocks, commodities, etc.
      </div>
    </div>
    <div id="back_button"></div>

    <div
      v-if="Object.keys(continueData).length"
      class="card bg-base-200 shadow-xl mb-4"
    >
      <div class="card-body p-4 sm:p-8">
        <div class="text-center">
          <div
            class="font-bold text-center sm:text-left flex items-center mb-2"
          >
            Creation not completed
          </div>
          <div class="mt-6">
            <button
              v-for="asset in Object.keys(continueData)"
              :key="asset"
              class="btn btn-primary mt-4"
              @click="continueCreate(asset)"
            >
              Continue creating a set baseed on
              {{ continueData[asset].reserveAssetInput }}
            </button>
          </div>
          <div class="text-center mt-6">
            <a
              @click="delAllContinueData"
              class="link link-hover text-sky-500 font-normal"
              >Delete all</a
            >
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-200 shadow-xl">
      <div class="card-body p-6 sm:p-8" v-show="dataLoaded">
        <div v-show="step === 0">
          <div class="!form-control">
            <label class="label">
              <span class="label-text">Reserve asset</span>
            </label>
            <AutocompleteComponent
              :get-src-for-auto-complete="getSrcForAutoComplete"
              v-model="reserveAssetInput"
              placeholder="For example: IUSD"
            />
          </div>
          <div class="text-center mt-4">
            <button
              v-if="reserveAsset"
              class="btn btn-primary"
              @click="goToStep1()"
            >
              Continue
            </button>
            <span v-else class="text-gray-300"
              >To continue, please specify the reserve asset</span
            >
          </div>
        </div>

        <div v-if="step === 1">
          <Form1ForOswapComponent
            v-if="isOSWAPAsset"
            :reserve-asset="reserveAsset"
            :reserve-asset-symbol="reserveAssetInput"
            :metadata="oswapMetadataByAsset[reserveAsset]"
            @set-reserve-price-aa="setReservePriceAA"
            @go-back="goBack"
          />
          <Form1ForBasicAsset
            v-else
            :reserve-asset-symbol="reserveAssetInput"
            @set-reserve-price-aa="setReservePriceAA"
            @go-back="goBack"
          />
        </div>

        <div v-if="step === 2">
          <RegFormComponent
            :reserve-asset="reserveAsset"
            :reserve-asset-symbol="reserveAssetInput"
            :reserve-price-a-a="reservePriceAA"
            @go-back="goBack"
          />
        </div>
      </div>
      <div
        class="card-body p-6 sm:p-8 flex items-center flex-row justify-center"
        v-show="!dataLoaded"
      >
        Loading...
        <LoadingIcon />
      </div>
    </div>
  </div>
</template>
