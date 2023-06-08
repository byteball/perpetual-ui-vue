<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import emitter from "@/services/emitter";

import Client from "@/services/Obyte";
import { getAssetMetadata, getMetaForPerpAAs } from "@/services/DAGApi";
import { generateLink } from "@/utils/generateLink";
import { parseDataForFactoryRequest } from "@/utils/parseDataForFactoryRequest";

const route = useRoute();
const router = useRouter();

const exists = ref(false);
const link = ref("");
const asset = ref("");
const symbol = ref("");
const decimals = ref(0);
const description = ref("");
const buttonEnabled = ref(false);

const fillInputsForStep = (assetUnit) => {
  asset.value = assetUnit;
  symbol.value = "";
  decimals.value = 0;
  description.value = "";

  if (route.query.step === "2") {
    description.value = `Asset0 for perpetual futures AA ${route.params.aa}`;
  }
};

watch(exists, async () => {
  const currentPerpetualMeta = await getMetaForPerpAAs([route.params.aa]);
  const reserveAsset = currentPerpetualMeta[route.params.aa].reserve_asset;

  if (reserveAsset === "base") {
    await router.push({
      path: `/create/${route.params.aa}`,
      query: { step: 2 },
    });
    fillInputsForStep(currentPerpetualMeta[route.params.aa].state.asset0);

    return;
  }

  const reserveAssetMetadata = await getAssetMetadata(reserveAsset);

  if (!reserveAssetMetadata) {
    await router.push({
      path: `/create/${route.params.aa}`,
      query: { step: 1 },
    });
    fillInputsForStep(currentPerpetualMeta[route.params.aa].reserve_asset);

    return;
  }

  await router.push({
    path: `/create/${route.params.aa}`,
    query: { step: 2 },
  });
  fillInputsForStep(currentPerpetualMeta[route.params.aa].state.asset0);
});

emitter.on(`aa_request_${import.meta.env.VITE_REGISTRY_AA}`, async (data) => {
  const payload = parseDataForFactoryRequest(data);

  if (payload.asset === asset.value && route.query.step === "1") {
    const currentPerpetualMeta = await getMetaForPerpAAs([route.params.aa]);

    await router.push({
      path: `/create/${route.params.aa}`,
      query: { step: 2 },
    });
    fillInputsForStep(currentPerpetualMeta[route.params.aa].state.asset0);

    return;
  }

  if (payload.asset === asset.value && route.query.step === "2") {
    await router.push({
      path: `/create/${route.params.aa}`,
      query: { step: 3 },
    });
  }
});

emitter.on(`aa_response_${import.meta.env.VITE_FACTORY_AA}`, (data) => {
  if (
    data.response.responseVars &&
    data.response.responseVars.address === route.params.aa
  ) {
    exists.value = true;
  }
});

watch([asset, symbol, decimals, description], () => {
  buttonEnabled.value = false;

  if (!symbol.value) {
    return;
  }

  if (decimals.value === "") {
    return;
  }

  if (!description.value) {
    return;
  }

  link.value = generateLink(
    100000000,
    {
      asset: asset.value,
      symbol: symbol.value,
      decimals: decimals.value,
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
  Client.api.getDefinition(route.params.aa, function (err, result) {
    if (err) return console.error(err);
    exists.value = !!result;
  });
});
</script>

<template>
  <div class="container w-[320px] sm:w-[512px] m-auto mt-8 mb-36 p-8">
    <div v-if="!exists" class="text-center">
      <div class="alert shadow-lg">
        <div>
          <svg
            class="animate-spin h-5 w-5 ml-2 mr-3"
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
          <span>Waiting for transaction confirmation</span>
        </div>
      </div>
    </div>
    <div v-if="exists && route.query.step !== '3'">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Asset</span>
            </label>
            <input
              type="text"
              v-model="asset"
              class="input input-bordered"
              readonly
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Symbol</span>
            </label>
            <input
              type="text"
              v-model="symbol"
              @input="() => (symbol = symbol.toUpperCase())"
              class="input input-bordered"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Decimals</span>
            </label>
            <input
              type="number"
              v-model="decimals"
              min="0"
              class="input input-bordered"
            />
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
              :class="{ 'btn-disabled': !buttonEnabled }"
              >Register symbol</a
            >
          </div>
        </div>
      </div>
    </div>
    <div v-if="exists && route.query.step === '3'" class="text-center">
      <div class="alert shadow-lg">
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="stroke-info h-6 w-6 ml-2 mr-2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              stroke="currentColor"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            Done. After confirming the registration of the aa symbol, it will be
            available in the market
          </span>
          <div class="flex-none">
            <button
              class="btn btn-sm btn-primary"
              @click="() => router.push('/')"
            >
              Back to market
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
