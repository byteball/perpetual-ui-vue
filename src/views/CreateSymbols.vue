<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import emitter from "@/services/emitter";

import Client from "@/services/Obyte";
import { getAssetMetadata, getMetaForPerpAAs } from "@/services/DAGApi";
import { generateLink } from "@/utils/generateLink";
import { parseDataFromRequest } from "@/utils/parseDataFromRequest";
import IntegerInput from "@/components/inputs/IntegerInput.vue";
import TextInput from "@/components/inputs/TextInput.vue";

const route = useRoute();
const router = useRouter();

const exists = ref(false);
const link = ref("");
const asset = ref("");
const symbol = ref("");
const isSymbolExists = ref(false);
const decimals = ref(0);
const description = ref("");
const buttonEnabled = ref(false);
const perpetualMeta = ref();

const currentAA = computed(() => route.params.aa);

const fillInputsForStep = async (assetUnit) => {
  const reserveAssetMetadata = await getAssetMetadata(
    perpetualMeta.value.reserve_asset
  );
  asset.value = assetUnit;
  symbol.value = "";
  decimals.value = reserveAssetMetadata?.decimals || 0;
  description.value = "";

  if (route.query.step === "2") {
    description.value = `Asset0 for perpetual futures AA ${currentAA.value}`;
  }
};

const suggestValueForSymbolField = async (reserveSymbol) => {
  if (route.query.step !== "2") return;
  const registryAA = Client.api.getOfficialTokenRegistryAddress();

  let index = 1;
  let newSymbolSuggestion = `${reserveSymbol}_G${index}`;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const asset = await Client.api.getAssetBySymbol(
      registryAA,
      newSymbolSuggestion
    );

    if (!asset) break;

    newSymbolSuggestion = `${reserveSymbol}_G${++index}`;
  }

  symbol.value = newSymbolSuggestion;
};

function delContinueData() {
  localStorage.removeItem("tmp_create");
  localStorage.removeItem("tmp_create_waa");
  localStorage.removeItem("tmp_create_wu");
  localStorage.removeItem("tmp_create_type");
}

watch(exists, async () => {
  const { [currentAA.value]: currentPerpetualMeta } = await getMetaForPerpAAs([
    currentAA.value,
  ]);
  const reserveAsset = currentPerpetualMeta.reserve_asset;
  const asset0 = currentPerpetualMeta.state.asset0;
  perpetualMeta.value = currentPerpetualMeta;

  if (reserveAsset === "base") {
    await router.push({
      path: `/create/${currentAA.value}`,
      query: { step: 2 },
    });
    fillInputsForStep(asset0);
    await suggestValueForSymbolField("GBYTE");
    return;
  }

  const reserveAssetMetadata = await getAssetMetadata(reserveAsset);

  if (!reserveAssetMetadata) {
    await router.push({
      path: `/create/${currentAA.value}`,
      query: { step: 1 },
    });
    fillInputsForStep(reserveAsset);

    return;
  }

  await router.push({
    path: `/create/${currentAA.value}`,
    query: { step: 2 },
  });
  fillInputsForStep(asset0);
  await suggestValueForSymbolField(reserveAssetMetadata.name);
});

emitter.on(`aa_request_${import.meta.env.VITE_REGISTRY_AA}`, async (data) => {
  const payload = parseDataFromRequest(data);

  if (payload.asset === asset.value && route.query.step === "1") {
    const { [currentAA.value]: currentPerpetualMeta } = await getMetaForPerpAAs(
      [currentAA.value]
    );
    perpetualMeta.value = currentPerpetualMeta;

    await router.push({
      path: `/create/${currentAA.value}`,
      query: { step: 2 },
    });
    fillInputsForStep(currentPerpetualMeta.state.asset0);

    return;
  }

  if (payload.asset === asset.value && route.query.step === "2") {
    await router.push({
      path: `/create/${currentAA.value}`,
      query: { step: 3 },
    });
    delContinueData();
  }
});

emitter.on(`aa_response_${import.meta.env.VITE_FACTORY_AA}`, (data) => {
  if (
    data.response.responseVars &&
    data.response.responseVars.address === currentAA.value
  ) {
    exists.value = true;
  }
});

watch([asset, symbol, decimals, description], async () => {
  const registryAA = Client.api.getOfficialTokenRegistryAddress();
  buttonEnabled.value = false;

  if (!symbol.value) {
    return;
  }

  const isSymbolTaken = await Client.api.getAssetBySymbol(
    registryAA,
    symbol.value
  );

  if (isSymbolTaken) {
    isSymbolExists.value = true;
    return;
  }
  isSymbolExists.value = false;

  if (!description.value) {
    return;
  }

  link.value = generateLink(
    100000000,
    {
      asset: asset.value,
      symbol: symbol.value,
      decimals: decimals.value || 0,
      description: description.value,
    },
    null,
    import.meta.env.VITE_REGISTRY_AA,
    "base",
    true
  );

  buttonEnabled.value = true;
});

onMounted(() => {
  Client.api.getDefinition(currentAA.value, function (err, result) {
    if (err) return console.error(err);
    exists.value = !!result;
  });
});
</script>

<template>
  <div class="container w-full sm:w-[512px] m-auto mt-2 p-6 sm:p-8">
    <div v-if="!exists" class="text-center">
      <div class="alert shadow-lg">
        <div class="flex items-center">
          <svg
            class="animate-spin w-8 ml-2 mr-3"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span class="text-left">Waiting for transaction confirmation</span>
        </div>
      </div>
    </div>
    <div v-if="exists && route.query.step !== '3'">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body p-6 sm:p-8">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Asset</span>
            </label>
            <TextInput v-model="asset" readonly />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Symbol</span>
            </label>
            <TextInput
              v-model="symbol"
              @input="() => (symbol = symbol.toUpperCase())"
            />
            <div class="p-1 text-red-500">
              {{ isSymbolExists ? "This symbol is already in use" : "" }}
            </div>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Decimals</span>
            </label>
            <IntegerInput v-model="decimals" />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Description</span>
            </label>
            <textarea
              v-model="description"
              class="textarea textarea-bordered"
            />
          </div>
          <div class="form-control mt-6">
            <a
              class="btn btn-primary"
              :href="link"
              :class="{ '!btn-disabled': !buttonEnabled }"
              >Register symbol</a
            >
          </div>
        </div>
      </div>
    </div>
    <div v-if="exists && route.query.step === '3'" class="text-center">
      <div class="card bg-base-200 shadow-lg p-8">
        <div class="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="stroke-info w-12 ml-2 mr-2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              stroke="currentColor"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span class="text-left">
            Done. After symbol registration for this asset is confirmed, it'll become available for trading.
          </span>
        </div>
        <div class="mt-6 text-center">
          <button
            class="btn btn-sm btn-primary"
            @click="() => router.push('/')"
          >
            Back to trading
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
