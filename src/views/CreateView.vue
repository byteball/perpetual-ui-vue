<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import debounce from "lodash.debounce";
import { getOswapPoolsWithSymbols } from "@/services/OswapApi";
import { isValidUnit } from "@/utils/validates";
import { getAssetBySymbol } from "@/services/DAGApi";
import LoadingIcon from "@/components/icons/LoadingIcon.vue";
import Form1ForOswapComponent from "@/components/create/Form1ForOswapComponent.vue";
import Form1ForBasicAsset from "@/components/create/Form1ForBasicAsset.vue";
import AutocompleteComponent from "@/components/AutocompleteComponent.vue";
import RegFormComponent from "@/components/create/RegFormComponent.vue";

const dataLoaded = ref(false);
const reserveAssetInput = ref("");
const assetsWithSymbols = reactive({ oswapAssets: {}, otherAssets: {} });
const oswapMetadataByAsset = ref({});

const step = ref(0);
const reserveAsset = ref("");
const isOSWAPAsset = ref(false);
const reservePriceAA = ref("");

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

function goToStep1() {
  if (!reserveAsset.value) return;
  step.value = 1;
}

function setReservePriceAA(aa) {
  reservePriceAA.value = aa;
  step.value = 2;
}

function goBack() {
  step.value = 0;
}

onMounted(async () => {
  const r = await getOswapPoolsWithSymbols();
  assetsWithSymbols.oswapAssets = r.assetsBySymbol;
  oswapMetadataByAsset.value = r.metaByAsset;
  dataLoaded.value = true;
});
</script>

<template>
  <div class="container w-full sm:w-[512px] m-auto mt-2 mb-36 p-6 sm:p-8">
    <div class="p-2 mb-6">
      <h1 class="text-lg font-bold leading-7">Create</h1>
      <h2 class="mt-2 leading-6">
        Create a new futures set. The set can host arbitrary number of futures tracking various currencies, stocks, commodities, etc.
      </h2>
    </div>
    <div id="back_button"></div>
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
        Loading... <LoadingIcon />
      </div>
    </div>
  </div>
</template>
